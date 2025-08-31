import { MonitoringService } from '@/modules/monitoring/monitoring.service';
import { SSLChecker } from '@/modules/monitoring/ssl-checker';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { CacheService } from '@/modules/core/cache/cache.service';
import { PrismaClient } from '@prisma/client';

// Mock DatabaseService, NotificationsService, CacheService
jest.mock('@/modules/core/database/database.service', () => ({
  DatabaseService: {
    getInstance: jest.fn(),
  },
}));

jest.mock('@/modules/notifications/notifications.service');

jest.mock('@/modules/core/cache/cache.service', () => ({
  CacheService: {
    getInstance: jest.fn(),
  },
}));

jest.mock('@/modules/error/error.service', () => ({
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

    it('should handle request timeout (AbortError)', async () => {
      const projectId = 'project-id';
      const websiteUrl = 'https://example.com';

      const abortError = new Error('Aborted');
      (abortError as any).name = 'AbortError';
      (global.fetch as jest.Mock).mockRejectedValue(abortError);
      mockPrisma.siteCheck.create.mockResolvedValue({});

      await (monitoringService as any).checkSingleSite(projectId, websiteUrl);

      expect(mockPrisma.siteCheck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId,
          status: 'TIMEOUT',
          error: 'Request timeout',
        }),
      });
    });

    it('should include SSL error details when certificate is invalid', async () => {
      const projectId = 'project-id';
      const websiteUrl = 'https://secure.example.com';

      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 });
      jest.spyOn(SSLChecker, 'isHTTPS').mockReturnValue(true);
      jest.spyOn(SSLChecker, 'checkSSLCertificate').mockResolvedValue({
        valid: false,
        expiry: new Date(Date.now() - 1000),
        issuer: 'TestCA',
        error: 'Expired certificate',
      } as any);

      mockPrisma.siteCheck.create.mockResolvedValue({});

      await (monitoringService as any).checkSingleSite(projectId, websiteUrl);

      expect(mockPrisma.siteCheck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId,
          status: 'SUCCESS',
          error: expect.stringContaining('SSL: Expired certificate'),
          sslValid: false,
          sslIssuer: 'TestCA',
        }),
      });
    });

    it('appends SSL error to existing HTTP error', async () => {
      const projectId = 'project-id';
      const websiteUrl = 'https://secure.example.com';

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
      });
      jest.spyOn(SSLChecker, 'isHTTPS').mockReturnValue(true);
      jest.spyOn(SSLChecker, 'checkSSLCertificate').mockResolvedValue({
        valid: false,
        expiry: new Date(Date.now() - 1000),
        issuer: 'TestCA',
        error: 'Expired certificate',
      } as any);

      mockPrisma.siteCheck.create.mockResolvedValue({});

      await (monitoringService as any).checkSingleSite(projectId, websiteUrl);

      expect(mockPrisma.siteCheck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId,
          status: 'ERROR',
          error: expect.stringContaining(
            'HTTP 502: Bad Gateway; SSL: Expired certificate'
          ),
          sslValid: false,
        }),
      });
    });

    it('should handle non-Error rejections as unknown errors', async () => {
      const projectId = 'project-id';
      const websiteUrl = 'https://example.com';

      jest.spyOn(SSLChecker, 'isHTTPS').mockReturnValue(false);
      (global.fetch as jest.Mock).mockRejectedValue('boom');
      mockPrisma.siteCheck.create.mockResolvedValue({});

      await (monitoringService as any).checkSingleSite(projectId, websiteUrl);

      expect(mockPrisma.siteCheck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId,
          status: 'ERROR',
          error: 'Unknown error occurred',
        }),
      });
    });

    it('executes timeout callback (covers abort callback)', async () => {
      const projectId = 'project-id';
      const websiteUrl = 'https://example.com';

      const abortError = new Error('Aborted');
      (abortError as any).name = 'AbortError';

      const originalSetTimeout = global.setTimeout;
      // Mock setTimeout to run callback immediately
      // @ts-expect-error override for test
      global.setTimeout = (fn: any) => {
        fn();
        return { unref: () => {} } as any;
      };

      (global.fetch as jest.Mock).mockRejectedValue(abortError);
      mockPrisma.siteCheck.create.mockResolvedValue({});

      await (monitoringService as any).checkSingleSite(projectId, websiteUrl);

      global.setTimeout = originalSetTimeout;
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

    it('logs error when a site check fails', async () => {
      const projects = [
        { id: 'project-1', websiteUrl: 'https://example1.com' },
        { id: 'project-2', websiteUrl: 'https://example2.com' },
      ];
      mockPrisma.project.findMany.mockResolvedValue(projects);

      const spy = jest
        .spyOn(monitoringService as any, 'checkSingleSite')
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Check failed'));

      await (monitoringService as any).performAllChecks();

      expect(spy).toHaveBeenCalledTimes(2);
      expect(mockErrorService.logError).toHaveBeenCalledWith(
        expect.any(Error),
        'Site check failed'
      );
    });

    it('handles unexpected error during performAllChecks', async () => {
      mockPrisma.project.findMany.mockRejectedValue(new Error('DB error'));

      await (monitoringService as any).performAllChecks();

      expect(mockErrorService.logError).toHaveBeenCalledWith(
        expect.any(Error),
        'Error during site checks'
      );
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

    it('returns paginated history with hasMore true and caps take at 100', async () => {
      const projectId = 'project-id';
      const project = { id: projectId, name: 'P', websiteUrl: 'https://e.com' };
      mockPrisma.project.findFirst.mockResolvedValue(project);
      mockPrisma.siteCheck.count
        .mockResolvedValueOnce(250) // totalChecks
        .mockResolvedValueOnce(100); // successfulChecks
      mockPrisma.siteCheck.findMany.mockResolvedValue([]);
      mockPrisma.siteCheck.aggregate.mockResolvedValue({
        _avg: { responseTime: null },
      });

      const result = await monitoringService.getProjectCheckHistory(
        projectId,
        200,
        0
      );

      expect(mockPrisma.siteCheck.findMany).toHaveBeenCalledWith({
        where: { projectId },
        orderBy: { checkedAt: 'desc' },
        take: 100,
        skip: 0,
        select: expect.any(Object),
      });
      const r: any = result;
      expect(r.pagination.hasMore).toBe(true);
      expect(result!.averageResponseTime).toBe(0);
    });

    it('returns successRate 0 when totalChecks is 0', async () => {
      const projectId = 'project-id';
      const project = { id: projectId, name: 'P', websiteUrl: 'https://e.com' };
      mockPrisma.project.findFirst.mockResolvedValue(project);
      mockPrisma.siteCheck.count
        .mockResolvedValueOnce(0) // totalChecks
        .mockResolvedValueOnce(0); // successfulChecks
      mockPrisma.siteCheck.findMany.mockResolvedValue([]);
      mockPrisma.siteCheck.aggregate.mockResolvedValue({
        _avg: { responseTime: null },
      });

      const result = await monitoringService.getProjectCheckHistory(
        projectId,
        10,
        0
      );
      const r0: any = result;
      expect(r0.successRate).toBe(0);
      expect(r0.pagination.hasMore).toBe(false);
    });

    it('uses default limit/offset parameters when omitted', async () => {
      const projectId = 'project-id';
      const project = { id: projectId, name: 'P', websiteUrl: 'https://e.com' };
      mockPrisma.project.findFirst.mockResolvedValue(project);
      mockPrisma.siteCheck.count
        .mockResolvedValueOnce(0) // totalChecks
        .mockResolvedValueOnce(0); // successfulChecks
      mockPrisma.siteCheck.findMany.mockResolvedValue([]);
      mockPrisma.siteCheck.aggregate.mockResolvedValue({
        _avg: { responseTime: null },
      });

      const result = await monitoringService.getProjectCheckHistory(projectId);
      expect(result).not.toBeNull();
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

    it('sets averageResponseTime to 0 when undefined', async () => {
      mockPrisma.project.count
        .mockResolvedValueOnce(5) // totalProjects
        .mockResolvedValueOnce(3); // activeProjects
      mockPrisma.siteCheck.count
        .mockResolvedValueOnce(10) // totalChecks
        .mockResolvedValueOnce(4); // successfulChecks
      mockPrisma.siteCheck.aggregate.mockResolvedValue({
        _avg: { responseTime: null },
      });

      const result = await monitoringService.getMonitoringStats();
      expect(result.averageResponseTime).toBe(0);
      expect(result.failedChecks).toBe(6);
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

    it('should handle non-ok response as error', async () => {
      const projectId = 'project-id';
      const project = {
        id: projectId,
        websiteUrl: 'https://example.com',
        isActive: true,
      };

      mockPrisma.project.findFirst.mockResolvedValue(project);
      mockPrisma.siteCheck.create.mockResolvedValue({});
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      const result = await monitoringService.checkSiteManually(projectId);
      expect(result.status).toBe('ERROR');
      expect(result.error).toContain('HTTP 503');
    });

    it('should handle AbortError (timeout) in manual check', async () => {
      const projectId = 'project-id';
      const project = {
        id: projectId,
        websiteUrl: 'https://example.com',
        isActive: true,
      };

      mockPrisma.project.findFirst.mockResolvedValue(project);
      mockPrisma.siteCheck.create.mockResolvedValue({});

      const abortError = new Error('Aborted');
      (abortError as any).name = 'AbortError';
      (global.fetch as jest.Mock).mockRejectedValue(abortError);

      const result = await monitoringService.checkSiteManually(projectId);
      expect(result.status).toBe('TIMEOUT');
      expect(result.error).toBe('Request timeout');
    });

    it('should handle unknown rejection type in manual check', async () => {
      const projectId = 'project-id';
      const project = {
        id: projectId,
        websiteUrl: 'https://example.com',
        isActive: true,
      };

      mockPrisma.project.findFirst.mockResolvedValue(project);
      mockPrisma.siteCheck.create.mockResolvedValue({});

      (global.fetch as jest.Mock).mockRejectedValue('boom');

      const result = await monitoringService.checkSiteManually(projectId);
      expect(result.status).toBe('ERROR');
      expect(result.error).toBe('Unknown error occurred');
    });

    it('should handle network error (Error instance) in manual check', async () => {
      const projectId = 'project-id';
      const project = {
        id: projectId,
        websiteUrl: 'https://example.com',
        isActive: true,
      };

      mockPrisma.project.findFirst.mockResolvedValue(project);
      mockPrisma.siteCheck.create.mockResolvedValue({});
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network down'));

      const result = await monitoringService.checkSiteManually(projectId);
      expect(result.status).toBe('ERROR');
      expect(result.error).toBe('Network down');
    });

    it('executes timeout callback in manual check', async () => {
      const projectId = 'project-id';
      const project = {
        id: projectId,
        websiteUrl: 'https://example.com',
        isActive: true,
      };

      mockPrisma.project.findFirst.mockResolvedValue(project);
      mockPrisma.siteCheck.create.mockResolvedValue({});

      const abortError = new Error('Aborted');
      (abortError as any).name = 'AbortError';

      const originalSetTimeout = global.setTimeout;
      // @ts-expect-error override for test
      global.setTimeout = (fn: any) => {
        fn();
        return { unref: () => {} } as any;
      };

      (global.fetch as jest.Mock).mockRejectedValue(abortError);

      const result = await monitoringService.checkSiteManually(projectId);
      expect(result.status).toBe('TIMEOUT');

      global.setTimeout = originalSetTimeout;
    });
  });

  describe('startMonitoring and stopMonitoring', () => {
    it('should start and stop monitoring', () => {
      // Мокаем setInterval и clearInterval
      let cb: (() => void) | undefined;
      const mockSetInterval = jest
        .spyOn(global, 'setInterval')
        .mockImplementation((fn: any) => {
          cb = fn as () => void;
          return 123 as any;
        });
      const mockClearInterval = jest
        .spyOn(global, 'clearInterval')
        .mockImplementation(() => {});

      const checksSpy = jest
        .spyOn(monitoringService as any, 'performAllChecks')
        .mockResolvedValue(undefined);

      monitoringService.startMonitoring();
      expect(mockSetInterval).toHaveBeenCalled();

      // Call scheduled callback and try to start again (already running)
      cb?.();
      expect(checksSpy).toHaveBeenCalled();
      monitoringService.startMonitoring();

      monitoringService.stopMonitoring();
      expect(mockClearInterval).toHaveBeenCalledWith(123);

      mockSetInterval.mockRestore();
      mockClearInterval.mockRestore();
    });

    it('stopMonitoring does nothing if not started', () => {
      const mockClearInterval = jest
        .spyOn(global, 'clearInterval')
        .mockImplementation(() => {});

      // Should not throw or call clearInterval
      monitoringService.stopMonitoring();
      expect(mockClearInterval).not.toHaveBeenCalled();

      mockClearInterval.mockRestore();
    });
  });

  describe('SSL and helpers', () => {
    it('handles SSL checker throwing error gracefully', async () => {
      const projectId = 'project-id';
      const websiteUrl = 'https://secure.example.com';

      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 });
      jest.spyOn(SSLChecker, 'isHTTPS').mockReturnValue(true);
      jest
        .spyOn(SSLChecker, 'checkSSLCertificate')
        .mockRejectedValue(new Error('SSL failure'));

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockPrisma.siteCheck.create.mockResolvedValue({});

      await (monitoringService as any).checkSingleSite(projectId, websiteUrl);

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('returns null history when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);
      const result = await monitoringService.getProjectCheckHistory('p', 10, 0);
      expect(result).toBeNull();
    });

    it('getUserProject returns project or null', async () => {
      const project = { id: 'p', userId: 'u', isActive: true };
      mockPrisma.project.findFirst
        .mockResolvedValueOnce(project)
        .mockResolvedValueOnce(null);

      const found = await monitoringService.getUserProject('p', 'u');
      expect(found).toEqual(project);

      const notFound = await monitoringService.getUserProject('p', 'u');
      expect(notFound).toBeNull();
    });

    it('includes SSL details when certificate valid (no error)', async () => {
      const projectId = 'project-id';
      const websiteUrl = 'https://secure.example.com';

      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 });
      jest.spyOn(SSLChecker, 'isHTTPS').mockReturnValue(true);
      const expiry = new Date(Date.now() + 86400000);
      jest.spyOn(SSLChecker, 'checkSSLCertificate').mockResolvedValue({
        valid: true,
        expiry,
        issuer: 'OkCA',
      } as any);

      mockPrisma.siteCheck.create.mockResolvedValue({});

      await (monitoringService as any).checkSingleSite(projectId, websiteUrl);

      expect(mockPrisma.siteCheck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId,
          sslValid: true,
          sslIssuer: 'OkCA',
          sslExpiry: expiry,
        }),
      });
    });
  });
});
