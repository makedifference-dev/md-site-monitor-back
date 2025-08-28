import {
  MonitoringStats,
  ProjectCheckHistoryResponse,
  SiteCheckResult,
  SSLCertificateInfo,
} from '../../modules/monitoring/monitoring.types';

describe('Monitoring Types', () => {
  describe('SSLCertificateInfo', () => {
    it('should have correct structure', () => {
      const sslInfo: SSLCertificateInfo = {
        valid: true,
        expiry: new Date('2025-12-31'),
        issuer: "Let's Encrypt",
      };

      expect(sslInfo.valid).toBe(true);
      expect(sslInfo.expiry).toBeInstanceOf(Date);
      expect(sslInfo.issuer).toBe("Let's Encrypt");
    });

    it('should handle invalid certificate', () => {
      const sslInfo: SSLCertificateInfo = {
        valid: false,
        error: 'Certificate expired',
      };

      expect(sslInfo.valid).toBe(false);
      expect(sslInfo.error).toBe('Certificate expired');
    });
  });

  describe('MonitoringStats', () => {
    it('should have correct structure', () => {
      const stats: MonitoringStats = {
        totalProjects: 10,
        activeProjects: 8,
        successfulChecks: 955,
        failedChecks: 45,
        averageResponseTime: 200,
        sslStats: {
          totalSSLChecks: 10,
          validSSLCertificates: 8,
          expiredSSLCertificates: 1,
          sslIssues: 1,
        },
      };

      expect(stats.totalProjects).toBe(10);
      expect(stats.activeProjects).toBe(8);
      expect(stats.successfulChecks).toBe(955);
      expect(stats.failedChecks).toBe(45);
      expect(stats.averageResponseTime).toBe(200);
      expect(stats.sslStats).toBeDefined();
    });
  });

  describe('SiteCheckResult', () => {
    it('should have success status structure', () => {
      const successResult: SiteCheckResult = {
        projectId: 'project-1',
        websiteUrl: 'https://example.com',
        status: 'SUCCESS',
        responseTime: 150,
        statusCode: 200,
        sslValid: true,
        sslExpiry: new Date('2025-12-31'),
        sslIssuer: "Let's Encrypt",
      };

      expect(successResult.projectId).toBe('project-1');
      expect(successResult.websiteUrl).toBe('https://example.com');
      expect(successResult.status).toBe('SUCCESS');
      expect(successResult.responseTime).toBe(150);
      expect(successResult.statusCode).toBe(200);
      expect(successResult.sslValid).toBe(true);
      expect(successResult.sslExpiry).toBeInstanceOf(Date);
      expect(successResult.sslIssuer).toBe("Let's Encrypt");
    });

    it('should have error status structure', () => {
      const errorResult: SiteCheckResult = {
        projectId: 'project-1',
        websiteUrl: 'https://example.com',
        status: 'ERROR',
        error: 'Connection timeout',
      };

      expect(errorResult.status).toBe('ERROR');
      expect(errorResult.error).toBe('Connection timeout');
    });

    it('should have timeout status structure', () => {
      const timeoutResult: SiteCheckResult = {
        projectId: 'project-1',
        websiteUrl: 'https://example.com',
        status: 'TIMEOUT',
        error: 'Request timeout',
      };

      expect(timeoutResult.status).toBe('TIMEOUT');
      expect(timeoutResult.error).toBe('Request timeout');
    });
  });

  describe('ProjectCheckHistoryResponse', () => {
    it('should have correct structure', () => {
      const history: ProjectCheckHistoryResponse = {
        projectId: 'project-1',
        projectName: 'Test Project',
        websiteUrl: 'https://example.com',
        totalChecks: 100,
        successRate: 95.5,
        averageResponseTime: 200,
        checks: [
          {
            id: 'check-1',
            status: 'SUCCESS',
            responseTime: 150,
            statusCode: 200,
            error: null,
            sslValid: true,
            sslExpiry: new Date('2025-12-31'),
            sslIssuer: "Let's Encrypt",
            checkedAt: new Date(),
          },
        ],
        pagination: {
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      };

      expect(history.projectId).toBe('project-1');
      expect(history.projectName).toBe('Test Project');
      expect(history.websiteUrl).toBe('https://example.com');
      expect(history.totalChecks).toBe(100);
      expect(history.successRate).toBe(95.5);
      expect(history.averageResponseTime).toBe(200);
      expect(history.checks).toHaveLength(1);
      expect(history.pagination).toBeDefined();
    });
  });
});
