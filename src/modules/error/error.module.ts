import { ErrorService } from './error.service';
import { ErrorController } from './error.controller';

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
  getErrorHandler() {
    return this.controller.getErrorHandler();
  }

  // Получить middleware обработчика 404
  getNotFoundHandler() {
    return this.controller.getNotFoundHandler();
  }
}

export default ErrorModule;
