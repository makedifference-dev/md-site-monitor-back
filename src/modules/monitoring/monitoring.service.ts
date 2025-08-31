import { type PrismaClient, type Project } from '@prisma/client';
import type { ErrorService } from '../error/error.service';
import { SSLChecker } from './ssl-checker';
import type { NotificationsService } from '../notifications/notifications.service';
import { DatabaseService } from '../core/database/database.service';
import { CacheService } from '../core/cache/cache.service';
import type {
  SiteCheckResult,
  MonitoringStats,
  ProjectCheckHistoryResponse,
} from './monitoring.contract';

export class MonitoringService {
  private prisma: PrismaClient;
  private errorService: ErrorService;
  private notificationsService: NotificationsService;
  private cacheService: CacheService;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 10 * 60 * 1000; // 10 минут
  private readonly REQUEST_TIMEOUT = 30000; // 30 секунд
  private readonly CONCURRENCY: number = Number(
    process.env.MONITOR_CONCURRENCY ?? 5
  );

  constructor(
    errorService: ErrorService,
    notificationsService: NotificationsService
  ) {
    this.prisma = DatabaseService.getInstance();
    this.errorService = errorService;
    this.notificationsService = notificationsService;
    this.cacheService = CacheService.getInstance();
  }

  // Запуск мониторинга
  startMonitoring(): void {
    if (this.monitoringInterval) {
      console.log('Monitoring is already running');
      return;
    }

    console.log('🚀 Starting site monitoring service...');

    // Запускаем первую проверку сразу
    void this.performAllChecks();

    // Устанавливаем интервал для регулярных проверок
    this.monitoringInterval = setInterval(() => {
      void this.performAllChecks();
    }, this.CHECK_INTERVAL);
  }

  // Остановка мониторинга
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Site monitoring service stopped');
    }
  }

  // Инвалидация кэша мониторинга
  private invalidateMonitoringCache(): void {
    this.cacheService.invalidatePattern('monitoring_stats');
    this.cacheService.invalidatePattern('project_history_');
    console.log('🗑️ Monitoring cache invalidated');
  }

  // Выполнение проверки всех активных проектов
  private async performAllChecks(): Promise<void> {
    try {
      console.log(`🔍 Starting site checks at ${new Date().toISOString()}`);

      const activeProjects = await this.prisma.project.findMany({
        where: { isActive: true },
        select: { id: true, websiteUrl: true },
      });

      console.log(`📊 Found ${activeProjects.length} active projects to check`);

      const tasks = activeProjects.map(project => {
        return () => this.checkSingleSite(project.id, project.websiteUrl);
      });

      const results = await this.runWithConcurrency(tasks, this.CONCURRENCY);

      let successCount = 0;
      let errorCount = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          errorCount++;
          this.errorService.logError(
            new Error(
              `Check failed for project ${activeProjects[index]?.id}: ${result.reason}`
            ),
            'Site check failed'
          );
        }
      });

      console.log(
        `✅ Site checks completed: ${successCount} successful, ${errorCount} failed`
      );
    } catch (error) {
      this.errorService.logError(error as Error, 'Error during site checks');
    }
  }
  private async runWithConcurrency<T>(
    tasks: Array<() => Promise<T>>,
    concurrency: number
  ): Promise<Array<PromiseSettledResult<T>>> {
    const results: Array<PromiseSettledResult<T>> = [];
    let index = 0;
    const workers: Array<Promise<void>> = [];
    const worker = async (): Promise<void> => {
      while (index < tasks.length) {
        const current = index++;
        try {
          const fn = tasks[current] as () => Promise<T>;
          const value = await fn();
          results[current] = {
            status: 'fulfilled',
            value,
          } as PromiseFulfilledResult<T>;
        } catch (err) {
          results[current] = {
            status: 'rejected',
            reason: err,
          } as PromiseRejectedResult;
        }
      }
    };
    const workerCount = Math.max(1, Math.min(concurrency, tasks.length));
    for (let i = 0; i < workerCount; i++) {
      workers.push(worker());
    }
    await Promise.all(workers);
    return results;
  }

  // Проверка одного сайта
  private async checkSingleSite(
    projectId: string,
    websiteUrl: string
  ): Promise<void> {
    const startTime = Date.now();
    let status: 'SUCCESS' | 'ERROR' | 'TIMEOUT' = 'ERROR';
    let responseTime: number | undefined;
    let statusCode: number | undefined;
    let error: string | undefined;
    let sslValid: boolean | undefined;
    let sslExpiry: Date | undefined;
    let sslIssuer: string | undefined;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.REQUEST_TIMEOUT
      );
      timeoutId.unref(); // Не блокировать завершение процесса

      const response = await fetch(websiteUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'MD-Site-Monitor/1.0',
        },
      });

      clearTimeout(timeoutId);
      responseTime = Date.now() - startTime;
      statusCode = response.status;

      if (response.ok) {
        status = 'SUCCESS';
      } else {
        status = 'ERROR';
        error = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (fetchError) {
      responseTime = Date.now() - startTime;

      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          status = 'TIMEOUT';
          error = 'Request timeout';
        } else {
          status = 'ERROR';
          error = fetchError.message;
        }
      } else {
        status = 'ERROR';
        error = 'Unknown error occurred';
      }
    }

    // Проверяем SSL сертификат для HTTPS URLs
    if (SSLChecker.isHTTPS(websiteUrl)) {
      try {
        const sslInfo = await SSLChecker.checkSSLCertificate(websiteUrl);
        sslValid = sslInfo.valid;
        sslExpiry = sslInfo.expiry;
        sslIssuer = sslInfo.issuer;

        // Если SSL невалиден, добавляем информацию об ошибке
        if (!sslValid && sslInfo.error) {
          error = error
            ? `${error}; SSL: ${sslInfo.error}`
            : `SSL: ${sslInfo.error}`;
        }
      } catch (sslError) {
        // SSL проверка не должна прерывать основную проверку
        console.warn(`SSL check failed for ${websiteUrl}:`, sslError);
      }
    }

    // Сохраняем результат в базу данных
    await this.prisma.siteCheck.create({
      data: {
        projectId,
        status,
        responseTime,
        statusCode,
        error,
        sslValid,
        sslExpiry,
        sslIssuer,
      },
    });

    // Инвалидируем кэш при новой проверке
    this.invalidateMonitoringCache();

    // Отправляем уведомление при первой неудачной проверке
    if (status !== 'SUCCESS') {
      await this.notificationsService.handleSiteFailure(projectId);
    }
  }

  // Получение статистики мониторинга с кэшированием
  async getMonitoringStats(): Promise<MonitoringStats> {
    const cacheKey = 'monitoring_stats';
    const cacheTTL = 2 * 60 * 1000; // 2 минуты

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [
          totalProjects,
          activeProjects,
          totalChecks,
          successfulChecks,
          averageResponseTime,
          totalSSLChecks,
          validSSLCertificates,
          expiredSSLCertificates,
          sslIssues,
        ] = await Promise.all([
          this.prisma.project.count(),
          this.prisma.project.count({ where: { isActive: true } }),
          this.prisma.siteCheck.count(),
          this.prisma.siteCheck.count({ where: { status: 'SUCCESS' } }),
          this.prisma.siteCheck.aggregate({
            where: { responseTime: { not: null } },
            _avg: { responseTime: true },
          }),
          this.prisma.siteCheck.count({ where: { sslValid: { not: null } } }),
          this.prisma.siteCheck.count({ where: { sslValid: true } }),
          this.prisma.siteCheck.count({
            where: {
              sslValid: false,
              sslExpiry: { not: null },
              error: { contains: 'SSL' },
            },
          }),
          this.prisma.siteCheck.count({
            where: {
              sslValid: false,
              error: { contains: 'SSL' },
            },
          }),
        ]);

        return {
          totalProjects,
          activeProjects,
          successfulChecks,
          failedChecks: totalChecks - successfulChecks,
          averageResponseTime: Math.round(
            averageResponseTime._avg.responseTime ?? 0
          ),
          sslStats: {
            totalSSLChecks,
            validSSLCertificates,
            expiredSSLCertificates,
            sslIssues,
          },
        };
      },
      cacheTTL
    );
  }

  // Получение истории проверок для проекта с пагинацией
  async getProjectCheckHistory(
    projectId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ProjectCheckHistoryResponse | null> {
    // Используем кэш для часто запрашиваемых данных
    const cacheKey = `project_history_${projectId}_${limit}_${offset}`;
    const cacheTTL = 1 * 60 * 1000; // 1 минута

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const project = await this.prisma.project.findFirst({
          where: { id: projectId },
          select: { id: true, name: true, websiteUrl: true },
        });

        if (!project) {
          return null;
        }

        // Получаем общее количество проверок
        const totalChecks = await this.prisma.siteCheck.count({
          where: { projectId },
        });

        // Получаем историю проверок с пагинацией
        const checks = await this.prisma.siteCheck.findMany({
          where: { projectId },
          orderBy: { checkedAt: 'desc' },
          take: Math.min(limit, 100), // Ограничиваем максимум 100 записей
          skip: offset,
          select: {
            id: true,
            status: true,
            responseTime: true,
            statusCode: true,
            error: true,
            sslValid: true,
            sslExpiry: true,
            sslIssuer: true,
            checkedAt: true,
          },
        });

        // Получаем статистику в одном запросе
        const [successfulChecks, averageResponseTime] = await Promise.all([
          this.prisma.siteCheck.count({
            where: { projectId, status: 'SUCCESS' },
          }),
          this.prisma.siteCheck.aggregate({
            where: { projectId, responseTime: { not: null } },
            _avg: { responseTime: true },
          }),
        ]);

        return {
          projectId: project.id,
          projectName: project.name,
          websiteUrl: project.websiteUrl,
          checks,
          totalChecks,
          successRate:
            totalChecks > 0
              ? Math.round((successfulChecks / totalChecks) * 100)
              : 0,
          averageResponseTime: Math.round(
            averageResponseTime._avg.responseTime ?? 0
          ),
          pagination: {
            limit,
            offset,
            hasMore: offset + limit < totalChecks,
          },
        };
      },
      cacheTTL
    );
  }

  // Проверка принадлежности проекта пользователю
  async getUserProject(
    projectId: string,
    userId: string
  ): Promise<Project | null> {
    return this.prisma.project.findFirst({
      where: { id: projectId, userId, isActive: true },
    });
  }

  // Ручная проверка сайта
  async checkSiteManually(projectId: string): Promise<SiteCheckResult> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, isActive: true },
    });

    if (!project) {
      throw this.errorService.createNotFoundError(
        'Project not found or inactive'
      );
    }

    const startTime = Date.now();
    let status: 'SUCCESS' | 'ERROR' | 'TIMEOUT' = 'ERROR';
    let responseTime: number | undefined;
    let statusCode: number | undefined;
    let error: string | undefined;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.REQUEST_TIMEOUT
      );
      timeoutId.unref(); // Не блокировать завершение процесса

      const response = await fetch(project.websiteUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'MD-Site-Monitor/1.0',
        },
      });

      clearTimeout(timeoutId);
      responseTime = Date.now() - startTime;
      statusCode = response.status;

      if (response.ok) {
        status = 'SUCCESS';
      } else {
        status = 'ERROR';
        error = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (fetchError) {
      responseTime = Date.now() - startTime;

      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          status = 'TIMEOUT';
          error = 'Request timeout';
        } else {
          status = 'ERROR';
          error = fetchError.message;
        }
      } else {
        status = 'ERROR';
        error = 'Unknown error occurred';
      }
    }

    // Сохраняем результат в базу данных
    const _siteCheck = await this.prisma.siteCheck.create({
      data: {
        projectId,
        status,
        responseTime,
        statusCode,
        error,
      },
    });

    // Инвалидируем кэш при ручной проверке
    this.invalidateMonitoringCache();

    return {
      projectId,
      websiteUrl: project.websiteUrl,
      status,
      responseTime,
      statusCode,
      error,
    };
  }
}
