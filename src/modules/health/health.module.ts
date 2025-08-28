import { Router } from 'express';
import { HealthController } from './health.controller';
import { ErrorService } from '../error/error.service';

export class HealthModule {
  private router: Router;
  private controller: HealthController;
  private errorService: ErrorService;

  constructor(errorService?: ErrorService) {
    this.router = Router();
    this.errorService = errorService ?? new ErrorService();
    this.controller = new HealthController(this.errorService);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Основной health check
    this.router.get('/health', this.controller.getHealth.bind(this.controller));

    // Детальная проверка базы данных
    this.router.get(
      '/health/database',
      this.controller.getDatabaseHealth.bind(this.controller)
    );

    // Простой ping
    this.router.get('/ping', this.controller.ping.bind(this.controller));

    // Информация о версии
    this.router.get(
      '/version',
      this.controller.getVersion.bind(this.controller)
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
