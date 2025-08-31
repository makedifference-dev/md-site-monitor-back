import { Router } from 'express';
import ApiInfoModule from './api-info/api-info.module';
import DocsModule from './docs/docs.module';
import { ConfigService } from './core/config.service';
import AuthModule from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TelegramModule } from './telegram/telegram.module';
import { HealthModule } from './health/health.module';
import ErrorModule from './error/error.module';

export class AppModule {
  private router: Router;
  private apiInfoModule: ApiInfoModule;
  private docsModule: DocsModule;
  private authModule: AuthModule;
  private projectsModule: ProjectsModule;
  private monitoringModule: MonitoringModule;
  private notificationsModule: NotificationsModule;
  private telegramModule: TelegramModule;
  private healthModule: HealthModule;
  private errorModule: ErrorModule;

  constructor() {
    this.router = Router();
    this.errorModule = new ErrorModule();
    this.apiInfoModule = new ApiInfoModule();
    this.docsModule = new DocsModule();
    this.authModule = new AuthModule(this.errorModule.getService());
    this.projectsModule = new ProjectsModule(this.errorModule.getService());
    this.monitoringModule = new MonitoringModule(this.errorModule.getService());
    this.notificationsModule = new NotificationsModule(
      this.errorModule.getService()
    );
    this.telegramModule = new TelegramModule(this.errorModule.getService());
    this.healthModule = new HealthModule(this.errorModule.getService());
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeRoutes(): void {
    // Основные маршруты
    this.router.use('/', this.apiInfoModule.getRouter());

    // Документация API: включаем только в dev или если явно разрешено
    const config = ConfigService.getInstance();
    if (config.isDevelopment || config.swaggerEnabled) {
      this.router.use('/api-docs', this.docsModule.getRouter());
    }

    // Авторизация
    this.router.use('/auth', this.authModule.getRouter());

    // Проекты
    this.router.use('/projects', this.projectsModule.getRouter());

    // Мониторинг
    this.router.use('/monitoring', this.monitoringModule.getRouter());

    // Уведомления
    this.router.use('/notifications', this.notificationsModule.getRouter());

    // Health check
    this.router.use('/health', this.healthModule.getRouter());
  }

  private initializeErrorHandling(): void {
    // Обработка ошибок через Error модуль
    this.router.use(this.errorModule.getErrorHandler());

    // 404 handler через Error модуль
    this.router.use(this.errorModule.getNotFoundHandler());
  }

  getRouter(): Router {
    return this.router;
  }

  // Получить Error модуль для использования в app.ts
  getErrorModule(): ErrorModule {
    return this.errorModule;
  }

  // Получить Telegram модуль для использования в app.ts
  getTelegramModule(): TelegramModule {
    return this.telegramModule;
  }

  // Получить Monitoring модуль для использования в app.ts
  getMonitoringModule(): MonitoringModule {
    return this.monitoringModule;
  }
}

export default AppModule;
