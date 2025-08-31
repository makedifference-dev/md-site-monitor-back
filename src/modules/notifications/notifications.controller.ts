import { Router, type Request, type Response } from 'express';
import type { NotificationsService } from './notifications.service';
import {
  validateSendTestEmail,
  type SendTestEmailRequest,
} from './notifications.contract';
import type { ErrorService } from '../error/error.service';
import type { AuthMiddleware } from '../auth/auth.middleware';
import type { RequestUser } from '../auth/auth.contract';

export class NotificationsController {
  private router: Router;
  private notificationsService: NotificationsService;
  private errorService: ErrorService;
  private authMiddleware: AuthMiddleware;

  constructor(
    notificationsService: NotificationsService,
    errorService: ErrorService,
    authMiddleware: AuthMiddleware
  ) {
    this.router = Router();
    this.notificationsService = notificationsService;
    this.errorService = errorService;
    this.authMiddleware = authMiddleware;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Тестовый эндпоинт для отправки email (только для админов)
    this.router.post(
      '/test-email',
      this.authMiddleware.authenticate,
      this.sendTestEmail.bind(this)
    );
  }

  private async sendTestEmail(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as RequestUser;

      // Проверяем, что пользователь является администратором
      if (user.role !== 'ADMIN') {
        res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Access denied. Admin role required.',
          statusCode: 403,
        });
        return;
      }

      const parsed = validateSendTestEmail(req.body);
      if (!parsed.ok) {
        res.status(400).json({
          error: 'BAD_REQUEST',
          message: parsed.message,
          statusCode: 400,
        });
        return;
      }
      const { to, subject, message } = parsed.data as SendTestEmailRequest;

      const success = await this.notificationsService.sendEmail({
        to,
        subject,
        html: `<h1>Test Email</h1><p>${message}</p>`,
        text: message,
      });

      if (success) {
        res.json({
          message: 'Test email sent successfully',
          data: { to, subject },
        });
      } else {
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Failed to send test email',
          statusCode: 500,
        });
      }
    } catch (error) {
      this.errorService.handleUnknownError(error);
    }
  }

  getRouter(): Router {
    return this.router;
  }
}
