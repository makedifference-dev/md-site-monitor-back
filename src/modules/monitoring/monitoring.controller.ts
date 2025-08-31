import { Router, type Request, type Response } from 'express';
import type { MonitoringService } from './monitoring.service';
import type { ErrorService } from '../error/error.service';
import type { AuthMiddleware } from '../auth/auth.middleware';
import type { RequestUser } from '../auth/auth.contract';
import { validateProjectIdParam as _validateProjectIdParam } from '../projects/projects.contract';
import {
  type MonitoringProjectIdParam,
  monitoringPaginationSchema,
  validateMonitoringProjectIdParam,
} from './monitoring.contract';

export class MonitoringController {
  private router: Router;
  private monitoringService: MonitoringService;
  private errorService: ErrorService;
  private authMiddleware: AuthMiddleware;

  constructor(
    monitoringService: MonitoringService,
    errorService: ErrorService,
    authMiddleware: AuthMiddleware
  ) {
    this.router = Router();
    this.monitoringService = monitoringService;
    this.errorService = errorService;
    this.authMiddleware = authMiddleware;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Получение статистики мониторинга
    this.router.get(
      '/stats',
      this.authMiddleware.authenticate,
      this.getMonitoringStats.bind(this)
    );

    // Получение истории проверок для проекта
    this.router.get(
      '/projects/:projectId/history',
      this.authMiddleware.authenticate,
      this.getProjectCheckHistory.bind(this)
    );

    // Ручная проверка сайта
    this.router.post(
      '/projects/:projectId/check',
      this.authMiddleware.authenticate,
      this.checkSiteManually.bind(this)
    );
  }

  private async getMonitoringStats(req: Request, res: Response): Promise<void> {
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

      const stats = await this.monitoringService.getMonitoringStats();

      res.json({
        message: 'Monitoring statistics',
        data: stats,
      });
    } catch (error) {
      this.errorService.handleUnknownError(error);
    }
  }

  private async getProjectCheckHistory(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const idParsed = validateMonitoringProjectIdParam(req.params);
      if (!idParsed.ok) {
        res.status(400).json({
          error: 'BAD_REQUEST',
          message: idParsed.message,
          statusCode: 400,
        });
        return;
      }
      const { projectId } = idParsed.data as MonitoringProjectIdParam;
      const { limit, offset } = monitoringPaginationSchema.parse({
        limit: req.query.limit,
        offset: req.query.offset,
      });
      const user = req.user as RequestUser;

      // Проверяем, что проект принадлежит пользователю
      const project = await this.monitoringService.getProjectCheckHistory(
        projectId,
        limit,
        offset
      );

      if (!project) {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Project not found',
          statusCode: 404,
        });
        return;
      }

      // Проверяем, что проект принадлежит текущему пользователю
      const userProject = await this.monitoringService.getUserProject(
        projectId,
        user.id
      );
      if (!userProject) {
        res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Access denied to this project',
          statusCode: 403,
        });
        return;
      }

      res.json({
        message: 'Project check history',
        data: project,
      });
    } catch (error) {
      this.errorService.handleUnknownError(error);
    }
  }

  private async checkSiteManually(req: Request, res: Response): Promise<void> {
    try {
      const idParsed2 = validateMonitoringProjectIdParam(req.params);
      if (!idParsed2.ok) {
        res.status(400).json({
          error: 'BAD_REQUEST',
          message: idParsed2.message,
          statusCode: 400,
        });
        return;
      }
      const { projectId } = idParsed2.data as MonitoringProjectIdParam;
      const user = req.user as RequestUser;

      // Проверяем, что проект принадлежит текущему пользователю
      const userProject = await this.monitoringService.getUserProject(
        projectId,
        user.id
      );
      if (!userProject) {
        res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Access denied to this project',
          statusCode: 403,
        });
        return;
      }

      const result = await this.monitoringService.checkSiteManually(projectId);

      res.json({
        message: 'Site check completed',
        data: result,
      });
    } catch (error) {
      this.errorService.handleUnknownError(error);
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
