import { PrismaClient } from '@prisma/client';
import { DatabaseService } from '../core/database/database.service';
import { ConfigService } from '../core/config.service';
import type { HealthCheck, HealthStatus } from './health.types';

export type { HealthCheck, HealthStatus };

export class HealthService {
  private prisma: PrismaClient;
  private configService: ConfigService;

  constructor() {
    this.prisma = DatabaseService.getInstance();
    this.configService = ConfigService.getInstance();
  }

  /**
   * Получение общего статуса здоровья системы
   */
  async getHealthStatus(): Promise<HealthStatus> {
    // const startTime = Date.now(); // Не используется

    const [databaseCheck, memoryCheck, diskCheck] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkDisk(),
    ]);

    const checks = {
      database: databaseCheck,
      memory: memoryCheck,
      disk: diskCheck,
    };

    // Определяем общий статус
    const allHealthy = Object.values(checks).every(
      check => check.status === 'healthy'
    );
    const anyUnhealthy = Object.values(checks).some(
      check => check.status === 'unhealthy'
    );

    let status: 'healthy' | 'unhealthy' | 'degraded';
    if (allHealthy) {
      status = 'healthy';
    } else if (anyUnhealthy) {
      status = 'unhealthy';
    } else {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date(),
      uptime: process.uptime(),
      version: this.configService.appVersion,
      environment: this.configService.nodeEnv,
      checks,
    };
  }

  /**
   * Проверка подключения к базе данных
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        message: 'Database connection is working',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Проверка использования памяти
   */
  private checkMemory(): HealthCheck {
    const memUsage = process.memoryUsage();
    const usedMemoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const totalMemoryMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const memoryUsagePercent = (usedMemoryMB / totalMemoryMB) * 100;

    // Считаем критичным использование более 90% памяти
    if (memoryUsagePercent > 90) {
      return {
        status: 'unhealthy',
        message: `High memory usage: ${memoryUsagePercent.toFixed(1)}% (${usedMemoryMB}MB/${totalMemoryMB}MB)`,
      };
    }

    // Предупреждение при использовании более 80% памяти
    if (memoryUsagePercent > 80) {
      return {
        status: 'degraded',
        message: `Elevated memory usage: ${memoryUsagePercent.toFixed(1)}% (${usedMemoryMB}MB/${totalMemoryMB}MB)`,
      };
    }

    return {
      status: 'healthy',
      message: `Memory usage: ${memoryUsagePercent.toFixed(1)}% (${usedMemoryMB}MB/${totalMemoryMB}MB)`,
    };
  }

  /**
   * Проверка дискового пространства (базовая реализация)
   */
  private checkDisk(): HealthCheck {
    // В Node.js нет прямого доступа к информации о диске
    // В продакшене можно использовать внешние библиотеки или системные вызовы
    return {
      status: 'healthy',
      message: 'Disk space check not implemented',
    };
  }

  /**
   * Детальная проверка базы данных
   */
  async getDetailedDatabaseHealth(): Promise<{
    connection: boolean;
    tables: { [key: string]: number };
    performance: {
      avgQueryTime: number;
      totalQueries: number;
    };
  }> {
    try {
      // Проверяем основные таблицы
      const [usersCount, projectsCount, siteChecksCount] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.project.count(),
        this.prisma.siteCheck.count(),
      ]);

      return {
        connection: true,
        tables: {
          users: usersCount,
          projects: projectsCount,
          siteChecks: siteChecksCount,
        },
        performance: {
          avgQueryTime: 0, // Можно добавить метрики производительности
          totalQueries: 0,
        },
      };
    } catch (error) {
      throw new Error(
        `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
