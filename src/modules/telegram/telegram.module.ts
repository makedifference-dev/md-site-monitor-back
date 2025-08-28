import { TelegramService } from './telegram.service';
import { ErrorService } from '../error/error.service';

export class TelegramModule {
  private telegramService: TelegramService;
  private errorService: ErrorService;

  constructor(errorService?: ErrorService) {
    this.errorService = errorService ?? new ErrorService();
    this.telegramService = new TelegramService(this.errorService);
  }

  /**
   * Запускает Telegram бота
   */
  async start(): Promise<void> {
    await this.telegramService.start();
  }

  /**
   * Останавливает Telegram бота
   */
  stop(): void {
    this.telegramService.stop();
  }

  /**
   * Получает сервис Telegram бота
   */
  getService(): TelegramService {
    return this.telegramService;
  }
}
