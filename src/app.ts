import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import AppModule from './modules/app.module';
import { GracefulShutdown } from './modules/core/graceful-shutdown';
import { ConfigService } from './modules/core/config.service';
import {
  compressionMiddleware,
  apiRateLimit,
  authRateLimit,
  performanceHeaders,
  slowQueryLogger,
} from './modules/core/performance.middleware';

// Загружаем переменные окружения
dotenv.config();

// Инициализируем конфигурацию
const configService = ConfigService.getInstance();

const app = express();
// Behind reverse proxies (e.g., Nginx) trust X-Forwarded-* headers for correct client IP/proto
app.set('trust proxy', 1);
const port = configService.port;

// Performance middleware
app.use(compressionMiddleware);
app.use(performanceHeaders);
app.use(slowQueryLogger(1000)); // Логируем запросы медленнее 1 секунды

// Security middleware
app.use(helmet());
// CORS: restrict to configured origins (comma-separated) unless '*'
const corsOrigin = configService.corsOrigin;
const allowedOrigins = corsOrigin.split(',').map(o => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigin === '*' || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// Rate limiting
app.use('/auth', authRateLimit); // Строгий лимит для авторизации
app.use('/', apiRateLimit); // Общий лимит для всех роутов (health/docs пропускаем в skip)

// Logging and parsing
app.use(morgan('combined'));
app.use(express.json({ limit: configService.jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: configService.jsonLimit }));

// Инициализация модулей
const appModule = new AppModule();

// Подключаем роуты (включая обработку ошибок)
app.use(appModule.getRouter());

// Инициализация и запуск мониторинга
const monitoringModule = appModule.getMonitoringModule();
void monitoringModule.startMonitoring();

// Запуск Telegram бота
const telegramModule = appModule.getTelegramModule();
void telegramModule.start();

// Запуск сервера
const server = app.listen(port, () => {
  console.log(`🚀 ${configService.appName} запущен на порту ${port}`);
  console.log(`📚 Документация API: http://localhost:${port}/api-docs`);
  console.log(`🔐 Авторизация: http://localhost:${port}/auth`);
  console.log(`📊 Мониторинг: http://localhost:${port}/monitoring`);
  console.log(`🏥 Health Check: http://localhost:${port}/health`);
  console.log(`🌍 Environment: ${configService.nodeEnv}`);
  console.log(`📦 Version: ${configService.appVersion}`);
});

// Инициализация graceful shutdown
const gracefulShutdown = new GracefulShutdown({
  server,
  timeout: 30000, // 30 секунд
  onShutdown: async () => {
    // Останавливаем мониторинг
    const monitoringModule = appModule.getMonitoringModule();
    void monitoringModule.stopMonitoring();

    // Останавливаем Telegram бота
    const telegramModule = appModule.getTelegramModule();
    void telegramModule.stop();

    // Закрываем соединение с БД
    const { DatabaseService } = await import(
      './modules/core/database/database.service'
    );
    await DatabaseService.disconnect();

    console.log('🛑 All services stopped');
    return Promise.resolve();
  },
});

gracefulShutdown.init();
