import nodemailer from 'nodemailer';
import type { PrismaClient } from '@prisma/client';
import type { ErrorService } from '../error/error.service';
import type { TelegramService } from '../telegram/telegram.service';
import { DatabaseService } from '../core/database/database.service';
import { ConfigService } from '../core/config.service';
import type {
  EmailNotification,
  SiteDownNotification,
  NotificationConfig,
} from './notifications.contract';

export class NotificationsService {
  private prisma: PrismaClient;
  private errorService: ErrorService;
  private telegramService: TelegramService;
  private configService: ConfigService;
  private transporter: nodemailer.Transporter | null = null;

  constructor(errorService: ErrorService, telegramService: TelegramService) {
    this.prisma = DatabaseService.getInstance();
    this.errorService = errorService;
    this.telegramService = telegramService;
    this.configService = ConfigService.getInstance();
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    // В продакшене используйте реальные SMTP настройки
    // Для разработки можно использовать Ethereal Email или Mailtrap
    const config: NotificationConfig = {
      smtpHost: this.configService.smtpHost,
      smtpPort: this.configService.smtpPort,
      smtpUser: this.configService.smtpUser,
      smtpPass: this.configService.smtpPass,
      fromEmail: this.configService.fromEmail,
      fromName: this.configService.fromName,
    };

    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });
  }

  /**
   * Отправляет email уведомление
   */
  async sendEmail(notification: EmailNotification): Promise<boolean> {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: `"${this.configService.fromName}" <${this.configService.fromEmail}>`,
        to: notification.to,
        subject: notification.subject,
        html: notification.html,
        text: notification.text,
      };

      const info = (await this.transporter.sendMail(mailOptions)) as {
        messageId: string;
      };
      console.log('📧 Email sent:', info.messageId);
      return true;
    } catch (error) {
      this.errorService.logError(error as Error, 'Email sending failed');
      return false;
    }
  }

  /**
   * Отправляет уведомление о недоступности сайта
   */
  async sendSiteDownNotification(
    notification: SiteDownNotification
  ): Promise<boolean> {
    const subject = `🚨 Site Down Alert: ${notification.projectName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">🚨 Site Monitoring Alert</h2>
        <p>Hello ${notification.userName},</p>
        <p>We detected that your website is currently down:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${notification.projectName}</h3>
          <p><strong>URL:</strong> <a href="${notification.websiteUrl}">${notification.websiteUrl}</a></p>
          <p><strong>Error:</strong> ${notification.errorMessage}</p>
          <p><strong>Detected at:</strong> ${notification.failedAt.toLocaleString()}</p>
        </div>
        
        <p>Please check your website and resolve the issue as soon as possible.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 14px;">
            This is an automated message from MD Site Monitor.<br>
            You can manage your monitoring settings in your dashboard.
          </p>
        </div>
      </div>
    `;

    const text = `
Site Down Alert: ${notification.projectName}

Hello ${notification.userName},

We detected that your website is currently down:

Project: ${notification.projectName}
URL: ${notification.websiteUrl}
Error: ${notification.errorMessage}
Detected at: ${notification.failedAt.toLocaleString()}

Please check your website and resolve the issue as soon as possible.

This is an automated message from MD Site Monitor.
    `;

    return this.sendEmail({
      to: notification.userEmail,
      subject,
      html,
      text,
    });
  }

  /**
   * Проверяет, нужно ли отправить уведомление о первой неудачной проверке
   */
  async shouldSendFirstFailureNotification(
    projectId: string
  ): Promise<boolean> {
    try {
      // Получаем последние 2 проверки для проекта
      const recentChecks = await this.prisma.siteCheck.findMany({
        where: { projectId },
        orderBy: { checkedAt: 'desc' },
        take: 2,
      });

      // Если меньше 2 проверок, не отправляем уведомление
      if (recentChecks.length < 2) {
        return false;
      }

      const [latestCheck, previousCheck] = recentChecks;

      // Отправляем уведомление только если:
      // 1. Последняя проверка неудачная
      // 2. Предыдущая проверка была успешной
      return (
        latestCheck?.status !== 'SUCCESS' && previousCheck?.status === 'SUCCESS'
      );
    } catch (error) {
      this.errorService.logError(
        error as Error,
        'Error checking notification condition'
      );
      return false;
    }
  }

  /**
   * Обрабатывает неудачную проверку сайта
   */
  async handleSiteFailure(projectId: string): Promise<void> {
    try {
      // Проверяем, нужно ли отправить уведомление
      const shouldNotify =
        await this.shouldSendFirstFailureNotification(projectId);

      if (!shouldNotify) {
        return;
      }

      // Получаем информацию о проекте и пользователе
      const project = await this.prisma.project.findFirst({
        where: { id: projectId },
        include: { user: true },
      });

      if (!project?.user) {
        this.errorService.logError(
          new Error(`Project or user not found for notification: ${projectId}`),
          'Notification project not found'
        );
        return;
      }

      // Получаем последнюю неудачную проверку
      const lastFailedCheck = await this.prisma.siteCheck.findFirst({
        where: { projectId, status: { not: 'SUCCESS' } },
        orderBy: { checkedAt: 'desc' },
      });

      if (!lastFailedCheck) {
        return;
      }

      // Отправляем email уведомление
      const emailNotification: SiteDownNotification = {
        projectId: project.id,
        projectName: project.name,
        websiteUrl: project.websiteUrl,
        userEmail: project.user.email,
        userName: project.user.fullName ?? 'User',
        errorMessage: lastFailedCheck.error ?? 'Unknown error',
        failedAt: lastFailedCheck.checkedAt,
      };

      await this.sendSiteDownNotification(emailNotification);
      console.log(`📧 Email notification sent for project: ${project.name}`);

      // Отправляем Telegram уведомление (если пользователь привязал Telegram)
      if (project.user.telegramId) {
        await this.telegramService.handleSiteFailure(projectId);
        console.log(
          `📱 Telegram notification sent for project: ${project.name}`
        );
      }
    } catch (error) {
      this.errorService.logError(
        error as Error,
        'Site failure notification failed'
      );
    }
  }
}
