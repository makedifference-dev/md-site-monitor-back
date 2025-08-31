import { z } from 'zod';

// Схема валидации переменных окружения
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Database Configuration
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT Authentication Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Password Security Configuration
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),

  // Email Configuration (SMTP)
  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_USER: z.string().default('test@example.com'),
  SMTP_PASS: z.string().default('password'),
  FROM_EMAIL: z.string().email().default('noreply@mdsitemonitor.com'),
  FROM_NAME: z.string().default('MD Site Monitor'),

  // Telegram Bot Configuration
  TELEGRAM_BOT_TOKEN: z.string().optional(),

  // Application Information
  APP_VERSION: z.string().default('1.0.0'),
  APP_NAME: z.string().default('MD Site Monitor Backend'),

  // CORS and Swagger
  CORS_ORIGIN: z.string().default('*'), // Comma-separated list or '*'
  SWAGGER_ENABLED: z.string().default('false'),

  // Request body size
  JSON_LIMIT: z.string().default('10mb'),

  // Monitoring
  MONITOR_CONCURRENCY: z.string().transform(Number).default('5'),

  // Rate limiting (API)
  API_RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'), // 1 min by default
  API_RATE_LIMIT_MAX: z.string().transform(Number).default('1200'), // 1200 req/min per IP

  // Rate limiting (Auth)
  AUTH_RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 min
  AUTH_RATE_LIMIT_MAX: z.string().transform(Number).default('10'), // 10 attempts per 15 min
});

// Тип конфигурации
export type Config = z.infer<typeof envSchema>;

export class ConfigService {
  private static instance: ConfigService | null = null;
  private config: Config;

  private constructor() {
    this.config = this.validateConfig();
  }

  public static getInstance(): ConfigService {
    ConfigService.instance ??= new ConfigService();
    return ConfigService.instance;
  }

  /**
   * Валидация и загрузка конфигурации
   */
  private validateConfig(): Config {
    try {
      return envSchema.parse(process.env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const missingVars = error.errors
          .map(err => err.path.join('.'))
          .join(', ');
        throw new Error(`Invalid environment configuration: ${missingVars}`);
      }
      throw error;
    }
  }

  /**
   * Получить всю конфигурацию
   */
  public getConfig(): Config {
    return this.config;
  }

  // Server Configuration
  public get port(): number {
    return this.config.PORT;
  }

  public get nodeEnv(): string {
    return this.config.NODE_ENV;
  }

  public get isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public get isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public get isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  // Database Configuration
  public get databaseUrl(): string {
    return this.config.DATABASE_URL;
  }

  // JWT Configuration
  public get jwtSecret(): string {
    return this.config.JWT_SECRET;
  }

  public get jwtRefreshSecret(): string {
    return this.config.JWT_REFRESH_SECRET;
  }

  public get jwtExpiresIn(): string {
    return this.config.JWT_EXPIRES_IN;
  }

  public get jwtRefreshExpiresIn(): string {
    return this.config.JWT_REFRESH_EXPIRES_IN;
  }

  // Password Configuration
  public get bcryptRounds(): number {
    return this.config.BCRYPT_ROUNDS;
  }

  // Email Configuration
  public get smtpHost(): string {
    return this.config.SMTP_HOST;
  }

  public get smtpPort(): number {
    return this.config.SMTP_PORT;
  }

  public get smtpUser(): string {
    return this.config.SMTP_USER;
  }

  public get smtpPass(): string {
    return this.config.SMTP_PASS;
  }

  public get fromEmail(): string {
    return this.config.FROM_EMAIL;
  }

  public get fromName(): string {
    return this.config.FROM_NAME;
  }

  // Telegram Configuration
  public get telegramBotToken(): string | undefined {
    return this.config.TELEGRAM_BOT_TOKEN;
  }

  public get isTelegramEnabled(): boolean {
    return Boolean(this.config.TELEGRAM_BOT_TOKEN);
  }

  // Application Information
  public get appVersion(): string {
    return this.config.APP_VERSION;
  }

  public get appName(): string {
    return this.config.APP_NAME;
  }

  // CORS and Swagger
  public get corsOrigin(): string {
    return this.config.CORS_ORIGIN;
  }

  public get swaggerEnabled(): boolean {
    return this.config.SWAGGER_ENABLED === 'true';
  }

  // Request limits
  public get jsonLimit(): string {
    return this.config.JSON_LIMIT;
  }

  // Monitoring
  public get monitorConcurrency(): number {
    return this.config.MONITOR_CONCURRENCY;
  }

  // Rate limiting (API)
  public get apiRateLimitWindowMs(): number {
    return this.config.API_RATE_LIMIT_WINDOW_MS;
  }
  public get apiRateLimitMax(): number {
    return this.config.API_RATE_LIMIT_MAX;
  }

  // Rate limiting (Auth)
  public get authRateLimitWindowMs(): number {
    return this.config.AUTH_RATE_LIMIT_WINDOW_MS;
  }
  public get authRateLimitMax(): number {
    return this.config.AUTH_RATE_LIMIT_MAX;
  }

  /**
   * Получить конфигурацию для логирования (без секретов)
   */
  public getLoggableConfig(): Partial<Config> {
    const {
      JWT_SECRET,
      JWT_REFRESH_SECRET,
      SMTP_PASS,
      TELEGRAM_BOT_TOKEN,
      ...loggable
    } = this.config;
    return {
      ...loggable,
      JWT_SECRET: '***HIDDEN***',
      JWT_REFRESH_SECRET: '***HIDDEN***',
      SMTP_PASS: '***HIDDEN***',
      TELEGRAM_BOT_TOKEN: TELEGRAM_BOT_TOKEN ? '***HIDDEN***' : undefined,
    };
  }
}
