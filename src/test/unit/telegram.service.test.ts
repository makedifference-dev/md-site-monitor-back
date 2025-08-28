import { TelegramService } from '../../modules/telegram/telegram.service';
import { ErrorService } from '../../modules/error/error.service';
import { DatabaseService } from '../../modules/core/database/database.service';
import { ConfigService } from '../../modules/core/config.service';

// Мокаем все зависимости
jest.mock('telegraf');
jest.mock('../../modules/core/database/database.service');
jest.mock('../../modules/core/config.service');
jest.mock('../../modules/error/error.service');

describe('TelegramService', () => {
  let telegramService: TelegramService;
  let mockErrorService: jest.Mocked<ErrorService>;
  let mockPrisma: jest.Mocked<any>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockTelegraf: jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Создаем моки
    mockErrorService = {
      logError: jest.fn(),
    } as any;

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      project: {
        findFirst: jest.fn(),
      },
      siteCheck: {
        findFirst: jest.fn(),
      },
    };

    mockConfigService = {
      telegramBotToken: 'test-token',
      isTelegramEnabled: true,
    } as any;

    mockTelegraf = {
      start: jest.fn(),
      command: jest.fn(),
      on: jest.fn(),
      catch: jest.fn(),
      launch: jest.fn(),
      stop: jest.fn(),
      telegram: {
        sendMessage: jest.fn(),
      },
    };

    // Мокаем статические методы
    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockPrisma);
    (ConfigService.getInstance as jest.Mock).mockReturnValue(mockConfigService);

    // Мокаем конструктор Telegraf
    const { Telegraf } = require('telegraf');
    Telegraf.mockImplementation(() => mockTelegraf);

    telegramService = new TelegramService(mockErrorService);
  });

  describe('constructor', () => {
    it('should create telegram service instance with token', () => {
      expect(telegramService).toBeDefined();
      expect(mockTelegraf.start).toHaveBeenCalled();
      expect(mockTelegraf.command).toHaveBeenCalled();
      expect(mockTelegraf.on).toHaveBeenCalled();
      expect(mockTelegraf.catch).toHaveBeenCalled();
    });

    it('should not initialize bot without token', () => {
      const mockConfigWithoutToken = {
        telegramBotToken: undefined,
        isTelegramEnabled: false,
      } as any;
      (ConfigService.getInstance as jest.Mock).mockReturnValue(
        mockConfigWithoutToken
      );

      const serviceWithoutToken = new TelegramService(mockErrorService);
      expect(serviceWithoutToken).toBeDefined();
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ];

      validEmails.forEach(email => {
        expect(telegramService['isValidEmail'](email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        '',
        'user space@example.com',
      ];

      invalidEmails.forEach(email => {
        expect(telegramService['isValidEmail'](email)).toBe(false);
      });
    });
  });

  describe('linkTelegramAccount', () => {
    it('should successfully link telegram account', async () => {
      const request = {
        telegramId: '123456789',
        telegramUsername: 'testuser',
        email: 'test@example.com',
      };

      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user-1', email: 'test@example.com' }) // User exists
        .mockResolvedValueOnce(null); // No existing telegram user

      mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });

      const result = await telegramService.linkTelegramAccount(request);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: {
          telegramId: '123456789',
          telegramUsername: 'testuser',
        },
      });
    });

    it('should fail when user does not exist', async () => {
      const request = {
        telegramId: '123456789',
        telegramUsername: 'testuser',
        email: 'nonexistent@example.com',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await telegramService.linkTelegramAccount(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Пользователь с таким email не найден');
    });

    it('should fail when telegram ID is already linked to another user', async () => {
      const request = {
        telegramId: '123456789',
        telegramUsername: 'testuser',
        email: 'test@example.com',
      };

      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user-1', email: 'test@example.com' })
        .mockResolvedValueOnce({ id: 'user-2', email: 'other@example.com' });

      const result = await telegramService.linkTelegramAccount(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('уже привязан к другому пользователю');
    });

    it('should handle database errors', async () => {
      const request = {
        telegramId: '123456789',
        telegramUsername: 'testuser',
        email: 'test@example.com',
      };

      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await telegramService.linkTelegramAccount(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Произошла ошибка при привязке аккаунта');
      expect(mockErrorService.logError).toHaveBeenCalled();
    });
  });

  describe('unlinkTelegramAccount', () => {
    it('should successfully unlink telegram account', async () => {
      const telegramId = '123456789';

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        telegramId: '123456789',
      });

      mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });

      const result = await telegramService.unlinkTelegramAccount(telegramId);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { telegramId: '123456789' },
        data: {
          telegramId: null,
          telegramUsername: null,
        },
      });
    });

    it('should fail when telegram account is not linked', async () => {
      const telegramId = '123456789';

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await telegramService.unlinkTelegramAccount(telegramId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Telegram аккаунт не привязан к системе');
    });

    it('should handle database errors', async () => {
      const telegramId = '123456789';

      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await telegramService.unlinkTelegramAccount(telegramId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Произошла ошибка при отвязке аккаунта');
      expect(mockErrorService.logError).toHaveBeenCalled();
    });
  });

  describe('sendNotification', () => {
    it('should send notification successfully', async () => {
      const notification = {
        chatId: 123456789,
        message: 'Test notification',
        parseMode: 'HTML' as const,
        disableWebPagePreview: true,
      };

      mockTelegraf.telegram.sendMessage.mockResolvedValue({});

      const result = await telegramService.sendNotification(notification);

      expect(result).toBe(true);
      expect(mockTelegraf.telegram.sendMessage).toHaveBeenCalledWith(
        123456789,
        'Test notification',
        {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }
      );
    });

    it('should handle notification errors', async () => {
      const notification = {
        chatId: 123456789,
        message: 'Test notification',
        parseMode: 'HTML' as const,
        disableWebPagePreview: false,
      };

      mockTelegraf.telegram.sendMessage.mockRejectedValue(
        new Error('Send failed')
      );

      const result = await telegramService.sendNotification(notification);

      expect(result).toBe(false);
      expect(mockErrorService.logError).toHaveBeenCalled();
    });

    it('should return false when bot is not initialized', async () => {
      // Создаем сервис без токена
      const mockConfigWithoutToken = {
        telegramBotToken: undefined,
        isTelegramEnabled: false,
      } as any;
      (ConfigService.getInstance as jest.Mock).mockReturnValue(
        mockConfigWithoutToken
      );

      const serviceWithoutToken = new TelegramService(mockErrorService);

      const notification = {
        chatId: 123456789,
        message: 'Test notification',
        parseMode: 'HTML' as const,
        disableWebPagePreview: false,
      };

      const result = await serviceWithoutToken.sendNotification(notification);

      expect(result).toBe(false);
    });
  });

  describe('sendSiteDownNotification', () => {
    it('should send site down notification', async () => {
      const notification = {
        projectId: 'project-1',
        projectName: 'Test Project',
        websiteUrl: 'https://example.com',
        telegramId: '123456789',
        userName: 'Test User',
        errorMessage: 'Connection timeout',
        failedAt: new Date('2024-01-01T12:00:00Z'),
      };

      // Мокаем sendNotification
      jest.spyOn(telegramService, 'sendNotification').mockResolvedValue(true);

      const result =
        await telegramService.sendSiteDownNotification(notification);

      expect(result).toBe(true);
      expect(telegramService.sendNotification).toHaveBeenCalledWith({
        chatId: 123456789,
        message: expect.stringContaining('Site Down Alert!'),
        parseMode: 'HTML',
        disableWebPagePreview: true,
      });
    });
  });

  describe('handleSiteFailure', () => {
    it('should handle site failure and send notification', async () => {
      const projectId = 'project-1';

      mockPrisma.project.findFirst.mockResolvedValue({
        id: 'project-1',
        name: 'Test Project',
        websiteUrl: 'https://example.com',
        user: {
          telegramId: '123456789',
          fullName: 'Test User',
        },
      });

      mockPrisma.siteCheck.findFirst.mockResolvedValue({
        id: 'check-1',
        error: 'Connection timeout',
        checkedAt: new Date('2024-01-01T12:00:00Z'),
      });

      // Мокаем sendSiteDownNotification
      jest
        .spyOn(telegramService, 'sendSiteDownNotification')
        .mockResolvedValue(true);

      await telegramService.handleSiteFailure(projectId);

      expect(telegramService.sendSiteDownNotification).toHaveBeenCalledWith({
        projectId: 'project-1',
        projectName: 'Test Project',
        websiteUrl: 'https://example.com',
        telegramId: '123456789',
        userName: 'Test User',
        errorMessage: 'Connection timeout',
        failedAt: expect.any(Date),
      });
    });

    it('should not send notification when user has no telegram', async () => {
      const projectId = 'project-1';

      mockPrisma.project.findFirst.mockResolvedValue({
        id: 'project-1',
        name: 'Test Project',
        websiteUrl: 'https://example.com',
        user: {
          telegramId: null,
          fullName: 'Test User',
        },
      });

      jest
        .spyOn(telegramService, 'sendSiteDownNotification')
        .mockResolvedValue(true);

      await telegramService.handleSiteFailure(projectId);

      expect(telegramService.sendSiteDownNotification).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const projectId = 'project-1';

      mockPrisma.project.findFirst.mockRejectedValue(
        new Error('Database error')
      );

      jest
        .spyOn(telegramService, 'sendSiteDownNotification')
        .mockResolvedValue(true);

      await telegramService.handleSiteFailure(projectId);

      expect(mockErrorService.logError).toHaveBeenCalled();
      expect(telegramService.sendSiteDownNotification).not.toHaveBeenCalled();
    });
  });

  describe('start and stop', () => {
    it('should start bot successfully', async () => {
      await telegramService.start();

      expect(mockTelegraf.launch).toHaveBeenCalled();
    });

    it('should handle start errors', async () => {
      mockTelegraf.launch.mockRejectedValue(new Error('Start failed'));

      await telegramService.start();

      expect(mockErrorService.logError).toHaveBeenCalled();
    });

    it('should stop bot successfully', () => {
      telegramService.stop();

      expect(mockTelegraf.stop).toHaveBeenCalled();
    });

    it('should handle stop errors', () => {
      mockTelegraf.stop.mockImplementation(() => {
        throw new Error('Stop failed');
      });

      telegramService.stop();

      expect(mockErrorService.logError).toHaveBeenCalled();
    });

    it('should not start/stop when not initialized', () => {
      const mockConfigWithoutToken = {
        telegramBotToken: undefined,
        isTelegramEnabled: false,
      } as any;
      (ConfigService.getInstance as jest.Mock).mockReturnValue(
        mockConfigWithoutToken
      );

      const serviceWithoutToken = new TelegramService(mockErrorService);

      serviceWithoutToken.start();
      serviceWithoutToken.stop();

      expect(mockTelegraf.launch).not.toHaveBeenCalled();
      expect(mockTelegraf.stop).not.toHaveBeenCalled();
    });
  });
});
