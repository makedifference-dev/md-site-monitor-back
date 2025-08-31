import { TelegramService } from '@/modules/telegram/telegram.service';
import { ErrorService } from '@/modules/error/error.service';
import { DatabaseService } from '@/modules/core/database/database.service';
import { ConfigService } from '@/modules/core/config.service';

// Мокаем все зависимости
jest.mock('telegraf');
jest.mock('@/modules/core/database/database.service');
jest.mock('@/modules/core/config.service');
jest.mock('@/modules/error/error.service');

describe('TelegramService', () => {
  let telegramService: TelegramService;
  let mockErrorService: jest.Mocked<ErrorService>;
  let mockPrisma: jest.Mocked<any>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockTelegraf: jest.Mocked<any>;
  const handlers: any = {};

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
      start: jest.fn(cb => {
        handlers.start = cb;
      }),
      command: jest.fn((name, cb) => {
        handlers.commands = handlers.commands || {};
        handlers.commands[name] = cb;
      }),
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      catch: jest.fn(cb => {
        handlers.catch = cb;
      }),
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

  describe('bot command handlers', () => {
    const makeCtx = (overrides: any = {}) => ({
      reply: jest.fn(),
      from: { id: 42, username: 'user' },
      message: { text: '' },
      ...overrides,
    });

    it('/start replies welcome or error when no user', async () => {
      const ctx = makeCtx();
      await handlers.start(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Добро пожаловать'),
        { parse_mode: 'HTML' }
      );

      const ctxNoUser = makeCtx({ from: undefined });
      await handlers.start(ctxNoUser);
      expect(ctxNoUser.reply).toHaveBeenCalledWith(
        '❌ Ошибка получения информации о пользователе'
      );
    });

    it('/start catches reply errors and logs', async () => {
      const ctx = makeCtx();
      // Make reply throw to enter catch block
      const err = new Error('reply failed');
      (ctx.reply as jest.Mock).mockRejectedValueOnce(err);

      await handlers.start(ctx);
      expect(mockErrorService.logError).toHaveBeenCalledWith(
        err,
        'Telegram /start command error'
      );
    });

    it('/link validates arguments and email', async () => {
      // missing args
      const ctxMissing = makeCtx({ message: { text: '/link' } });
      await handlers.commands.link(ctxMissing);
      expect(ctxMissing.reply).toHaveBeenCalledWith(
        expect.stringContaining('Неверный формат команды')
      );

      // empty email
      const ctxEmpty = makeCtx({ message: { text: '/link   ' } });
      await handlers.commands.link(ctxEmpty);
      expect(ctxEmpty.reply).toHaveBeenCalledWith(
        '❌ Email не может быть пустым'
      );

      // invalid email
      const ctxInvalid = makeCtx({ message: { text: '/link invalid' } });
      await handlers.commands.link(ctxInvalid);
      expect(ctxInvalid.reply).toHaveBeenCalledWith(
        '❌ Неверный формат email адреса'
      );

      // success flow
      const ctxOk = makeCtx({ message: { text: '/link test@example.com' } });
      jest
        .spyOn(telegramService, 'linkTelegramAccount')
        .mockResolvedValue({ success: true });
      await handlers.commands.link(ctxOk);
      expect(ctxOk.reply).toHaveBeenCalledWith(
        expect.stringContaining('Аккаунт успешно привязан!'),
        { parse_mode: 'HTML' }
      );

      // failure from service
      const ctxFail = makeCtx({ message: { text: '/link user@example.com' } });
      jest
        .spyOn(telegramService, 'linkTelegramAccount')
        .mockResolvedValue({ success: false, error: 'err' });
      await handlers.commands.link(ctxFail);
      expect(ctxFail.reply).toHaveBeenCalledWith('❌ err', undefined);

      // exception path
      const ctxException = makeCtx({ message: { text: '/link x@y.com' } });
      jest
        .spyOn(telegramService, 'linkTelegramAccount')
        .mockRejectedValue(new Error('boom'));
      await handlers.commands.link(ctxException);
      expect(mockErrorService.logError).toHaveBeenCalled();
      expect(ctxException.reply).toHaveBeenCalledWith(
        '❌ Произошла ошибка при привязке аккаунта'
      );
    });

    it('/link passes undefined username when absent', async () => {
      const ctx = makeCtx({
        from: { id: 99, username: undefined },
        message: { text: '/link test@example.com' },
      });
      const spy = jest
        .spyOn(telegramService, 'linkTelegramAccount')
        .mockResolvedValue({ success: true });

      await handlers.commands.link(ctx);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          telegramId: '99',
          telegramUsername: undefined,
          email: 'test@example.com',
        })
      );
    });

    it('/link returns error when user missing', async () => {
      const ctx = makeCtx({
        from: undefined,
        message: { text: '/link test@example.com' },
      });
      await handlers.commands.link(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(
        '❌ Ошибка получения информации о пользователе'
      );
    });

    it('/unlink works and handles errors', async () => {
      const ctx = makeCtx();
      jest
        .spyOn(telegramService, 'unlinkTelegramAccount')
        .mockResolvedValue({ success: true });
      await handlers.commands.unlink(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Аккаунт успешно отвязан'),
        { parse_mode: 'HTML' }
      );

      jest
        .spyOn(telegramService, 'unlinkTelegramAccount')
        .mockResolvedValue({ success: false, error: 'nope' });
      const ctxFail = makeCtx();
      await handlers.commands.unlink(ctxFail);
      expect(ctxFail.reply).toHaveBeenCalledWith('❌ nope');

      const ctxNoUser = makeCtx({ from: undefined });
      await handlers.commands.unlink(ctxNoUser);
      expect(ctxNoUser.reply).toHaveBeenCalledWith(
        '❌ Ошибка получения информации о пользователе'
      );

      jest
        .spyOn(telegramService, 'unlinkTelegramAccount')
        .mockRejectedValue(new Error('db'));
      const ctxErr = makeCtx();
      await handlers.commands.unlink(ctxErr);
      expect(mockErrorService.logError).toHaveBeenCalled();
      expect(ctxErr.reply).toHaveBeenCalledWith(
        '❌ Произошла ошибка при отвязке аккаунта'
      );
    });

    it('/status shows info or not linked message', async () => {
      const ctx = makeCtx();
      mockPrisma.user.findFirst.mockResolvedValue({
        email: 'e@e.com',
        fullName: 'User',
        projects: [{ isActive: true }, { isActive: false }, { isActive: true }],
      });
      await handlers.commands.status(ctx);
      expect(ctx.reply).toHaveBeenCalled();
      const statusMsg = (ctx.reply as jest.Mock).mock.calls[0][0] as string;
      const statusOpts = (ctx.reply as jest.Mock).mock.calls[0][1];
      expect(statusMsg).toContain('Статус аккаунта');
      expect(statusMsg).toContain('Активных проектов:');
      expect(statusMsg).toContain('2');
      expect(statusOpts).toEqual({ parse_mode: 'HTML' });

      const ctxNoLink = makeCtx();
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await handlers.commands.status(ctxNoLink);
      expect(ctxNoLink.reply).toHaveBeenCalledWith(
        expect.stringContaining('Аккаунт не привязан'),
        { parse_mode: 'HTML' }
      );
    });

    it('/status uses fallbacks for missing names', async () => {
      const ctx = makeCtx({ from: { id: 42, username: undefined } });
      mockPrisma.user.findFirst.mockResolvedValue({
        email: 'e@e.com',
        fullName: undefined,
        projects: [{ isActive: true }],
      });

      await handlers.commands.status(ctx);

      const statusMsg = (ctx.reply as jest.Mock).mock.calls.pop()[0] as string;
      expect(statusMsg).toContain('<b>Пользователь:</b> Не указано');
      expect(statusMsg).toContain('<b>Telegram:</b> @Не указано');
    });

    it('/status handles missing user', async () => {
      const ctx = makeCtx({ from: undefined });
      await handlers.commands.status(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(
        '❌ Ошибка получения информации о пользователе'
      );
    });

    it('/status catches db errors and logs', async () => {
      const ctx = makeCtx();
      const err = new Error('db failed');
      mockPrisma.user.findFirst.mockRejectedValue(err);
      await handlers.commands.status(ctx);
      expect(mockErrorService.logError).toHaveBeenCalledWith(
        err,
        'Telegram /status command error'
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        '❌ Произошла ошибка при получении статуса'
      );
    });

    it('/help and unknown text handlers reply', async () => {
      const ctx = makeCtx();
      await handlers.commands.help(ctx);
      expect(ctx.reply).toHaveBeenCalled();

      const ctxText = makeCtx();
      await handlers.text(ctxText);
      expect(ctxText.reply).toHaveBeenCalledWith(
        '❓ Неизвестная команда. Используйте /help для получения справки.'
      );
    });

    it('bot catch logs errors', async () => {
      const err = new Error('telegraf');
      const ctx = makeCtx();
      handlers.catch(err, ctx);
      expect(mockErrorService.logError).toHaveBeenCalledWith(
        err,
        'Telegram bot error'
      );
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

    it('should fallback userName and errorMessage when absent', async () => {
      const projectId = 'project-1';

      mockPrisma.project.findFirst.mockResolvedValue({
        id: 'project-1',
        name: 'Test Project',
        websiteUrl: 'https://example.com',
        user: {
          telegramId: '123456789',
          fullName: undefined,
        },
      });

      mockPrisma.siteCheck.findFirst.mockResolvedValue({
        id: 'check-1',
        error: undefined,
        checkedAt: new Date('2024-01-01T12:00:00Z'),
      });

      jest
        .spyOn(telegramService, 'sendSiteDownNotification')
        .mockResolvedValue(true);

      await telegramService.handleSiteFailure(projectId);

      expect(telegramService.sendSiteDownNotification).toHaveBeenCalledWith({
        projectId: 'project-1',
        projectName: 'Test Project',
        websiteUrl: 'https://example.com',
        telegramId: '123456789',
        userName: 'User',
        errorMessage: 'Unknown error',
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

    it('should return early when no failed check found', async () => {
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

      mockPrisma.siteCheck.findFirst.mockResolvedValue(null);

      jest
        .spyOn(telegramService, 'sendSiteDownNotification')
        .mockResolvedValue(true);

      await telegramService.handleSiteFailure(projectId);

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
