import { Router, Request, Response } from 'express';
import { MonitoringService } from './monitoring.service';
import { ErrorService } from '../error/error.service';
import { AuthMiddleware } from '../auth/auth.middleware';
import type { RequestUser } from '../auth/auth.types';

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
      const { projectId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const user = req.user as RequestUser;

      if (!projectId) {
        res.status(400).json({
          error: 'BAD_REQUEST',
          message: 'Project ID is required',
          statusCode: 400,
        });
        return;
      }

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
      const { projectId } = req.params;
      const user = req.user as RequestUser;

      if (!projectId) {
        res.status(400).json({
          error: 'BAD_REQUEST',
          message: 'Project ID is required',
          statusCode: 400,
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
