import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthMiddleware } from './auth.middleware';
import { ErrorService } from '../error/error.service';

export class AuthModule {
  private router: Router;
  private controller: AuthController;
  private service: AuthService;
  private middleware: AuthMiddleware;
  private errorService: ErrorService;

  constructor(errorService?: ErrorService) {
    this.router = Router();
    this.errorService = errorService ?? new ErrorService();
    this.service = new AuthService(this.errorService);
    this.controller = new AuthController(this.service, this.errorService);
    this.middleware = new AuthMiddleware(this.errorService);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Публичные маршруты (не требуют авторизации)
    this.router.post(
      '/register',
      this.controller.register.bind(this.controller)
    );
    this.router.post('/login', this.controller.login.bind(this.controller));
    this.router.post(
      '/refresh',
      this.controller.refreshToken.bind(this.controller)
    );
    this.router.post('/logout', this.controller.logout.bind(this.controller));

    // Защищенные маршруты (требуют авторизации)
    this.router.get(
      '/profile',
      this.middleware.authenticate.bind(this.middleware),
      this.controller.getProfile.bind(this.controller)
    );
    this.router.post(
      '/logout-all',
      this.middleware.authenticate.bind(this.middleware),
      this.controller.logoutAll.bind(this.controller)
    );
  }

  getRouter(): Router {
    return this.router;
  }
}

export default AuthModule;
