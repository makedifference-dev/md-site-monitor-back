/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-optional-chain */
import { Telegraf, Context } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import { ErrorService } from '../error/error.service';
import { DatabaseService } from '../core/database/database.service';
import { ConfigService } from '../core/config.service';
import type {
  TelegramNotification,
  SiteDownTelegramNotification,
  TelegramLinkRequest,
} from './telegram.types';

export class TelegramService {
  private bot!: Telegraf<Context>;
  private prisma: PrismaClient;
  private errorService: ErrorService;
  private configService: ConfigService;
  private isInitialized = false;

  constructor(errorService: ErrorService) {
    this.prisma = DatabaseService.getInstance();
    this.errorService = errorService;
    this.configService = ConfigService.getInstance();

    const token = this.configService.telegramBotToken;
    if (!token) {
      console.warn(
        '⚠️ TELEGRAM_BOT_TOKEN not set, Telegram bot will not be initialized'
      );
      return;
    }

    this.bot = new Telegraf(token);
    this.setupBotHandlers();
    this.isInitialized = true;
  }

  private setupBotHandlers(): void {
    // Обработка команды /start
    this.bot.start(async ctx => {
      try {
        const user = ctx.from;
        if (!user) {
          await ctx.reply('❌ Ошибка получения информации о пользователе');
          return;
        }

        const welcomeMessage = `
🤖 <b>Добро пожаловать в MD Site Monitor Bot!</b>

Этот бот поможет вам получать уведомления о состоянии ваших сайтов.

📋 <b>Доступные команды:</b>
/start - Показать это сообщение
/link <email> - Привязать аккаунт к Telegram
/unlink - Отвязать аккаунт от Telegram
/status - Проверить статус привязки
/help - Показать справку

🔗 <b>Для привязки аккаунта:</b>
1. Зарегистрируйтесь на сайте
2. Используйте команду /link your@email.com
3. Получайте уведомления в Telegram!

<i>Ваш Telegram ID: ${user.id}</i>
        `;

        await ctx.reply(welcomeMessage, { parse_mode: 'HTML' });
      } catch (error) {
        this.errorService.logError(
          error as Error,
          'Telegram /start command error'
        );
        await ctx.reply('❌ Произошла ошибка при обработке команды');
      }
    });

    // Обработка команды /link
    this.bot.command('link', async ctx => {
      try {
        const user = ctx.from;
        if (!user) {
          await ctx.reply('❌ Ошибка получения информации о пользователе');
          return;
        }

        const args = ctx.message.text.split(' ');
        if (args.length < 2) {
          await ctx.reply(
            '❌ Неверный формат команды.\n\nИспользуйте: /link your@email.com'
          );
          return;
        }

        const email = args[1]?.trim();
        if (!email) {
          await ctx.reply('❌ Email не может быть пустым');
          return;
        }
        if (!this.isValidEmail(email)) {
          await ctx.reply('❌ Неверный формат email адреса');
          return;
        }

        const result = await this.linkTelegramAccount({
          telegramId: user.id.toString(),
          telegramUsername: user.username,
          email,
        });

        if (result.success) {
          await ctx.reply(
            `✅ <b>Аккаунт успешно привязан!</b>\n\nТеперь вы будете получать уведомления о состоянии ваших сайтов в Telegram.`,
            { parse_mode: 'HTML' }
          );
        } else {
          await ctx.reply(`❌ ${result.error}`);
        }
      } catch (error) {
        this.errorService.logError(
          error as Error,
          'Telegram /link command error'
        );
        await ctx.reply('❌ Произошла ошибка при привязке аккаунта');
      }
    });

    // Обработка команды /unlink
    this.bot.command('unlink', async ctx => {
      try {
        const user = ctx.from;
        if (!user) {
          await ctx.reply('❌ Ошибка получения информации о пользователе');
          return;
        }

        const result = await this.unlinkTelegramAccount(user.id.toString());

        if (result.success) {
          await ctx.reply(
            '✅ <b>Аккаунт успешно отвязан!</b>\n\nВы больше не будете получать уведомления в Telegram.',
            { parse_mode: 'HTML' }
          );
        } else {
          await ctx.reply(`❌ ${result.error}`);
        }
      } catch (error) {
        this.errorService.logError(
          error as Error,
          'Telegram /unlink command error'
        );
        await ctx.reply('❌ Произошла ошибка при отвязке аккаунта');
      }
    });

    // Обработка команды /status
    this.bot.command('status', async ctx => {
      try {
        const user = ctx.from;
        if (!user) {
          await ctx.reply('❌ Ошибка получения информации о пользователе');
          return;
        }

        const dbUser = await this.prisma.user.findFirst({
          where: { telegramId: user.id.toString() },
          include: { projects: true },
        });

        if (!dbUser) {
          await ctx.reply(
            '❌ <b>Аккаунт не привязан</b>\n\nИспользуйте команду /link your@email.com для привязки аккаунта.',
            { parse_mode: 'HTML' }
          );
          return;
        }

        const activeProjects = dbUser.projects.filter(p => p.isActive);
        const statusMessage = `
📊 <b>Статус аккаунта:</b>

👤 <b>Пользователь:</b> ${dbUser.fullName ?? 'Не указано'}
📧 <b>Email:</b> ${dbUser.email}
🔗 <b>Telegram:</b> @${user.username ?? 'Не указано'}
📈 <b>Активных проектов:</b> ${activeProjects.length}

✅ <b>Аккаунт привязан и активен!</b>
        `;

        await ctx.reply(statusMessage, { parse_mode: 'HTML' });
      } catch (error) {
        this.errorService.logError(
          error as Error,
          'Telegram /status command error'
        );
        await ctx.reply('❌ Произошла ошибка при получении статуса');
      }
    });

    // Обработка команды /help
    this.bot.command('help', async _ctx => {
      const helpMessage = `
📚 <b>Справка по командам:</b>

/start - Начать работу с ботом
/link <email> - Привязать аккаунт к Telegram
/unlink - Отвязать аккаунт от Telegram
/status - Проверить статус привязки
/help - Показать эту справку

🔗 <b>Как привязать аккаунт:</b>
1. Зарегистрируйтесь на сайте MD Site Monitor
2. Используйте команду: /link your@email.com
3. Готово! Теперь вы будете получать уведомления

📱 <b>Уведомления:</b>
Бот автоматически отправляет уведомления при:
• Первой подряд неудачной проверке сайта
• Проблемах с SSL сертификатами
• Других критических ошибках

<i>Поддержка: support@mdsitemonitor.com</i>
      `;

      await _ctx.reply(helpMessage, { parse_mode: 'HTML' });
    });

    // Обработка неизвестных команд
    this.bot.on('text', async _ctx => {
      await _ctx.reply(
        '❓ Неизвестная команда. Используйте /help для получения справки.'
      );
    });

    // Обработка ошибок
    this.bot.catch((err, _ctx) => {
      this.errorService.logError(err as Error, 'Telegram bot error');
    });
  }

  /**
   * Запускает бота
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      console.warn('⚠️ Telegram bot not initialized (no token)');
      return;
    }

    try {
      await this.bot.launch();
      console.log('🤖 Telegram bot started successfully');
    } catch (error) {
      this.errorService.logError(error as Error, 'Telegram bot start failed');
    }
  }

  /**
   * Останавливает бота
   */
  stop(): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      this.bot.stop();
      console.log('🤖 Telegram bot stopped');
    } catch (error) {
      this.errorService.logError(error as Error, 'Telegram bot stop error');
    }
  }

  /**
   * Отправляет уведомление в Telegram
   */
  async sendNotification(notification: TelegramNotification): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('⚠️ Telegram bot not initialized, cannot send notification');
      return false;
    }

    try {
      const options: {
        parse_mode?: 'HTML' | 'Markdown';
        disable_web_page_preview?: boolean;
      } = {
        parse_mode: notification.parseMode,
      };

      if (notification.disableWebPagePreview) {
        options.disable_web_page_preview = true;
      }

      await this.bot.telegram.sendMessage(
        notification.chatId,
        notification.message,
        options
      );
      console.log(`📱 Telegram notification sent to ${notification.chatId}`);
      return true;
    } catch (error) {
      this.errorService.logError(
        error as Error,
        'Telegram notification failed'
      );
      return false;
    }
  }

  /**
   * Отправляет уведомление о недоступности сайта
   */
  async sendSiteDownNotification(
    notification: SiteDownTelegramNotification
  ): Promise<boolean> {
    const message = `
🚨 <b>Site Down Alert!</b>

Сайт <b>${notification.projectName}</b> недоступен!

🌐 <b>URL:</b> ${notification.websiteUrl}
❌ <b>Ошибка:</b> ${notification.errorMessage}
⏰ <b>Обнаружено:</b> ${notification.failedAt.toLocaleString('ru-RU')}

Пожалуйста, проверьте ваш сайт и устраните проблему как можно скорее.

<i>Это автоматическое уведомление от MD Site Monitor</i>
    `;

    return this.sendNotification({
      chatId: parseInt(notification.telegramId),
      message,
      parseMode: 'HTML',
      disableWebPagePreview: true,
    });
  }

  /**
   * Привязывает Telegram аккаунт к пользователю
   */
  async linkTelegramAccount(
    request: TelegramLinkRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Проверяем, существует ли пользователь с таким email
      const user = await this.prisma.user.findUnique({
        where: { email: request.email },
      });

      if (!user) {
        return {
          success: false,
          error:
            'Пользователь с таким email не найден. Сначала зарегистрируйтесь на сайте.',
        };
      }

      // Проверяем, не привязан ли уже этот Telegram ID к другому пользователю
      const existingTelegramUser = await this.prisma.user.findUnique({
        where: { telegramId: request.telegramId },
      });

      if (existingTelegramUser && existingTelegramUser.id !== user.id) {
        return {
          success: false,
          error: 'Этот Telegram аккаунт уже привязан к другому пользователю.',
        };
      }

      // Обновляем пользователя
      await this.prisma.user.update({
        where: { email: request.email },
        data: {
          telegramId: request.telegramId,
          telegramUsername: request.telegramUsername,
        },
      });

      return { success: true };
    } catch (error) {
      this.errorService.logError(
        error as Error,
        'Telegram account linking failed'
      );
      return {
        success: false,
        error: 'Произошла ошибка при привязке аккаунта. Попробуйте позже.',
      };
    }
  }

  /**
   * Отвязывает Telegram аккаунт от пользователя
   */
  async unlinkTelegramAccount(
    telegramId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { telegramId },
      });

      if (!user) {
        return {
          success: false,
          error: 'Telegram аккаунт не привязан к системе.',
        };
      }

      await this.prisma.user.update({
        where: { telegramId },
        data: {
          telegramId: null,
          telegramUsername: null,
        },
      });

      return { success: true };
    } catch (error) {
      this.errorService.logError(
        error as Error,
        'Telegram account unlinking failed'
      );
      return {
        success: false,
        error: 'Произошла ошибка при отвязке аккаунта. Попробуйте позже.',
      };
    }
  }

  /**
   * Проверяет валидность email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Обрабатывает неудачную проверку сайта для Telegram уведомлений
   */
  async handleSiteFailure(projectId: string): Promise<void> {
    try {
      // Получаем информацию о проекте и пользователе
      const project = await this.prisma.project.findFirst({
        where: { id: projectId },
        include: { user: true },
      });

      if (!project || !project.user || !project.user.telegramId) {
        return; // Пользователь не привязал Telegram
      }

      // Получаем последнюю неудачную проверку
      const lastFailedCheck = await this.prisma.siteCheck.findFirst({
        where: { projectId, status: { not: 'SUCCESS' } },
        orderBy: { checkedAt: 'desc' },
      });

      if (!lastFailedCheck) {
        return;
      }

      // Отправляем уведомление в Telegram
      const notification: SiteDownTelegramNotification = {
        projectId: project.id,
        projectName: project.name,
        websiteUrl: project.websiteUrl,
        telegramId: project.user.telegramId,
        userName: project.user.fullName ?? 'User',
        errorMessage: lastFailedCheck.error ?? 'Unknown error',
        failedAt: lastFailedCheck.checkedAt,
      };

      await this.sendSiteDownNotification(notification);
      console.log(`📱 Telegram notification sent for project: ${project.name}`);
    } catch (error) {
      this.errorService.logError(
        error as Error,
        'Telegram site failure notification failed'
      );
    }
  }
}
