// Настройки для тестов
/* eslint-disable no-undef */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only';
process.env.JWT_REFRESH_SECRET =
  'test-refresh-secret-key-for-testing-purposes-only';
process.env.DATABASE_URL =
  'postgresql://test:test@localhost:5432/test_db?schema=public';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test-password';
process.env.FROM_EMAIL = 'noreply@test.com';
process.env.FROM_NAME = 'Test Monitor';
process.env.TELEGRAM_BOT_TOKEN = 'test-token';
process.env.APP_VERSION = '1.0.0';
process.env.APP_NAME = 'Test Monitor Backend';

// Увеличиваем timeout для тестов
jest.setTimeout(30000);

// Глобальные моки
global.console = {
  ...console,
  // Отключаем console.log в тестах
  log: jest.fn(),
  // Оставляем console.error для отладки
  // eslint-disable-next-line no-console
  error: console.error,
  // eslint-disable-next-line no-console
  warn: console.warn,
  // eslint-disable-next-line no-console
  info: console.info,
  // eslint-disable-next-line no-console
  debug: console.debug,
};
/* eslint-enable no-undef */
