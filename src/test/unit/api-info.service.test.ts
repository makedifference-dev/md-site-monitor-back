/* eslint-disable no-console, no-undef */
import { ApiInfoService } from '../../modules/api-info/api-info.service';
import { ConfigService } from '../../modules/core/config.service';

// Мокаем ConfigService
jest.mock('../../modules/core/config.service');

describe('ApiInfoService', () => {
  let apiInfoService: ApiInfoService;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    // Очищаем все моки
    jest.clearAllMocks();

    // Создаем мок ConfigService
    mockConfigService = {
      nodeEnv: 'test',
      getConfig: jest.fn(),
      port: 3000,
      appName: 'Test App',
      appVersion: '1.0.0',
      databaseUrl: 'test-url',
      jwtSecret: 'test-secret',
      jwtRefreshSecret: 'test-refresh-secret',
      jwtExpiresIn: '1h',
      jwtRefreshExpiresIn: '7d',
      bcryptRounds: 10,
      smtpHost: 'smtp.test.com',
      smtpPort: 587,
      smtpUser: 'test@test.com',
      smtpPass: 'test-pass',
      fromEmail: 'noreply@test.com',
      fromName: 'Test App',
      telegramBotToken: 'test-token',
      compressionLevel: 6,
      corsOrigin: 'http://localhost:3000',
      helmetContentSecurityPolicy: "default-src 'self'",
      morganFormat: 'combined',
      jsonLimit: '10mb',
      rateLimitWindowMs: 900000,
      rateLimitMax: 100,
      authRateLimitWindowMs: 900000,
      authRateLimitMax: 5,
      slowQueryThreshold: 1000,
      getLoggableConfig: jest.fn(),
    } as any;

    (ConfigService.getInstance as jest.Mock).mockReturnValue(mockConfigService);

    apiInfoService = new ApiInfoService();
  });

  describe('constructor', () => {
    it('should initialize with start time and config service', () => {
      expect(apiInfoService).toBeInstanceOf(ApiInfoService);
      expect(ConfigService.getInstance).toHaveBeenCalled();
    });
  });

  describe('getRootInfo', () => {
    it('should return root info with correct structure', () => {
      const result = apiInfoService.getRootInfo();

      expect(result).toEqual({
        message: 'MD Site Monitor Backend API',
        status: 'running',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: 'test',
        endpoints: {
          docs: '/api-docs',
          spec: '/api-docs/json',
        },
      });
    });

    it('should return valid timestamp', () => {
      const result = apiInfoService.getRootInfo();
      const timestamp = new Date(result.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should return positive uptime', () => {
      // Создаем новый экземпляр для точного измерения времени
      const service = new ApiInfoService();

      // Ждем немного
      const startTime = Date.now();
      while (Date.now() - startTime < 10) {
        // Ждем 10мс
      }

      const result = service.getRootInfo();

      expect(result.uptime).toBeGreaterThan(0);
      expect(typeof result.uptime).toBe('number');
    });

    it('should use environment from config service', () => {
      // Создаем новый мок с другим значением nodeEnv
      const productionConfigService = {
        ...mockConfigService,
        nodeEnv: 'production',
      };
      (ConfigService.getInstance as jest.Mock).mockReturnValue(
        productionConfigService
      );

      const newService = new ApiInfoService();
      const result = newService.getRootInfo();

      expect(result.environment).toBe('production');
    });

    it('should return correct endpoints', () => {
      const result = apiInfoService.getRootInfo();

      expect(result.endpoints).toEqual({
        docs: '/api-docs',
        spec: '/api-docs/json',
      });
    });

    it('should return correct message', () => {
      const result = apiInfoService.getRootInfo();

      expect(result.message).toBe('MD Site Monitor Backend API');
    });

    it('should return correct status', () => {
      const result = apiInfoService.getRootInfo();

      expect(result.status).toBe('running');
    });
  });

  describe('uptime calculation', () => {
    it('should calculate uptime correctly', () => {
      // Создаем новый экземпляр для точного измерения времени
      const service = new ApiInfoService();

      // Ждем немного
      const startTime = Date.now();
      while (Date.now() - startTime < 10) {
        // Ждем 10мс
      }

      const result = service.getRootInfo();

      expect(result.uptime).toBeGreaterThan(0);
      expect(result.uptime).toBeLessThan(1); // Должно быть меньше 1 секунды
    });
  });
});
