import { Request, Response, NextFunction } from 'express';
import { ErrorService } from './error.service';
import { ApiError } from './error.types';

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

    // Определяем тип ошибки и создаем соответствующий ответ
    let apiError: ApiError;

    if (this.isApiError(error)) {
      apiError = error;
    } else if (error.name === 'ValidationError') {
      apiError = this.errorService.createValidationError(error.message);
    } else if (error.name === 'UnauthorizedError') {
      apiError = this.errorService.createAuthError(
        error.message,
        'UNAUTHORIZED'
      );
    } else if (error.name === 'NotFoundError') {
      apiError = this.errorService.createNotFoundError(error.message);
    } else {
      apiError = this.errorService.handleUnknownError(error);
    }

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
    return (
      !!error &&
      typeof error === 'object' &&
      'error' in (error as Record<string, unknown>) &&
      'message' in (error as Record<string, unknown>)
    );
  }

  // Метод для получения middleware обработчика ошибок
  getErrorHandler() {
    return this.handleError.bind(this);
  }

  // Метод для получения middleware обработчика 404
  getNotFoundHandler() {
    return this.handleNotFound.bind(this);
  }
}
