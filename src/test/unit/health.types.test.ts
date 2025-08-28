import { HealthStatus, HealthCheck } from '../../modules/health/health.types';

describe('Health Types', () => {
  describe('HealthCheck', () => {
    it('should have correct structure', () => {
      const healthCheck: HealthCheck = {
        status: 'healthy',
        message: 'Service is working properly',
        responseTime: 150,
      };

      expect(healthCheck.status).toBe('healthy');
      expect(healthCheck.message).toBe('Service is working properly');
      expect(healthCheck.responseTime).toBe(150);
    });

    it('should handle unhealthy status', () => {
      const healthCheck: HealthCheck = {
        status: 'unhealthy',
        message: 'Service is down',
        responseTime: 5000,
      };

      expect(healthCheck.status).toBe('unhealthy');
      expect(healthCheck.message).toBe('Service is down');
      expect(healthCheck.responseTime).toBe(5000);
    });

    it('should handle degraded status', () => {
      const healthCheck: HealthCheck = {
        status: 'degraded',
        message: 'Service is slow',
        responseTime: 2000,
      };

      expect(healthCheck.status).toBe('degraded');
      expect(healthCheck.message).toBe('Service is slow');
      expect(healthCheck.responseTime).toBe(2000);
    });

    it('should handle optional properties', () => {
      const healthCheck: HealthCheck = {
        status: 'healthy',
      };

      expect(healthCheck.status).toBe('healthy');
      expect(healthCheck.message).toBeUndefined();
      expect(healthCheck.responseTime).toBeUndefined();
    });
  });

  describe('HealthStatus', () => {
    it('should have correct structure', () => {
      const healthStatus: HealthStatus = {
        status: 'healthy',
        timestamp: new Date(),
        uptime: 3600,
        version: '1.0.0',
        environment: 'development',
        checks: {
          database: {
            status: 'healthy',
            message: 'Database is healthy',
            responseTime: 50,
          },
          memory: {
            status: 'healthy',
            message: 'Memory usage is normal',
            responseTime: 10,
          },
          disk: {
            status: 'healthy',
            message: 'Disk space is sufficient',
            responseTime: 5,
          },
        },
      };

      expect(healthStatus.status).toBe('healthy');
      expect(healthStatus.timestamp).toBeInstanceOf(Date);
      expect(healthStatus.uptime).toBe(3600);
      expect(healthStatus.version).toBe('1.0.0');
      expect(healthStatus.environment).toBe('development');
      expect(healthStatus.checks.database).toBeDefined();
      expect(healthStatus.checks.memory).toBeDefined();
      expect(healthStatus.checks.disk).toBeDefined();
    });

    it('should handle unhealthy status', () => {
      const healthStatus: HealthStatus = {
        status: 'unhealthy',
        timestamp: new Date(),
        uptime: 1800,
        version: '1.0.0',
        environment: 'production',
        checks: {
          database: {
            status: 'unhealthy',
            message: 'Database connection failed',
            responseTime: 10000,
          },
          memory: {
            status: 'healthy',
            message: 'Memory usage is normal',
            responseTime: 10,
          },
          disk: {
            status: 'healthy',
            message: 'Disk space is sufficient',
            responseTime: 5,
          },
        },
      };

      expect(healthStatus.status).toBe('unhealthy');
      expect(healthStatus.timestamp).toBeInstanceOf(Date);
      expect(healthStatus.uptime).toBe(1800);
      expect(healthStatus.version).toBe('1.0.0');
      expect(healthStatus.environment).toBe('production');
      expect(healthStatus.checks.database.status).toBe('unhealthy');
      expect(healthStatus.checks.memory.status).toBe('healthy');
      expect(healthStatus.checks.disk.status).toBe('healthy');
    });

    it('should handle degraded status', () => {
      const healthStatus: HealthStatus = {
        status: 'degraded',
        timestamp: new Date(),
        uptime: 7200,
        version: '1.0.0',
        environment: 'staging',
        checks: {
          database: {
            status: 'healthy',
            message: 'Database is healthy',
            responseTime: 50,
          },
          memory: {
            status: 'degraded',
            message: 'High memory usage',
            responseTime: 100,
          },
          disk: {
            status: 'healthy',
            message: 'Disk space is sufficient',
            responseTime: 5,
          },
        },
      };

      expect(healthStatus.status).toBe('degraded');
      expect(healthStatus.timestamp).toBeInstanceOf(Date);
      expect(healthStatus.uptime).toBe(7200);
      expect(healthStatus.version).toBe('1.0.0');
      expect(healthStatus.environment).toBe('staging');
      expect(healthStatus.checks.database.status).toBe('healthy');
      expect(healthStatus.checks.memory.status).toBe('degraded');
      expect(healthStatus.checks.disk.status).toBe('healthy');
    });
  });
});
