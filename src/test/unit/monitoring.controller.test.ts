import { MonitoringController } from '../../modules/monitoring/monitoring.controller';
import { MonitoringService } from '../../modules/monitoring/monitoring.service';
import { ErrorService } from '../../modules/error/error.service';
import { AuthMiddleware } from '../../modules/auth/auth.middleware';
import { Request, Response } from 'express';

// Мокаем зависимости
jest.mock('../../modules/monitoring/monitoring.service');
jest.mock('../../modules/error/error.service');
jest.mock('../../modules/auth/auth.middleware');

describe('MonitoringController', () => {
  let monitoringController: MonitoringController;
  let mockMonitoringService: jest.Mocked<MonitoringService>;
  let mockErrorService: jest.Mocked<ErrorService>;
  let mockAuthMiddleware: jest.Mocked<AuthMiddleware>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Создаем моки
    mockMonitoringService = {
      getMonitoringStats: jest.fn(),
      getProjectCheckHistory: jest.fn(),
      getUserProject: jest.fn(),
      checkSiteManually: jest.fn(),
    } as any;

    mockErrorService = {
      handleUnknownError: jest.fn(),
    } as any;

    mockAuthMiddleware = {
      authenticate: jest.fn(),
    } as any;

    // Создаем моки для Express
    mockRequest = {
      params: {},
      query: {},
      user: {
        id: 'user-1',
        email: 'user@example.com',
        fullName: 'Test User',
        phone: null,
        telegramId: null,
        telegramUsername: null,
        isActive: true,
        role: 'USER' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    monitoringController = new MonitoringController(
      mockMonitoringService,
      mockErrorService,
      mockAuthMiddleware
    );
  });

  describe('constructor', () => {
    it('should create monitoring controller instance', () => {
      expect(monitoringController).toBeDefined();
    });
  });

  describe('getRouter', () => {
    it('should return router instance', () => {
      const router = monitoringController.getRouter();
      expect(router).toBeDefined();
    });
  });

  describe('getMonitoringStats', () => {
    it('should return monitoring stats for admin user', async () => {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        fullName: 'Admin User',
        phone: null,
        telegramId: null,
        telegramUsername: null,
        isActive: true,
        role: 'ADMIN' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockStats = {
        totalProjects: 10,
        activeProjects: 8,
        successfulChecks: 950,
        failedChecks: 50,
        averageResponseTime: 200,
        sslStats: {
          totalSSLChecks: 10,
          validSSLCertificates: 8,
          expiredSSLCertificates: 1,
          sslIssues: 1,
        },
      };

      mockRequest.user = adminUser;
      mockMonitoringService.getMonitoringStats.mockResolvedValue(mockStats);

      await monitoringController['getMonitoringStats'](
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockMonitoringService.getMonitoringStats).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Monitoring statistics',
        data: mockStats,
      });
    });

    it('should return 403 for non-admin user', async () => {
      const regularUser = {
        id: 'user-1',
        email: 'user@example.com',
        fullName: 'Test User',
        phone: null,
        telegramId: null,
        telegramUsername: null,
        isActive: true,
        role: 'USER' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRequest.user = regularUser;

      await monitoringController['getMonitoringStats'](
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'FORBIDDEN',
        message: 'Access denied. Admin role required.',
        statusCode: 403,
      });
    });

    it('should handle errors', async () => {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        fullName: 'Admin User',
        phone: null,
        telegramId: null,
        telegramUsername: null,
        isActive: true,
        role: 'ADMIN' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRequest.user = adminUser;
      mockMonitoringService.getMonitoringStats.mockRejectedValue(
        new Error('Database error')
      );

      await monitoringController['getMonitoringStats'](
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.handleUnknownError).toHaveBeenCalled();
    });
  });

  describe('getProjectCheckHistory', () => {
    it('should return project check history', async () => {
      const projectId = 'project-1';
      const mockHistory = {
        projectId: 'project-1',
        projectName: 'Test Project',
        websiteUrl: 'https://example.com',
        totalChecks: 100,
        successRate: 95.5,
        averageResponseTime: 200,
        checks: [],
        pagination: {
          total: 100,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      };

      mockRequest.params = { projectId };
      mockRequest.query = { limit: '10', offset: '0' };
      mockMonitoringService.getProjectCheckHistory.mockResolvedValue(
        mockHistory
      );
      mockMonitoringService.getUserProject.mockResolvedValue({
        id: projectId,
        name: 'Test Project',
        websiteUrl: 'https://example.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1',
      });

      await monitoringController['getProjectCheckHistory'](
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockMonitoringService.getProjectCheckHistory).toHaveBeenCalledWith(
        projectId,
        10,
        0
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Project check history',
        data: mockHistory,
      });
    });

    it('should return 400 when project ID is missing', async () => {
      mockRequest.params = {};

      await monitoringController['getProjectCheckHistory'](
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'BAD_REQUEST',
        message: 'Project ID is required',
        statusCode: 400,
      });
    });

    it('should return 404 when project not found', async () => {
      const projectId = 'project-1';
      mockRequest.params = { projectId };
      mockMonitoringService.getProjectCheckHistory.mockResolvedValue(null);

      await monitoringController['getProjectCheckHistory'](
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'NOT_FOUND',
        message: 'Project not found',
        statusCode: 404,
      });
    });

    it('should return 403 when user does not own project', async () => {
      const projectId = 'project-1';
      const mockHistory = {
        projectId: 'project-1',
        projectName: 'Test Project',
        websiteUrl: 'https://example.com',
        totalChecks: 100,
        successRate: 95.5,
        averageResponseTime: 200,
        checks: [],
        pagination: {
          total: 100,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      };

      mockRequest.params = { projectId };
      mockMonitoringService.getProjectCheckHistory.mockResolvedValue(
        mockHistory
      );
      mockMonitoringService.getUserProject.mockResolvedValue(null);

      await monitoringController['getProjectCheckHistory'](
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'FORBIDDEN',
        message: 'Access denied to this project',
        statusCode: 403,
      });
    });

    it('should use default pagination values', async () => {
      const projectId = 'project-1';
      const mockHistory = {
        projectId: 'project-1',
        projectName: 'Test Project',
        websiteUrl: 'https://example.com',
        totalChecks: 100,
        successRate: 95.5,
        averageResponseTime: 200,
        checks: [],
        pagination: {
          total: 100,
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      };

      mockRequest.params = { projectId };
      mockRequest.query = {};
      mockMonitoringService.getProjectCheckHistory.mockResolvedValue(
        mockHistory
      );
      mockMonitoringService.getUserProject.mockResolvedValue({
        id: projectId,
        name: 'Test Project',
        websiteUrl: 'https://example.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1',
      });

      await monitoringController['getProjectCheckHistory'](
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockMonitoringService.getProjectCheckHistory).toHaveBeenCalledWith(
        projectId,
        50,
        0
      );
    });

    it('should handle errors', async () => {
      const projectId = 'project-1';
      mockRequest.params = { projectId };
      mockMonitoringService.getProjectCheckHistory.mockRejectedValue(
        new Error('Database error')
      );

      await monitoringController['getProjectCheckHistory'](
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.handleUnknownError).toHaveBeenCalled();
    });
  });

  describe('checkSiteManually', () => {
    it('should perform manual site check', async () => {
      const projectId = 'project-1';
      const mockResult = {
        projectId: 'project-1',
        websiteUrl: 'https://example.com',
        status: 'SUCCESS' as const,
        responseTime: 150,
        statusCode: 200,
        sslValid: true,
        sslExpiry: new Date('2025-12-31'),
        sslIssuer: "Let's Encrypt",
      };

      mockRequest.params = { projectId };
      mockMonitoringService.getUserProject.mockResolvedValue({
        id: projectId,
        name: 'Test Project',
        websiteUrl: 'https://example.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1',
      });
      mockMonitoringService.checkSiteManually.mockResolvedValue(mockResult);

      await monitoringController['checkSiteManually'](
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockMonitoringService.checkSiteManually).toHaveBeenCalledWith(
        projectId
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Site check completed',
        data: mockResult,
      });
    });

    it('should return 400 when project ID is missing', async () => {
      mockRequest.params = {};

      await monitoringController['checkSiteManually'](
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'BAD_REQUEST',
        message: 'Project ID is required',
        statusCode: 400,
      });
    });

    it('should return 403 when user does not own project', async () => {
      const projectId = 'project-1';
      mockRequest.params = { projectId };
      mockMonitoringService.getUserProject.mockResolvedValue(null);

      await monitoringController['checkSiteManually'](
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'FORBIDDEN',
        message: 'Access denied to this project',
        statusCode: 403,
      });
    });

    it('should handle errors', async () => {
      const projectId = 'project-1';
      mockRequest.params = { projectId };
      mockMonitoringService.getUserProject.mockRejectedValue(
        new Error('Database error')
      );

      await monitoringController['checkSiteManually'](
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.handleUnknownError).toHaveBeenCalled();
    });
  });
});
