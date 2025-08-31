import { PrismaClient } from '@prisma/client';
import { DatabaseService } from '@/modules/core/database/database.service';

// Мокаем PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('DatabaseService', () => {
  let mockPrismaClient: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    // Очищаем singleton instance перед каждым тестом
    (DatabaseService as any).instance = undefined;

    // Создаем мок PrismaClient
    mockPrismaClient = {
      $disconnect: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Мокаем конструктор PrismaClient
    (PrismaClient as jest.Mock).mockImplementation(() => mockPrismaClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should create a new instance when called for the first time', () => {
      const instance = DatabaseService.getInstance();

      expect(PrismaClient).toHaveBeenCalledTimes(1);
      expect(instance).toBe(mockPrismaClient);
    });

    it('should return the same instance when called multiple times', () => {
      const instance1 = DatabaseService.getInstance();
      const instance2 = DatabaseService.getInstance();
      const instance3 = DatabaseService.getInstance();

      expect(PrismaClient).toHaveBeenCalledTimes(1); // Конструктор вызывается только один раз
      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
      expect(instance1).toBe(mockPrismaClient);
    });

    it('should maintain singleton pattern across multiple calls', () => {
      // Первый вызов
      const firstInstance = DatabaseService.getInstance();
      expect(PrismaClient).toHaveBeenCalledTimes(1);

      // Второй вызов
      const secondInstance = DatabaseService.getInstance();
      expect(PrismaClient).toHaveBeenCalledTimes(1); // Конструктор не вызывается снова

      // Третий вызов
      const thirdInstance = DatabaseService.getInstance();
      expect(PrismaClient).toHaveBeenCalledTimes(1); // Конструктор не вызывается снова

      // Все экземпляры должны быть одинаковыми
      expect(firstInstance).toBe(secondInstance);
      expect(secondInstance).toBe(thirdInstance);
    });
  });

  describe('disconnect', () => {
    it('should disconnect when instance exists', async () => {
      // Создаем экземпляр
      DatabaseService.getInstance();

      // Отключаемся
      await DatabaseService.disconnect();

      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when instance does not exist', async () => {
      // Убеждаемся, что экземпляр не создан
      (DatabaseService as any).instance = undefined;

      // Отключаемся без создания экземпляра
      await expect(DatabaseService.disconnect()).resolves.toBeUndefined();

      expect(mockPrismaClient.$disconnect).not.toHaveBeenCalled();
    });

    it('should handle disconnect errors gracefully', async () => {
      // Создаем экземпляр
      DatabaseService.getInstance();

      // Мокаем ошибку при отключении
      const disconnectError = new Error('Disconnect failed');
      mockPrismaClient.$disconnect.mockRejectedValueOnce(disconnectError);

      // Отключаемся и ожидаем ошибку
      await expect(DatabaseService.disconnect()).rejects.toThrow(
        'Disconnect failed'
      );

      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should clear instance after successful disconnect', async () => {
      // Создаем экземпляр
      const instance = DatabaseService.getInstance();
      expect(instance).toBe(mockPrismaClient);

      // Отключаемся
      await DatabaseService.disconnect();

      // Проверяем, что экземпляр очищен
      expect((DatabaseService as any).instance).toBeNull();
    });

    it('should handle multiple disconnect calls', async () => {
      // Создаем экземпляр
      DatabaseService.getInstance();

      // Первый вызов disconnect
      await DatabaseService.disconnect();
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);

      // Второй вызов disconnect (экземпляр уже очищен)
      await DatabaseService.disconnect();
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1); // Не вызывается снова
    });
  });

  describe('singleton pattern integrity', () => {
    it('should maintain singleton pattern after disconnect and new getInstance', async () => {
      // Первый экземпляр
      const firstInstance = DatabaseService.getInstance();
      expect(PrismaClient).toHaveBeenCalledTimes(1);

      // Отключаемся
      await DatabaseService.disconnect();

      // Создаем новый мок для второго экземпляра
      const newMockPrismaClient = {
        $disconnect: jest.fn().mockResolvedValue(undefined),
      } as any;
      (PrismaClient as jest.Mock).mockImplementation(() => newMockPrismaClient);

      // Новый экземпляр после отключения
      const secondInstance = DatabaseService.getInstance();
      expect(PrismaClient).toHaveBeenCalledTimes(2); // Конструктор вызывается снова

      // Экземпляры должны быть разными (новый PrismaClient)
      expect(firstInstance).not.toBe(secondInstance);
    });

    it('should create new PrismaClient instance after disconnect', async () => {
      // Первый экземпляр
      const firstInstance = DatabaseService.getInstance();
      expect(PrismaClient).toHaveBeenCalledTimes(1);

      // Отключаемся
      await DatabaseService.disconnect();

      // Очищаем моки для создания нового экземпляра
      jest.clearAllMocks();
      const newMockPrismaClient = {
        $disconnect: jest.fn().mockResolvedValue(undefined),
      } as any;
      (PrismaClient as jest.Mock).mockImplementation(() => newMockPrismaClient);

      // Новый экземпляр
      const secondInstance = DatabaseService.getInstance();
      expect(PrismaClient).toHaveBeenCalledTimes(1);
      expect(secondInstance).toBe(newMockPrismaClient);
    });
  });

  describe('error handling', () => {
    it('should handle PrismaClient constructor errors', () => {
      // Мокаем ошибку в конструкторе
      const constructorError = new Error('PrismaClient initialization failed');
      (PrismaClient as jest.Mock).mockImplementationOnce(() => {
        throw constructorError;
      });

      // Ожидаем, что ошибка будет выброшена
      expect(() => DatabaseService.getInstance()).toThrow(
        'PrismaClient initialization failed'
      );
    });

    it('should handle disconnect timeout', async () => {
      // Создаем экземпляр
      DatabaseService.getInstance();

      // Мокаем долгое отключение
      mockPrismaClient.$disconnect.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      // Отключаемся
      const disconnectPromise = DatabaseService.disconnect();

      // Проверяем, что промис не завершается сразу
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);

      // Ждем завершения
      await disconnectPromise;
    });
  });
});
