import { Server } from 'http';
import { GracefulShutdown } from '../../modules/core/graceful-shutdown';

// Мокаем DatabaseService
jest.mock('../../modules/core/database/database.service', () => ({
  DatabaseService: {
    disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('GracefulShutdown', () => {
  let gracefulShutdown: GracefulShutdown;
  let mockServer: jest.Mocked<Server>;
  let mockOnShutdown: jest.Mock;

  beforeEach(() => {
    // Создаем мок сервера
    mockServer = {
      close: jest.fn(),
      unref: jest.fn(),
    } as any;

    mockOnShutdown = jest.fn().mockResolvedValue(undefined);

    // Очищаем все обработчики событий
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');

    // Мокаем console методы
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();

    // Мокаем process.exit чтобы он не завершал тест
    jest.spyOn(process, 'exit').mockImplementation(() => {
      // Не выбрасываем ошибку, просто ничего не делаем
      return undefined as never;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default timeout', () => {
      gracefulShutdown = new GracefulShutdown({
        server: mockServer,
      });

      expect(gracefulShutdown).toBeInstanceOf(GracefulShutdown);
    });

    it('should create instance with custom timeout', () => {
      gracefulShutdown = new GracefulShutdown({
        server: mockServer,
        timeout: 5000,
      });

      expect(gracefulShutdown).toBeInstanceOf(GracefulShutdown);
    });

    it('should create instance with onShutdown callback', () => {
      gracefulShutdown = new GracefulShutdown({
        server: mockServer,
        onShutdown: mockOnShutdown,
      });

      expect(gracefulShutdown).toBeInstanceOf(GracefulShutdown);
    });
  });

  describe('init', () => {
    it('should initialize event listeners', () => {
      gracefulShutdown = new GracefulShutdown({
        server: mockServer,
      });

      gracefulShutdown.init();

      expect(process.listenerCount('SIGTERM')).toBe(1);
      expect(process.listenerCount('SIGINT')).toBe(1);
      expect(process.listenerCount('uncaughtException')).toBe(1);
      expect(process.listenerCount('unhandledRejection')).toBe(1);
      expect(console.log).toHaveBeenCalledWith(
        '✅ Graceful shutdown initialized'
      );
    });
  });

  describe('SIGTERM handling', () => {
    it('should handle SIGTERM signal', async () => {
      gracefulShutdown = new GracefulShutdown({
        server: mockServer,
      });

      gracefulShutdown.init();

      // Симулируем SIGTERM
      process.emit('SIGTERM');

      expect(console.log).toHaveBeenCalledWith(
        '🛑 Received SIGTERM, starting graceful shutdown...'
      );
    });
  });

  describe('SIGINT handling', () => {
    it('should handle SIGINT signal', async () => {
      gracefulShutdown = new GracefulShutdown({
        server: mockServer,
      });

      gracefulShutdown.init();

      // Симулируем SIGINT
      process.emit('SIGINT');

      expect(console.log).toHaveBeenCalledWith(
        '🛑 Received SIGINT, starting graceful shutdown...'
      );
    });
  });

  describe('uncaughtException handling', () => {
    it('should handle uncaughtException', async () => {
      gracefulShutdown = new GracefulShutdown({
        server: mockServer,
      });

      gracefulShutdown.init();

      const error = new Error('Test error');

      // Симулируем uncaughtException
      process.emit('uncaughtException', error);

      expect(console.error).toHaveBeenCalledWith(
        '💥 Uncaught Exception:',
        error
      );
    });
  });

  describe('unhandledRejection handling', () => {
    it('should handle unhandledRejection', async () => {
      gracefulShutdown = new GracefulShutdown({
        server: mockServer,
      });

      gracefulShutdown.init();

      const reason = new Error('Test reason');
      const promise = Promise.reject(reason);

      // Обрабатываем промис чтобы избежать реального unhandledRejection
      promise.catch(() => {});

      // Симулируем unhandledRejection
      process.emit('unhandledRejection', reason, promise);

      expect(console.error).toHaveBeenCalledWith(
        '💥 Unhandled Rejection at:',
        promise,
        'reason:',
        reason
      );
    });
  });

  describe('shutdown process', () => {
    it('should execute custom shutdown callback', async () => {
      // Временно убираем мок process.exit для этого теста
      jest.restoreAllMocks();

      gracefulShutdown = new GracefulShutdown({
        server: mockServer,
        onShutdown: mockOnShutdown,
      });

      gracefulShutdown.init();

      // Симулируем SIGTERM
      process.emit('SIGTERM');

      // Ждем выполнения асинхронных операций
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockOnShutdown).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        '🔄 Executing custom shutdown logic...'
      );

      // Восстанавливаем моки для следующих тестов
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
    });

    it('should not execute shutdown callback if not provided', async () => {
      gracefulShutdown = new GracefulShutdown({
        server: mockServer,
      });

      gracefulShutdown.init();

      // Симулируем SIGTERM
      process.emit('SIGTERM');

      // Ждем выполнения асинхронных операций
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockOnShutdown).not.toHaveBeenCalled();
    });

    it('should prevent multiple shutdowns', async () => {
      gracefulShutdown = new GracefulShutdown({
        server: mockServer,
      });

      gracefulShutdown.init();

      // Симулируем первый SIGTERM
      process.emit('SIGTERM');

      // Симулируем второй SIGTERM
      process.emit('SIGTERM');

      expect(console.log).toHaveBeenCalledWith(
        '⚠️ Shutdown already in progress...'
      );
    });

    it('should handle shutdown callback error', async () => {
      const errorOnShutdown = jest
        .fn()
        .mockRejectedValue(new Error('Shutdown error'));

      gracefulShutdown = new GracefulShutdown({
        server: mockServer,
        onShutdown: errorOnShutdown,
      });

      gracefulShutdown.init();

      // Симулируем SIGTERM
      process.emit('SIGTERM');

      // Ждем выполнения асинхронных операций
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(console.error).toHaveBeenCalledWith(
        '❌ Error during graceful shutdown:',
        expect.any(Error)
      );
    });
  });

  describe('server closing', () => {
    it('should close server successfully', async () => {
      mockServer.close.mockImplementation(callback => {
        callback?.(undefined);
        return mockServer;
      });

      gracefulShutdown = new GracefulShutdown({
        server: mockServer,
      });

      gracefulShutdown.init();

      // Симулируем SIGTERM
      process.emit('SIGTERM');

      // Ждем выполнения асинхронных операций
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockServer.close).toHaveBeenCalled();
      expect(mockServer.unref).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('✅ Server closed successfully');
    });

    it('should handle server close error', async () => {
      const serverError = new Error('Server close error');
      mockServer.close.mockImplementation(callback => {
        callback?.(serverError);
        return mockServer;
      });

      gracefulShutdown = new GracefulShutdown({
        server: mockServer,
      });

      gracefulShutdown.init();

      // Симулируем SIGTERM
      process.emit('SIGTERM');

      // Ждем выполнения асинхронных операций
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(console.error).toHaveBeenCalledWith(
        '❌ Error closing server:',
        serverError
      );
    });

    it('should handle server close timeout', async () => {
      mockServer.close.mockImplementation(() => {
        // Не вызываем callback, чтобы сработал таймаут
        return mockServer;
      });

      gracefulShutdown = new GracefulShutdown({
        server: mockServer,
        timeout: 1, // Очень короткий таймаут для теста
      });

      gracefulShutdown.init();

      // Симулируем SIGTERM
      process.emit('SIGTERM');

      // Ждем таймаута
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ Server close timeout, forcing exit...'
      );
    });
  });

  describe('forceExit', () => {
    it('should force exit immediately', () => {
      gracefulShutdown = new GracefulShutdown({
        server: mockServer,
      });

      gracefulShutdown.forceExit();

      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.log).toHaveBeenCalledWith('💥 Force exit requested');
    });
  });

  describe('database disconnection', () => {
    it('should disconnect from database during shutdown', async () => {
      const {
        DatabaseService,
      } = require('../../modules/core/database/database.service');

      gracefulShutdown = new GracefulShutdown({
        server: mockServer,
      });

      gracefulShutdown.init();

      // Симулируем SIGTERM
      process.emit('SIGTERM');

      // Ждем выполнения асинхронных операций
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(DatabaseService.disconnect).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        '🔄 Closing database connection...'
      );
    });
  });
});
