import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ErrorService } from '../error/error.service';
import { AuthMiddleware } from '../auth/auth.middleware';
import { TelegramService } from '../telegram/telegram.service';

export class NotificationsModule {
  private router: Router;
  private notificationsController: NotificationsController;
  private notificationsService: NotificationsService;
  private errorService: ErrorService;
  private authMiddleware: AuthMiddleware;
  private telegramService: TelegramService;

  constructor(errorService?: ErrorService) {
    this.router = Router();
    this.errorService = errorService ?? new ErrorService();
    this.authMiddleware = new AuthMiddleware(this.errorService);
    this.telegramService = new TelegramService(this.errorService);
    this.notificationsService = new NotificationsService(
      this.errorService,
      this.telegramService
    );
    this.notificationsController = new NotificationsController(
      this.notificationsService,
      this.errorService,
      this.authMiddleware
    );
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.use('/notifications', this.notificationsController.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }

  public getNotificationsService(): NotificationsService {
    return this.notificationsService;
  }
}
