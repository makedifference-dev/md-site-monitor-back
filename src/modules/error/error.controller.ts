import type { Request, Response, NextFunction } from 'express';
import type { ErrorService } from './error.service';
import type { ApiError } from './error.contract';

export class ErrorController {
  private errorService: ErrorService;

  constructor(errorService: ErrorService) {
    this.errorService = errorService;
  }

  // Глобальный обработчик ошибок
  handleError = (
    error: Error | ApiError,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    // Логируем ошибку
    this.errorService.logError(error, `${req.method} ${req.path}`);

    // Определяем тип ошибки и создаем соответствующий ответ (без каскада ветвей)
    const apiError: ApiError = this.isApiError(error)
      ? error
      : ((): ApiError => {
          const factories: Record<string, (e: Error) => ApiError> = {
            ValidationError: e =>
              this.errorService.createValidationError(e.message),
            UnauthorizedError: e =>
              this.errorService.createAuthError(e.message, 'UNAUTHORIZED'),
            NotFoundError: e =>
              this.errorService.createNotFoundError(e.message),
          };
          const factory = factories[error.name];
          return factory
            ? factory(error)
            : this.errorService.handleUnknownError(error);
        })();

    // Отправляем ответ с ошибкой
    const statusCode = apiError.statusCode ?? 500;
    res.status(statusCode).json(apiError);
  };

  // Обработчик 404 ошибок
  handleNotFound = (req: Request, res: Response): void => {
    const error = this.errorService.createNotFoundError(
      `Route ${req.method} ${req.path} not found`
    );

    this.errorService.logError(error, `${req.method} ${req.path}`);
    res.status(404).json(error);
  };

  // Вспомогательный метод для проверки типа ошибки
  private isApiError(error: unknown): error is ApiError {
    const obj = error as Record<string, unknown> | null | undefined;
    if (obj && typeof obj === 'object') {
      return 'error' in obj && 'message' in obj;
    }
    return false;
  }

  // Метод для получения middleware обработчика ошибок
  getErrorHandler(): (
    error: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
  ) => void {
    return this.handleError.bind(this);
  }

  // Метод для получения middleware обработчика 404
  getNotFoundHandler(): (req: Request, res: Response) => void {
    return this.handleNotFound.bind(this);
  }
}
