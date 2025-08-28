import { MonitoringService } from '../../modules/monitoring/monitoring.service';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { CacheService } from '../../modules/core/cache/cache.service';
import { PrismaClient } from '@prisma/client';

// Mock DatabaseService, NotificationsService, CacheService
jest.mock('../../modules/core/database/database.service', () => ({
  DatabaseService: {
    getInstance: jest.fn(),
  },
}));

jest.mock('../../modules/notifications/notifications.service');

jest.mock('../../modules/core/cache/cache.service', () => ({
  CacheService: {
    getInstance: jest.fn(),
  },
}));

jest.mock('../../modules/error/error.service', () => ({
  ErrorService: jest.fn().mockImplementation(() => ({
    createCustomError: jest.fn().mockImplementation((code, message, status) => {
      const error = new Error(message);
      (error as any).code = code;
      (error as any).status = status;
      return error;
    }),
    createNotFoundError: jest.fn().mockImplementation(message => {
      const error = new Error(message);
      (error as any).code = 'NOT_FOUND';
      return error;
    }),
    logError: jest.fn(),
  })),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('MonitoringService', () => {
  let monitoringService: MonitoringService;
  let mockPrisma: any;
  let mockNotificationsService: any;
  let mockCacheService: any;
  let mockErrorService: any;

  beforeEach(() => {
    mockPrisma = {
      project: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
      },
      siteCheck: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
      },
    };

    mockNotificationsService = {
      handleSiteFailure: jest.fn(),
    };

    mockCacheService = {
      invalidatePattern: jest.fn(),
      getOrSet: jest.fn().mockImplementation((key, callback) => callback()),
    };

    mockErrorService = {
      logError: jest.fn(),
      createNotFoundError: jest.fn().mockImplementation(message => {
        const error = new Error(message);
        (error as any).code = 'NOT_FOUND';
        return error;
      }),
    };

    const {
      DatabaseService,
    } = require('../../modules/core/database/database.service');
    const { CacheService } = require('../../modules/core/cache/cache.service');

    DatabaseService.getInstance.mockReturnValue(mockPrisma);
    CacheService.getInstance.mockReturnValue(mockCacheService);

    monitoringService = new MonitoringService(
      mockErrorService,
      mockNotificationsService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkSingleSite', () => {
    it('should check site successfully', async () => {
      const projectId = 'project-id';
      const websiteUrl = 'https://example.com';

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      mockPrisma.siteCheck.create.mockResolvedValue({});

      await (monitoringService as any).checkSingleSite(projectId, websiteUrl);

      expect(global.fetch).toHaveBeenCalledWith(websiteUrl, {
        method: 'GET',
        signal: expect.any(AbortSignal),
        headers: {
          'User-Agent': 'MD-Site-Monitor/1.0',
        },
      });
      expect(mockPrisma.siteCheck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId,
          status: 'SUCCESS',
          responseTime: expect.any(Number),
        }),
      });
    });

    it('should handle site down', async () => {
      const projectId = 'project-id';
      const websiteUrl = 'https://example.com';

      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      mockPrisma.siteCheck.create.mockResolvedValue({});

      await (monitoringService as any).checkSingleSite(projectId, websiteUrl);

      expect(mockPrisma.siteCheck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId,
          status: 'ERROR',
          error: expect.stringContaining('HTTP 500'),
        }),
      });
    });

    it('should handle network errors', async () => {
      const projectId = 'project-id';
      const websiteUrl = 'https://example.com';

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      mockPrisma.siteCheck.create.mockResolvedValue({});

      await (monitoringService as any).checkSingleSite(projectId, websiteUrl);

      expect(mockPrisma.siteCheck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId,
          status: 'ERROR',
          error: expect.stringContaining('Network error'),
        }),
      });
    });
  });

  describe('performAllChecks', () => {
    it('should check all active sites', async () => {
      const projects = [
        { id: 'project-1', websiteUrl: 'https://example1.com' },
        { id: 'project-2', websiteUrl: 'https://example2.com' },
      ];

      mockPrisma.project.findMany.mockResolvedValue(projects);
      mockPrisma.siteCheck.create.mockResolvedValue({});

      const mockResponse = { ok: true, status: 200 };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await (monitoringService as any).performAllChecks();

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: { id: true, websiteUrl: true },
      });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getProjectCheckHistory', () => {
    it('should return project check history', async () => {
      const projectId = 'project-id';
      const project = {
        id: projectId,
        name: 'Test Project',
        websiteUrl: 'https://example.com',
      };
      const checks = [
        { id: 'check-1', status: 'SUCCESS', checkedAt: new Date() },
        { id: 'check-2', status: 'ERROR', checkedAt: new Date() },
      ];
      const totalChecks = 2;

      mockPrisma.project.findFirst.mockResolvedValue(project);
      mockPrisma.siteCheck.count.mockResolvedValue(totalChecks);
      mockPrisma.siteCheck.findMany.mockResolvedValue(checks);
      mockPrisma.siteCheck.aggregate.mockResolvedValue({
        _avg: { responseTime: 100 },
      });

      const result = await monitoringService.getProjectCheckHistory(
        projectId,
        10,
        0
      );

      expect(result).not.toBeNull();
      expect(result!.checks).toEqual(checks);
      expect(result!.totalChecks).toBe(totalChecks);
      expect(mockPrisma.siteCheck.findMany).toHaveBeenCalledWith({
        where: { projectId },
        orderBy: { checkedAt: 'desc' },
        take: 10,
        skip: 0,
        select: expect.any(Object),
      });
    });
  });

  describe('getMonitoringStats', () => {
    it('should return monitoring statistics', async () => {
      const stats = {
        totalProjects: 5,
        activeProjects: 3,
        successfulChecks: 10,
        failedChecks: 2,
        averageResponseTime: 100,
        sslStats: {
          totalSSLChecks: 8,
          validSSLCertificates: 7,
          expiredSSLCertificates: 1,
          sslIssues: 1,
        },
      };

      mockPrisma.project.count.mockResolvedValue(stats.totalProjects);
      mockPrisma.siteCheck.count.mockResolvedValue(stats.successfulChecks);
      mockPrisma.siteCheck.aggregate.mockResolvedValue({
        _avg: { responseTime: 100 },
      });

      const result = await monitoringService.getMonitoringStats();

      expect(result.totalProjects).toBe(stats.totalProjects);
      expect(result.successfulChecks).toBe(stats.successfulChecks);
    });
  });

  describe('checkSiteManually', () => {
    it('should perform manual check successfully', async () => {
      const projectId = 'project-id';
      const project = {
        id: projectId,
        websiteUrl: 'https://example.com',
        isActive: true,
      };

      mockPrisma.project.findFirst.mockResolvedValue(project);
      mockPrisma.siteCheck.create.mockResolvedValue({});

      const mockResponse = { ok: true, status: 200 };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await monitoringService.checkSiteManually(projectId);

      expect(result).toBeDefined();
      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: projectId, isActive: true },
      });
    });

    it('should throw error if project not found', async () => {
      const projectId = 'nonexistent-project';

      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        monitoringService.checkSiteManually(projectId)
      ).rejects.toThrow('Project not found or inactive');
    });
  });

  describe('startMonitoring and stopMonitoring', () => {
    it('should start and stop monitoring', () => {
      // Мокаем setInterval и clearInterval
      const mockSetInterval = jest
        .spyOn(global, 'setInterval')
        .mockReturnValue(123 as any);
      const mockClearInterval = jest
        .spyOn(global, 'clearInterval')
        .mockImplementation(() => {});

      monitoringService.startMonitoring();
      expect(mockSetInterval).toHaveBeenCalled();

      monitoringService.stopMonitoring();
      expect(mockClearInterval).toHaveBeenCalledWith(123);

      mockSetInterval.mockRestore();
      mockClearInterval.mockRestore();
    });
  });
});
