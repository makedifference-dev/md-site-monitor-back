import { Request, Response } from 'express';
import { HealthController } from '@/modules/health/health.controller';
import { HealthService } from '@/modules/health/health.service';
import { ErrorService } from '@/modules/error/error.service';

// Мокаем HealthService и ErrorService
jest.mock('../../modules/health/health.service');
jest.mock('../../modules/error/error.service');
const MockedHealthService = HealthService;
const MockedErrorService = ErrorService;

describe('HealthController', () => {
  let healthController: HealthController;
  let mockHealthService: jest.Mocked<HealthService>;
  let mockErrorService: jest.Mocked<ErrorService>;
  const MockedHealthService = HealthService as unknown as jest.MockedClass<
    typeof HealthService
  >;
  const MockedErrorService = ErrorService as unknown as jest.MockedClass<
    typeof ErrorService
  >;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Очищаем все моки
    jest.clearAllMocks();

    // Создаем мок HealthService
    mockHealthService = {
      getHealthStatus: jest.fn(),
      getDetailedDatabaseHealth: jest.fn(),
    } as any;

    // Создаем мок ErrorService
    mockErrorService = {
      handleUnknownError: jest.fn(),
    } as any;

    // Мокаем конструкторы
    MockedHealthService.mockImplementation(() => mockHealthService);
    MockedErrorService.mockImplementation(() => mockErrorService);

    // Создаем экземпляр контроллера
    healthController = new HealthController(mockErrorService);

    // Создаем моки для Request и Response
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();

    mockRequest = {};
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
  });

  describe('getHealth', () => {
    it('should return healthy status with 200 code', async () => {
      const healthStatus = {
        status: 'healthy' as const,
        timestamp: new Date(),
        checks: {
          database: { status: 'healthy' as const },
          memory: { status: 'healthy' as const },
          disk: { status: 'healthy' as const },
        },
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
      };
      mockHealthService.getHealthStatus.mockResolvedValue(healthStatus);

      await healthController.getHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockHealthService.getHealthStatus).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(healthStatus);
    });

    it('should return degraded status with 200 code', async () => {
      const healthStatus = {
        status: 'degraded' as const,
        timestamp: new Date(),
        checks: {
          database: { status: 'healthy' as const },
          memory: { status: 'degraded' as const },
          disk: { status: 'healthy' as const },
        },
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
      };
      mockHealthService.getHealthStatus.mockResolvedValue(healthStatus);

      await healthController.getHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockHealthService.getHealthStatus).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(healthStatus);
    });

    it('should return unhealthy status with 503 code', async () => {
      const healthStatus = {
        status: 'unhealthy' as const,
        timestamp: new Date(),
        checks: {
          database: { status: 'unhealthy' as const },
          memory: { status: 'healthy' as const },
          disk: { status: 'healthy' as const },
        },
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
      };
      mockHealthService.getHealthStatus.mockResolvedValue(healthStatus);

      await healthController.getHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockHealthService.getHealthStatus).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith(healthStatus);
    });

    it('should handle health service error', async () => {
      const error = new Error('Health check failed');
      const apiError = {
        status: 'error',
        message: 'Health check failed',
        error: 'INTERNAL_ERROR' as const,
      };
      mockHealthService.getHealthStatus.mockRejectedValue(error);
      mockErrorService.handleUnknownError.mockReturnValue(apiError);

      await healthController.getHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockHealthService.getHealthStatus).toHaveBeenCalled();
      expect(mockErrorService.handleUnknownError).toHaveBeenCalledWith(error);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(apiError);
    });
  });

  describe('getDatabaseHealth', () => {
    it('should return database health successfully', async () => {
      const dbHealth = {
        connection: true,
        tables: { users: 100, projects: 50 },
        performance: { avgQueryTime: 5, totalQueries: 1000 },
      };
      mockHealthService.getDetailedDatabaseHealth.mockResolvedValue(dbHealth);

      await healthController.getDatabaseHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockHealthService.getDetailedDatabaseHealth).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        database: dbHealth,
      });
    });

    it('should handle database health error', async () => {
      const error = new Error('Database connection failed');
      const apiError = {
        status: 'error',
        message: 'Database connection failed',
        error: 'INTERNAL_ERROR' as const,
      };
      mockHealthService.getDetailedDatabaseHealth.mockRejectedValue(error);
      mockErrorService.handleUnknownError.mockReturnValue(apiError);

      await healthController.getDatabaseHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockHealthService.getDetailedDatabaseHealth).toHaveBeenCalled();
      expect(mockErrorService.handleUnknownError).toHaveBeenCalledWith(error);
      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'unhealthy',
        timestamp: expect.any(String),
        database: {
          connection: false,
          error: apiError.message,
        },
      });
    });
  });

  describe('ping', () => {
    it('should return pong response', async () => {
      await healthController.ping(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'pong',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      });
    });
  });

  describe('getVersion', () => {
    it('should return version information', async () => {
      await healthController.getVersion(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        version: expect.any(String),
        environment: expect.any(String),
        nodeVersion: expect.any(String),
        platform: expect.any(String),
        timestamp: expect.any(String),
      });
    });
  });
});
