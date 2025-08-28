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
const port = configService.port;

// Performance middleware
app.use(compressionMiddleware);
app.use(performanceHeaders);
app.use(slowQueryLogger(1000)); // Логируем запросы медленнее 1 секунды

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
app.use('/auth', authRateLimit); // Строгий лимит для авторизации
app.use('/api', apiRateLimit); // Общий лимит для API

// Logging and parsing
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' })); // Ограничиваем размер JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

    console.log('🛑 All services stopped');
    return Promise.resolve();
  },
});

gracefulShutdown.init();
