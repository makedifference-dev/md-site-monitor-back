// Типы для модуля уведомлений

export interface NotificationConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface NotificationRequest {
  type: 'email' | 'telegram';
  recipient: string;
  subject: string;
  message: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface NotificationResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SiteDownNotification {
  projectId: string;
  projectName: string;
  websiteUrl: string;
  userEmail: string;
  userName: string;
  errorMessage: string;
  failedAt: Date;
}

// Примеры для Swagger
export const emailNotificationExample: EmailNotification = {
  to: 'user@example.com',
  subject: 'Site Monitoring Alert',
  html: '<h1>Site Down Alert</h1><p>Your website is currently down.</p>',
  text: 'Site Down Alert: Your website is currently down.',
};

export const siteDownNotificationExample: SiteDownNotification = {
  projectId: 'clx1234567890',
  projectName: 'My Website',
  websiteUrl: 'https://example.com',
  userEmail: 'user@example.com',
  userName: 'John Doe',
  errorMessage: 'HTTP 500: Internal Server Error',
  failedAt: new Date(),
};
