export interface TelegramBotConfig {
  token: string;
  webhookUrl?: string;
}

export interface TelegramUser {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
}

export interface TelegramNotification {
  chatId: number;
  message: string;
  parseMode?: 'HTML' | 'Markdown';
  disableWebPagePreview?: boolean;
}

// Убираем дублирующий экспорт

export interface SiteDownTelegramNotification {
  projectId: string;
  projectName: string;
  websiteUrl: string;
  telegramId: string;
  userName: string;
  errorMessage: string;
  failedAt: Date;
}

export interface TelegramLinkRequest {
  telegramId: string;
  telegramUsername?: string;
  email: string;
}

// Примеры для Swagger
export const telegramUserExample: TelegramUser = {
  id: 123456789,
  username: 'testuser',
  first_name: 'John',
  last_name: 'Doe',
};

export const telegramNotificationExample: TelegramNotification = {
  chatId: 123456789,
  message: '🚨 Site Down Alert: Your website is currently down!',
  parseMode: 'HTML',
  disableWebPagePreview: true,
};

export const siteDownTelegramNotificationExample: SiteDownTelegramNotification =
  {
    projectId: 'clx1234567890',
    projectName: 'My Website',
    websiteUrl: 'https://example.com',
    telegramId: '123456789',
    userName: 'John Doe',
    errorMessage: 'HTTP 500: Internal Server Error',
    failedAt: new Date(),
  };
