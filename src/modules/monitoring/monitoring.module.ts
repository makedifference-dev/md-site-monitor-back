import { Router } from 'express';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { ErrorService } from '../error/error.service';
import { AuthMiddleware } from '../auth/auth.middleware';
import { NotificationsService } from '../notifications/notifications.service';
import { TelegramService } from '../telegram/telegram.service';

export class MonitoringModule {
  private router: Router;
  private monitoringController: MonitoringController;
  private monitoringService: MonitoringService;
  private errorService: ErrorService;
  private authMiddleware: AuthMiddleware;
  private notificationsService: NotificationsService;

  constructor(errorService?: ErrorService) {
    this.router = Router();
    this.errorService = errorService ?? new ErrorService();
    this.authMiddleware = new AuthMiddleware();
    this.notificationsService = new NotificationsService(
      this.errorService,
      new TelegramService(this.errorService)
    );
    this.monitoringService = new MonitoringService(
      this.errorService,
      this.notificationsService
    );
    this.monitoringController = new MonitoringController(
      this.monitoringService,
      this.errorService,
      this.authMiddleware
    );
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Expose routes relative to module root; base is mounted in AppModule
    this.router.use('/', this.monitoringController.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }

  public startMonitoring(): void {
    this.monitoringService.startMonitoring();
  }

  public stopMonitoring(): void {
    this.monitoringService.stopMonitoring();
  }
}
