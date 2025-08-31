import { ConfigService } from '@/modules/core/config.service';

describe('ConfigService', () => {
  let configService: ConfigService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Сохраняем оригинальные переменные окружения
    originalEnv = { ...process.env };

    // Очищаем singleton instance перед каждым тестом
    (ConfigService as any).instance = undefined;

    // Очищаем process.env для чистого тестирования
    process.env = {};
  });

  afterEach(() => {
    // Восстанавливаем оригинальные переменные окружения
    process.env = originalEnv;
  });

  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      // Устанавливаем обязательные переменные окружения
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET =
        'test-jwt-secret-that-is-long-enough-for-validation';
      process.env.JWT_REFRESH_SECRET =
        'test-jwt-refresh-secret-that-is-long-enough';

      const instance1 = ConfigService.getInstance();
      const instance2 = ConfigService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create a new instance when called for the first time', () => {
      // Устанавливаем обязательные переменные окружения
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET =
        'test-jwt-secret-that-is-long-enough-for-validation';
      process.env.JWT_REFRESH_SECRET =
        'test-jwt-refresh-secret-that-is-long-enough';

      const instance = ConfigService.getInstance();

      expect(instance).toBeInstanceOf(ConfigService);
    });
  });

  describe('configuration validation', () => {
    it('should load configuration with default values', () => {
      // Устанавливаем только обязательные переменные
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET =
        'test-jwt-secret-that-is-long-enough-for-validation';
      process.env.JWT_REFRESH_SECRET =
        'test-jwt-refresh-secret-that-is-long-enough';

      configService = ConfigService.getInstance();

      expect(configService.port).toBe(3000);
      expect(configService.nodeEnv).toBe('development');
      expect(configService.databaseUrl).toBe(
        'postgresql://test:test@localhost:5432/test'
      );
      expect(configService.jwtSecret).toBe(
        'test-jwt-secret-that-is-long-enough-for-validation'
      );
      expect(configService.jwtRefreshSecret).toBe(
        'test-jwt-refresh-secret-that-is-long-enough'
      );
      expect(configService.jwtExpiresIn).toBe('15m');
      expect(configService.jwtRefreshExpiresIn).toBe('7d');
      expect(configService.bcryptRounds).toBe(12);
      expect(configService.smtpHost).toBe('smtp.ethereal.email');
      expect(configService.smtpPort).toBe(587);
      expect(configService.smtpUser).toBe('test@example.com');
      expect(configService.smtpPass).toBe('password');
      expect(configService.fromEmail).toBe('noreply@mdsitemonitor.com');
      expect(configService.fromName).toBe('MD Site Monitor');
      expect(configService.appVersion).toBe('1.0.0');
      expect(configService.appName).toBe('MD Site Monitor Backend');
    });

    it('should load configuration with custom values', () => {
      process.env.PORT = '8080';
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL =
        'postgresql://custom:custom@localhost:5432/custom';
      process.env.JWT_SECRET =
        'custom-jwt-secret-that-is-long-enough-for-validation';
      process.env.JWT_REFRESH_SECRET =
        'custom-jwt-refresh-secret-that-is-long-enough';
      process.env.JWT_EXPIRES_IN = '30m';
      process.env.JWT_REFRESH_EXPIRES_IN = '14d';
      process.env.BCRYPT_ROUNDS = '14';
      process.env.SMTP_HOST = 'smtp.gmail.com';
      process.env.SMTP_PORT = '465';
      process.env.SMTP_USER = 'custom@example.com';
      process.env.SMTP_PASS = 'custom-password';
      process.env.FROM_EMAIL = 'custom@mdsitemonitor.com';
      process.env.FROM_NAME = 'Custom Monitor';
      process.env.APP_VERSION = '2.0.0';
      process.env.APP_NAME = 'Custom Site Monitor';
      process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';

      configService = ConfigService.getInstance();

      expect(configService.port).toBe(8080);
      expect(configService.nodeEnv).toBe('production');
      expect(configService.databaseUrl).toBe(
        'postgresql://custom:custom@localhost:5432/custom'
      );
      expect(configService.jwtSecret).toBe(
        'custom-jwt-secret-that-is-long-enough-for-validation'
      );
      expect(configService.jwtRefreshSecret).toBe(
        'custom-jwt-refresh-secret-that-is-long-enough'
      );
      expect(configService.jwtExpiresIn).toBe('30m');
      expect(configService.jwtRefreshExpiresIn).toBe('14d');
      expect(configService.bcryptRounds).toBe(14);
      expect(configService.smtpHost).toBe('smtp.gmail.com');
      expect(configService.smtpPort).toBe(465);
      expect(configService.smtpUser).toBe('custom@example.com');
      expect(configService.smtpPass).toBe('custom-password');
      expect(configService.fromEmail).toBe('custom@mdsitemonitor.com');
      expect(configService.fromName).toBe('Custom Monitor');
      expect(configService.appVersion).toBe('2.0.0');
      expect(configService.appName).toBe('Custom Site Monitor');
      expect(configService.telegramBotToken).toBe('test-bot-token');
    });

    it('should throw error when DATABASE_URL is missing', () => {
      process.env.JWT_SECRET =
        'test-jwt-secret-that-is-long-enough-for-validation';
      process.env.JWT_REFRESH_SECRET =
        'test-jwt-refresh-secret-that-is-long-enough';

      expect(() => {
        ConfigService.getInstance();
      }).toThrow('Invalid environment configuration: DATABASE_URL');
    });

    it('should throw error when JWT_SECRET is missing', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_REFRESH_SECRET =
        'test-jwt-refresh-secret-that-is-long-enough';

      expect(() => {
        ConfigService.getInstance();
      }).toThrow('Invalid environment configuration: JWT_SECRET');
    });

    it('should throw error when JWT_REFRESH_SECRET is missing', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET =
        'test-jwt-secret-that-is-long-enough-for-validation';

      expect(() => {
        ConfigService.getInstance();
      }).toThrow('Invalid environment configuration: JWT_REFRESH_SECRET');
    });

    it('should throw error when JWT_SECRET is too short', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'short';
      process.env.JWT_REFRESH_SECRET =
        'test-jwt-refresh-secret-that-is-long-enough';

      expect(() => {
        ConfigService.getInstance();
      }).toThrow('Invalid environment configuration: JWT_SECRET');
    });

    it('should throw error when JWT_REFRESH_SECRET is too short', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET =
        'test-jwt-secret-that-is-long-enough-for-validation';
      process.env.JWT_REFRESH_SECRET = 'short';

      expect(() => {
        ConfigService.getInstance();
      }).toThrow('Invalid environment configuration: JWT_REFRESH_SECRET');
    });

    it('should throw error when FROM_EMAIL is invalid', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET =
        'test-jwt-secret-that-is-long-enough-for-validation';
      process.env.JWT_REFRESH_SECRET =
        'test-jwt-refresh-secret-that-is-long-enough';
      process.env.FROM_EMAIL = 'invalid-email';

      expect(() => {
        ConfigService.getInstance();
      }).toThrow('Invalid environment configuration: FROM_EMAIL');
    });

    it('should throw error when NODE_ENV is invalid', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET =
        'test-jwt-secret-that-is-long-enough-for-validation';
      process.env.JWT_REFRESH_SECRET =
        'test-jwt-refresh-secret-that-is-long-enough';
      process.env.NODE_ENV = 'invalid-env';

      expect(() => {
        ConfigService.getInstance();
      }).toThrow('Invalid environment configuration: NODE_ENV');
    });
  });

  describe('environment helpers', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET =
        'test-jwt-secret-that-is-long-enough-for-validation';
      process.env.JWT_REFRESH_SECRET =
        'test-jwt-refresh-secret-that-is-long-enough';
    });

    it('should return correct environment flags for development', () => {
      process.env.NODE_ENV = 'development';
      configService = ConfigService.getInstance();

      expect(configService.isDevelopment).toBe(true);
      expect(configService.isProduction).toBe(false);
      expect(configService.isTest).toBe(false);
    });

    it('should return correct environment flags for production', () => {
      process.env.NODE_ENV = 'production';
      configService = ConfigService.getInstance();

      expect(configService.isDevelopment).toBe(false);
      expect(configService.isProduction).toBe(true);
      expect(configService.isTest).toBe(false);
    });

    it('should return correct environment flags for test', () => {
      process.env.NODE_ENV = 'test';
      configService = ConfigService.getInstance();

      expect(configService.isDevelopment).toBe(false);
      expect(configService.isProduction).toBe(false);
      expect(configService.isTest).toBe(true);
    });
  });

  describe('telegram configuration', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET =
        'test-jwt-secret-that-is-long-enough-for-validation';
      process.env.JWT_REFRESH_SECRET =
        'test-jwt-refresh-secret-that-is-long-enough';
    });

    it('should return undefined when TELEGRAM_BOT_TOKEN is not set', () => {
      configService = ConfigService.getInstance();

      expect(configService.telegramBotToken).toBeUndefined();
      expect(configService.isTelegramEnabled).toBe(false);
    });

    it('should return token and enabled flag when TELEGRAM_BOT_TOKEN is set', () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
      configService = ConfigService.getInstance();

      expect(configService.telegramBotToken).toBe('test-bot-token');
      expect(configService.isTelegramEnabled).toBe(true);
    });
  });

  describe('getConfig', () => {
    it('should return the complete configuration object', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET =
        'test-jwt-secret-that-is-long-enough-for-validation';
      process.env.JWT_REFRESH_SECRET =
        'test-jwt-refresh-secret-that-is-long-enough';
      process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';

      configService = ConfigService.getInstance();
      const config = configService.getConfig();

      expect(config).toHaveProperty(
        'DATABASE_URL',
        'postgresql://test:test@localhost:5432/test'
      );
      expect(config).toHaveProperty(
        'JWT_SECRET',
        'test-jwt-secret-that-is-long-enough-for-validation'
      );
      expect(config).toHaveProperty(
        'JWT_REFRESH_SECRET',
        'test-jwt-refresh-secret-that-is-long-enough'
      );
      expect(config).toHaveProperty('TELEGRAM_BOT_TOKEN', 'test-bot-token');
      expect(config).toHaveProperty('PORT', 3000);
      expect(config).toHaveProperty('NODE_ENV', 'development');
    });
  });

  describe('extended configuration getters', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET =
        'test-jwt-secret-that-is-long-enough-for-validation';
      process.env.JWT_REFRESH_SECRET =
        'test-jwt-refresh-secret-that-is-long-enough';
    });

    it('should return CORS origins, swagger flag, json limit and monitor concurrency', () => {
      process.env.CORS_ORIGIN = 'https://a.example.com,https://b.example.com';
      process.env.SWAGGER_ENABLED = 'true';
      process.env.JSON_LIMIT = '2mb';
      process.env.MONITOR_CONCURRENCY = '7';

      const svc = ConfigService.getInstance();
      expect(svc.corsOrigin).toBe('https://a.example.com,https://b.example.com');
      expect(svc.swaggerEnabled).toBe(true);
      expect(svc.jsonLimit).toBe('2mb');
      expect(svc.monitorConcurrency).toBe(7);
    });

    it('should use defaults when not set', () => {
      const svc = ConfigService.getInstance();
      expect(svc.corsOrigin).toBe('*');
      expect(svc.swaggerEnabled).toBe(false);
      expect(svc.jsonLimit).toBe('10mb');
      expect(svc.monitorConcurrency).toBe(5);
    });
  });

  describe('getLoggableConfig', () => {
    it('should return configuration with hidden secrets', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET =
        'test-jwt-secret-that-is-long-enough-for-validation';
      process.env.JWT_REFRESH_SECRET =
        'test-jwt-refresh-secret-that-is-long-enough';
      process.env.SMTP_PASS = 'smtp-password';
      process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';

      configService = ConfigService.getInstance();
      const loggableConfig = configService.getLoggableConfig();

      expect(loggableConfig.JWT_SECRET).toBe('***HIDDEN***');
      expect(loggableConfig.JWT_REFRESH_SECRET).toBe('***HIDDEN***');
      expect(loggableConfig.SMTP_PASS).toBe('***HIDDEN***');
      expect(loggableConfig.TELEGRAM_BOT_TOKEN).toBe('***HIDDEN***');
      expect(loggableConfig.DATABASE_URL).toBe(
        'postgresql://test:test@localhost:5432/test'
      );
      expect(loggableConfig.PORT).toBe(3000);
      expect(loggableConfig.NODE_ENV).toBe('development');
    });

    it('should return undefined for TELEGRAM_BOT_TOKEN when not set', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET =
        'test-jwt-secret-that-is-long-enough-for-validation';
      process.env.JWT_REFRESH_SECRET =
        'test-jwt-refresh-secret-that-is-long-enough';

      configService = ConfigService.getInstance();
      const loggableConfig = configService.getLoggableConfig();

      expect(loggableConfig.TELEGRAM_BOT_TOKEN).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw error for missing required environment variables', () => {
      // Очищаем process.env
      process.env = {};

      // Очищаем singleton instance чтобы создать новый
      (ConfigService as any).instance = undefined;

      expect(() => {
        ConfigService.getInstance();
      }).toThrow('Invalid environment configuration: DATABASE_URL');
    });
  });
});
