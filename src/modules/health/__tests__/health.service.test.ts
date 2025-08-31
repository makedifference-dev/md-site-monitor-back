import { HealthService } from '@/modules/health/health.service';
import { DatabaseService } from '@/modules/core/database/database.service';

// Мокаем DatabaseService
jest.mock('../../modules/core/database/database.service');

describe('HealthService', () => {
  let healthService: HealthService;
  let mockPrisma: jest.Mocked<any>;

  beforeEach(() => {
    // Очищаем все моки
    jest.clearAllMocks();

    // Создаем мок для Prisma
    mockPrisma = {
      $queryRaw: jest.fn(),
      user: { count: jest.fn() },
      project: { count: jest.fn() },
      siteCheck: { count: jest.fn() },
    };

    // Мокаем статический метод
    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockPrisma);

    healthService = new HealthService();
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when all checks pass', async () => {
      const result = await healthService.getHealthStatus();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('checks');
      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('memory');
      expect(result.checks).toHaveProperty('disk');
    });

    it('should return correct environment', async () => {
      const result = await healthService.getHealthStatus();
      expect(result.environment).toBe('test');
    });

    it('should return valid timestamp', async () => {
      const result = await healthService.getHealthStatus();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('computes overall status as healthy when all checks healthy', async () => {
      jest.spyOn(healthService as any, 'checkDatabase').mockResolvedValue({
        status: 'healthy',
      });
      jest.spyOn(healthService as any, 'checkMemory').mockReturnValue({
        status: 'healthy',
      });
      jest.spyOn(healthService as any, 'checkDisk').mockReturnValue({
        status: 'healthy',
      });

      const result = await healthService.getHealthStatus();
      expect(result.status).toBe('healthy');
    });

    it('computes overall status as unhealthy when any check unhealthy', async () => {
      jest.spyOn(healthService as any, 'checkDatabase').mockResolvedValue({
        status: 'unhealthy',
      });
      jest.spyOn(healthService as any, 'checkMemory').mockReturnValue({
        status: 'healthy',
      });
      jest.spyOn(healthService as any, 'checkDisk').mockReturnValue({
        status: 'healthy',
      });

      const result = await healthService.getHealthStatus();
      expect(result.status).toBe('unhealthy');
    });

    it('computes overall status as degraded otherwise', async () => {
      jest.spyOn(healthService as any, 'checkDatabase').mockResolvedValue({
        status: 'healthy',
      });
      jest.spyOn(healthService as any, 'checkMemory').mockReturnValue({
        status: 'degraded',
      });
      jest.spyOn(healthService as any, 'checkDisk').mockReturnValue({
        status: 'healthy',
      });

      const result = await healthService.getHealthStatus();
      expect(result.status).toBe('degraded');
    });
  });

  describe('checkDatabase', () => {
    it('should return healthy database status', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '1': 1 }]);

      const result = await healthService['checkDatabase']();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Database connection is working');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should return unhealthy database status on error', async () => {
      const error = new Error('Database connection failed');
      mockPrisma.$queryRaw.mockRejectedValue(error);

      const result = await healthService['checkDatabase']();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Database connection failed');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-Error rejection gracefully', async () => {
      mockPrisma.$queryRaw.mockRejectedValue('fail');

      const result = await healthService['checkDatabase']();
      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Unknown error');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checkMemory', () => {
    it('should return memory status', () => {
      const result = healthService['checkMemory']();

      expect(result.status).toBeDefined();
      // Message can vary depending on memory usage percentage
      const message = result.message ?? '';
      expect(
        message.includes('Memory usage:') ||
          message.includes('Elevated memory usage:') ||
          message.includes('High memory usage:')
      ).toBe(true);
    });

    it('returns unhealthy when memory usage > 90%', () => {
      const original = process.memoryUsage;
      // Mock memoryUsage to simulate high usage
      // heapUsed close to heapTotal
      // @ts-expect-error override for test
      process.memoryUsage = () => ({
        rss: 0,
        heapTotal: 100 * 1024 * 1024,
        heapUsed: 95 * 1024 * 1024,
        external: 0,
        arrayBuffers: 0,
      });

      const result = healthService['checkMemory']();
      expect(result.status).toBe('unhealthy');

      process.memoryUsage = original;
    });

    it('returns healthy when memory usage <= 80%', () => {
      const original = process.memoryUsage;
      // @ts-expect-error override for test
      process.memoryUsage = () => ({
        rss: 0,
        heapTotal: 200 * 1024 * 1024,
        heapUsed: 100 * 1024 * 1024, // 50%
        external: 0,
        arrayBuffers: 0,
      });

      const result = healthService['checkMemory']();
      expect(result.status).toBe('healthy');

      process.memoryUsage = original;
    });

    it('returns degraded when 80% < memory usage <= 90%', () => {
      const original = process.memoryUsage;
      // @ts-expect-error override for test
      process.memoryUsage = () => ({
        rss: 0,
        heapTotal: 200 * 1024 * 1024,
        heapUsed: 170 * 1024 * 1024, // 85%
        external: 0,
        arrayBuffers: 0,
      });

      const result = healthService['checkMemory']();
      expect(result.status).toBe('degraded');

      process.memoryUsage = original;
    });
  });

  describe('checkDisk', () => {
    it('should return healthy disk status', () => {
      const result = healthService['checkDisk']();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Disk space check not implemented');
    });
  });

  describe('getDetailedDatabaseHealth', () => {
    it('should return database health information', async () => {
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.project.count.mockResolvedValue(5);
      mockPrisma.siteCheck.count.mockResolvedValue(100);

      const result = await healthService.getDetailedDatabaseHealth();

      expect(result).toHaveProperty('connection');
      expect(result).toHaveProperty('tables');
      expect(result).toHaveProperty('performance');
      expect(result.connection).toBe(true);
      expect(result.tables).toHaveProperty('users');
      expect(result.tables).toHaveProperty('projects');
      expect(result.tables).toHaveProperty('siteChecks');
      expect(result.tables.users).toBe(10);
      expect(result.tables.projects).toBe(5);
      expect(result.tables.siteChecks).toBe(100);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.user.count.mockRejectedValue(error);

      await expect(healthService.getDetailedDatabaseHealth()).rejects.toThrow(
        'Database health check failed: Database error'
      );
    });

    it('should handle non-Error thrown and report Unknown error', async () => {
      mockPrisma.user.count.mockRejectedValue('oops');
      await expect(healthService.getDetailedDatabaseHealth()).rejects.toThrow(
        'Database health check failed: Unknown error'
      );
    });
  });
});
