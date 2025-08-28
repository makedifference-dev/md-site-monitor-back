import { Router } from 'express';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { AuthMiddleware } from '../auth/auth.middleware';
import { ErrorService } from '../error/error.service';

export class ProjectsModule {
  private router: Router;
  private controller: ProjectsController;
  private service: ProjectsService;
  private authMiddleware: AuthMiddleware;
  private errorService: ErrorService;

  constructor(errorService?: ErrorService) {
    this.router = Router();
    this.errorService = errorService ?? new ErrorService();
    this.service = new ProjectsService(this.errorService);
    this.controller = new ProjectsController(this.service, this.errorService);
    this.authMiddleware = new AuthMiddleware(this.errorService);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Все маршруты требуют авторизации
    this.router.use(this.authMiddleware.authenticate.bind(this.authMiddleware));

    // Создание проекта
    this.router.post('/', this.controller.createProject.bind(this.controller));

    // Получение списка проектов пользователя
    this.router.get('/', this.controller.getUserProjects.bind(this.controller));

    // Получение проекта по ID
    this.router.get(
      '/:projectId',
      this.controller.getProjectById.bind(this.controller)
    );

    // Обновление названия проекта
    this.router.put(
      '/:projectId',
      this.controller.updateProjectName.bind(this.controller)
    );

    // Деактивация проекта
    this.router.delete(
      '/:projectId',
      this.controller.deactivateProject.bind(this.controller)
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
