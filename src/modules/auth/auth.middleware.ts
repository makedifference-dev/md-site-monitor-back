import type { Request, Response, NextFunction } from 'express';
import type { RequestUser } from './auth.contract';
import { AuthService } from './auth.service';
import { ErrorService } from '../error/error.service';

export class AuthMiddleware {
  private authService: AuthService;
  private errorService: ErrorService;

  constructor(errorService: ErrorService = new ErrorService()) {
    this.authService = new AuthService();
    this.errorService = errorService;
  }

  // Middleware для проверки авторизации
  authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization ?? '';

      if (!authHeader.startsWith('Bearer ')) {
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
      } as RequestUser;

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
      const role = user?.role;
      const hasAccess = role !== undefined && roles.includes(role);

      if (!hasAccess) {
        // Вычисляем код/статус без дополнительных ветвлений
        const index = user ? 1 : 0; // 0 -> UNAUTHORIZED(401), 1 -> FORBIDDEN(403)
        const codes = ['UNAUTHORIZED', 'FORBIDDEN'] as const;
        const statuses = [401, 403] as const;
        const messages = [
          'User not authorized',
          'Insufficient permissions to perform operation',
        ] as const;

        const error = this.errorService.createAuthError(
          messages[index],
          codes[index]
        );
        res.status(statuses[index]).json(error);
        return;
      }

      next();
    };
  };
}
