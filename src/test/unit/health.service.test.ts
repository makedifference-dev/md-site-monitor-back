import { HealthService } from '../../modules/health/health.service';
import { DatabaseService } from '../../modules/core/database/database.service';

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
  });

  describe('checkMemory', () => {
    it('should return memory status', () => {
      const result = healthService['checkMemory']();

      expect(result.status).toBeDefined();
      expect(result.message).toContain('Memory usage:');
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
  });
});
