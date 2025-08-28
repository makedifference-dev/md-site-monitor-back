import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ErrorService } from '../error/error.service';

export class AuthMiddleware {
  private authService: AuthService;
  private errorService: ErrorService;

  constructor(errorService?: ErrorService) {
    this.authService = new AuthService();
    this.errorService = errorService ?? new ErrorService();
  }

  // Middleware для проверки авторизации
  authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        const error = this.errorService.createAuthError(
          'Authorization token not provided',
          'UNAUTHORIZED'
        );
        res.status(401).json(error);
        return;
      }

      const token = authHeader.substring(7);
      const user = await this.authService.validateToken(token);
      // Записываем в req.user только безопасные поля
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        fullName: user.fullName,
        phone: user.phone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      } as import('./auth.types').RequestUser;

      next();
    } catch {
      const authError = this.errorService.createAuthError(
        'Invalid authorization token',
        'UNAUTHORIZED'
      );
      res.status(401).json(authError);
    }
  };

  // Middleware для проверки ролей (если понадобится в будущем)
  requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = req.user;

      if (!user) {
        const error = this.errorService.createAuthError(
          'User not authorized',
          'UNAUTHORIZED'
        );
        res.status(401).json(error);
        return;
      }

      if (!roles.includes(user.role)) {
        const error = this.errorService.createAuthError(
          'Insufficient permissions to perform operation',
          'FORBIDDEN'
        );
        res.status(403).json(error);
        return;
      }

      next();
    };
  };
}
