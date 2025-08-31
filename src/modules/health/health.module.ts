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
    // Expose routes relative to module root; base is mounted in AppModule
    // Основной health check
    this.router.get('/', this.controller.getHealth.bind(this.controller));

    // Детальная проверка базы данных
    this.router.get(
      '/database',
      this.controller.getDatabaseHealth.bind(this.controller)
    );

    // Простой ping и версия убраны по требованию
  }

  getRouter(): Router {
    return this.router;
  }
}
