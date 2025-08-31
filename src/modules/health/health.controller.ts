import type { Request, Response } from 'express';
import { HealthService } from './health.service';
import type { ErrorService } from '../error/error.service';
import { ConfigService } from '../core/config.service';

export class HealthController {
  private healthService: HealthService;
  private errorService: ErrorService;
  private configService: ConfigService;

  constructor(errorService: ErrorService) {
    this.healthService = new HealthService();
    this.errorService = errorService;
    this.configService = ConfigService.getInstance();
  }

  /**
   * Основной health check эндпоинт
   */
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = await this.healthService.getHealthStatus();

      const statusCode =
        healthStatus.status === 'healthy'
          ? 200
          : healthStatus.status === 'degraded'
            ? 200
            : 503;

      res.status(statusCode).json(healthStatus);
    } catch (error) {
      const apiError = this.errorService.handleUnknownError(error);
      res.status(500).json(apiError);
    }
  }

  /**
   * Детальная проверка базы данных
   */
  async getDatabaseHealth(req: Request, res: Response): Promise<void> {
    try {
      const dbHealth = await this.healthService.getDetailedDatabaseHealth();
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: dbHealth,
      });
    } catch (error) {
      const apiError = this.errorService.handleUnknownError(error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          connection: false,
          error: apiError.message,
        },
      });
    }
  }

  /**
   * Простой ping эндпоинт
   */
  ping(req: Request, res: Response): void {
    res.status(200).json({
      message: 'pong',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  /**
   * Информация о версии
   */
  getVersion(req: Request, res: Response): void {
    res.status(200).json({
      version: this.configService.appVersion,
      environment: this.configService.nodeEnv,
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString(),
    });
  }
}
