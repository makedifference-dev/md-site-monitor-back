import { Server } from 'http';
import { DatabaseService } from './database/database.service';
import type { GracefulShutdownOptions } from './core.types';

export class GracefulShutdown {
  private server: Server;
  private timeout: number;
  private onShutdown?: () => Promise<void>;
  private isShuttingDown = false;

  constructor(options: GracefulShutdownOptions) {
    this.server = options.server;
    this.timeout = options.timeout ?? 30000; // 30 секунд по умолчанию
    this.onShutdown = options.onShutdown;
  }

  /**
   * Инициализация graceful shutdown
   */
  init(): void {
    // Обработка SIGTERM (сигнал завершения от Docker/Kubernetes)
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM, starting graceful shutdown...');
      void this.shutdown();
    });

    // Обработка SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      console.log('🛑 Received SIGINT, starting graceful shutdown...');
      void this.shutdown();
    });

    // Обработка необработанных исключений
    process.on('uncaughtException', (error: Error) => {
      console.error('💥 Uncaught Exception:', error);
      void this.shutdown();
    });

    // Обработка необработанных отклонений Promise
    process.on(
      'unhandledRejection',
      (reason: unknown, promise: Promise<unknown>) => {
        console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
        void this.shutdown();
      }
    );

    console.log('✅ Graceful shutdown initialized');
  }

  /**
   * Выполнение graceful shutdown
   */
  private async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      console.log('⚠️ Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;
    console.log('🔄 Starting graceful shutdown...');

    try {
      // Выполняем пользовательский callback
      if (this.onShutdown) {
        console.log('🔄 Executing custom shutdown logic...');
        await this.onShutdown();
      }

      // Закрываем HTTP сервер
      console.log('🔄 Closing HTTP server...');
      await this.closeServer();

      // Закрываем соединение с базой данных
      console.log('🔄 Closing database connection...');
      await DatabaseService.disconnect();

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Закрытие HTTP сервера
   */
  private closeServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Устанавливаем таймаут для закрытия сервера
      const timeout = setTimeout(() => {
        console.warn('⚠️ Server close timeout, forcing exit...');
        process.exit(1);
      }, this.timeout);
      timeout.unref(); // Не блокировать завершение процесса

      this.server.close(error => {
        clearTimeout(timeout);
        if (error) {
          console.error('❌ Error closing server:', error);
          reject(error);
        } else {
          console.log('✅ Server closed successfully');
          resolve();
        }
      });

      // Останавливаем прием новых соединений
      this.server.unref();
    });
  }

  /**
   * Принудительное завершение (для экстренных случаев)
   */
  forceExit(): void {
    console.log('💥 Force exit requested');
    process.exit(1);
  }
}
