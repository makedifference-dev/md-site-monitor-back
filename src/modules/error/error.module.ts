import { ErrorService } from './error.service';
import { ErrorController } from './error.controller';
import type { Request, Response, NextFunction } from 'express';
import type { ApiError } from './error.contract';

export class ErrorModule {
  private service: ErrorService;
  private controller: ErrorController;

  constructor() {
    this.service = new ErrorService();
    this.controller = new ErrorController(this.service);
  }

  // Получить сервис для использования в других модулях
  getService(): ErrorService {
    return this.service;
  }

  // Получить контроллер для использования в других модулях
  getController(): ErrorController {
    return this.controller;
  }

  // Получить middleware обработчика ошибок
  getErrorHandler(): (
    error: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
  ) => void {
    return this.controller.getErrorHandler();
  }

  // Получить middleware обработчика 404
  getNotFoundHandler(): (req: Request, res: Response) => void {
    return this.controller.getNotFoundHandler();
  }
}

export default ErrorModule;
