import { NotificationsService } from '@/modules/notifications/notifications.service';
import { TelegramService } from '@/modules/telegram/telegram.service';
import { ErrorService } from '@/modules/error/error.service';
import { PrismaClient } from '@prisma/client';

// Mock DatabaseService, TelegramService, nodemailer
jest.mock('@/modules/core/database/database.service', () => ({
  DatabaseService: {
    getInstance: jest.fn(),
  },
}));

jest.mock('@/modules/telegram/telegram.service');

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}));

describe('NotificationsService', () => {
  let notificationsService: NotificationsService;
  let mockPrisma: any;
  let mockTelegramService: any;
  let mockErrorService: any;

  beforeEach(() => {
    mockPrisma = {
      siteCheck: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      project: {
        findFirst: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    mockTelegramService = {
      handleSiteFailure: jest.fn(),
    };

    mockErrorService = {
      logError: jest.fn(),
    };

    const {
      DatabaseService,
    } = require('@/modules/core/database/database.service');
    DatabaseService.getInstance.mockReturnValue(mockPrisma);

    notificationsService = new NotificationsService(
      mockErrorService,
      mockTelegramService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const notification = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      };

      // Мокаем transporter
      (notificationsService as any).transporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
      };

      const result = await notificationsService.sendEmail(notification);

      expect(result).toBe(true);
      expect(
        (notificationsService as any).transporter.sendMail
      ).toHaveBeenCalledWith({
        from: expect.stringContaining('Test Monitor'),
        to: notification.to,
        subject: notification.subject,
        html: notification.html,
        text: notification.text,
      });
    });

    it('should handle email sending error', async () => {
      const notification = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      };

      // Мокаем transporter с ошибкой
      (notificationsService as any).transporter = {
        sendMail: jest.fn().mockRejectedValue(new Error('SMTP error')),
      };

      const result = await notificationsService.sendEmail(notification);

      expect(result).toBe(false);
      expect(mockErrorService.logError).toHaveBeenCalled();
    });

    it('should handle missing transporter gracefully', async () => {
      const notification = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      };

      // Explicitly set transporter to null to trigger the guard
      (notificationsService as any).transporter = null;

      const result = await notificationsService.sendEmail(notification);

      expect(result).toBe(false);
      expect(mockErrorService.logError).toHaveBeenCalledWith(
        expect.any(Error),
        'Email sending failed'
      );
    });
  });

  describe('sendSiteDownNotification', () => {
    it('should send site down notification successfully', async () => {
      const notification = {
        projectId: 'project-id',
        projectName: 'Test Project',
        websiteUrl: 'https://example.com',
        userEmail: 'user@example.com',
        userName: 'Test User',
        errorMessage: 'Connection timeout',
        failedAt: new Date(),
      };

      // Мокаем sendEmail
      jest.spyOn(notificationsService, 'sendEmail').mockResolvedValue(true);

      const result =
        await notificationsService.sendSiteDownNotification(notification);

      expect(result).toBe(true);
      expect(notificationsService.sendEmail).toHaveBeenCalledWith({
        to: notification.userEmail,
        subject: expect.stringContaining('Site Down Alert'),
        html: expect.stringContaining(notification.projectName),
        text: expect.stringContaining(notification.projectName),
      });
    });
  });

  describe('shouldSendFirstFailureNotification', () => {
    it('should return true for first consecutive failure', async () => {
      const projectId = 'project-id';
      const checks = [
        { status: 'ERROR', checkedAt: new Date() },
        { status: 'SUCCESS', checkedAt: new Date() },
      ];

      mockPrisma.siteCheck.findMany.mockResolvedValue(checks);

      const result =
        await notificationsService.shouldSendFirstFailureNotification(
          projectId
        );

      expect(result).toBe(true);
    });

    it('should return false for non-consecutive failure', async () => {
      const projectId = 'project-id';
      const checks = [
        { status: 'ERROR', checkedAt: new Date() },
        { status: 'ERROR', checkedAt: new Date() },
      ];

      mockPrisma.siteCheck.findMany.mockResolvedValue(checks);

      const result =
        await notificationsService.shouldSendFirstFailureNotification(
          projectId
        );

      expect(result).toBe(false);
    });

    it('should return false for insufficient checks', async () => {
      const projectId = 'project-id';
      const checks = [{ status: 'ERROR', checkedAt: new Date() }];

      mockPrisma.siteCheck.findMany.mockResolvedValue(checks);

      const result =
        await notificationsService.shouldSendFirstFailureNotification(
          projectId
        );

      expect(result).toBe(false);
    });

    it('should log and return false when check retrieval fails', async () => {
      const projectId = 'project-id';
      mockPrisma.siteCheck.findMany.mockRejectedValue(new Error('DB error'));

      const result =
        await notificationsService.shouldSendFirstFailureNotification(
          projectId
        );

      expect(result).toBe(false);
      expect(mockErrorService.logError).toHaveBeenCalledWith(
        expect.any(Error),
        'Error checking notification condition'
      );
    });
  });

  describe('handleSiteFailure', () => {
    it('should handle site failure and send notifications', async () => {
      const projectId = 'project-id';
      const project = {
        id: projectId,
        name: 'Test Project',
        websiteUrl: 'https://example.com',
        user: {
          id: 'user-id',
          email: 'user@example.com',
          fullName: 'Test User',
          telegramId: 'telegram-id',
        },
      };

      const checks = [
        { status: 'ERROR', checkedAt: new Date() },
        { status: 'SUCCESS', checkedAt: new Date() },
      ];

      const failedCheck = {
        id: 'check-id',
        status: 'ERROR',
        error: 'Connection timeout',
        checkedAt: new Date(),
      };

      mockPrisma.siteCheck.findMany.mockResolvedValue(checks);
      mockPrisma.project.findFirst.mockResolvedValue(project);
      mockPrisma.siteCheck.findFirst.mockResolvedValue(failedCheck);

      // Мокаем sendSiteDownNotification
      jest
        .spyOn(notificationsService, 'sendSiteDownNotification')
        .mockResolvedValue(true);

      await notificationsService.handleSiteFailure(projectId);

      expect(
        notificationsService.sendSiteDownNotification
      ).toHaveBeenCalledWith({
        projectId: project.id,
        projectName: project.name,
        websiteUrl: project.websiteUrl,
        userEmail: project.user.email,
        userName: project.user.fullName,
        errorMessage: failedCheck.error,
        failedAt: failedCheck.checkedAt,
      });

      expect(mockTelegramService.handleSiteFailure).toHaveBeenCalledWith(
        projectId
      );
    });

    it('should not send notifications for non-consecutive failure', async () => {
      const projectId = 'project-id';
      const checks = [
        { status: 'ERROR', checkedAt: new Date() },
        { status: 'ERROR', checkedAt: new Date() },
      ];

      mockPrisma.siteCheck.findMany.mockResolvedValue(checks);

      // Мокаем sendSiteDownNotification
      jest
        .spyOn(notificationsService, 'sendSiteDownNotification')
        .mockResolvedValue(true);

      await notificationsService.handleSiteFailure(projectId);

      expect(
        notificationsService.sendSiteDownNotification
      ).not.toHaveBeenCalled();
      expect(mockTelegramService.handleSiteFailure).not.toHaveBeenCalled();
    });

    it('should handle project not found error', async () => {
      const projectId = 'nonexistent-project';
      const checks = [
        { status: 'ERROR', checkedAt: new Date() },
        { status: 'SUCCESS', checkedAt: new Date() },
      ];

      mockPrisma.siteCheck.findMany.mockResolvedValue(checks);
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await notificationsService.handleSiteFailure(projectId);

      expect(mockErrorService.logError).toHaveBeenCalled();
    });

    it('should default userName and errorMessage when missing', async () => {
      const projectId = 'project-id';
      const checks = [
        { status: 'ERROR', checkedAt: new Date() },
        { status: 'SUCCESS', checkedAt: new Date() },
      ];

      const failedCheck = {
        id: 'check-id',
        status: 'ERROR',
        error: null,
        checkedAt: new Date(),
      } as any;

      const project = {
        id: projectId,
        name: 'Test Project',
        websiteUrl: 'https://example.com',
        user: {
          id: 'user-id',
          email: 'user@example.com',
          fullName: null,
        },
      } as any;

      mockPrisma.siteCheck.findMany.mockResolvedValue(checks);
      mockPrisma.project.findFirst.mockResolvedValue(project);
      mockPrisma.siteCheck.findFirst.mockResolvedValue(failedCheck);

      const spy = jest
        .spyOn(notificationsService, 'sendSiteDownNotification')
        .mockResolvedValue(true);

      await notificationsService.handleSiteFailure(projectId);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          userName: 'User',
          errorMessage: 'Unknown error',
        })
      );
    });

    it('should return early when no failed check found', async () => {
      const projectId = 'project-id';
      const checks = [
        { status: 'ERROR', checkedAt: new Date() },
        { status: 'SUCCESS', checkedAt: new Date() },
      ];

      const project = {
        id: projectId,
        name: 'Test Project',
        websiteUrl: 'https://example.com',
        user: { id: 'u', email: 'u@example.com', fullName: 'U' },
      };

      mockPrisma.siteCheck.findMany.mockResolvedValue(checks);
      mockPrisma.project.findFirst.mockResolvedValue(project);
      mockPrisma.siteCheck.findFirst.mockResolvedValue(null);

      jest
        .spyOn(notificationsService, 'sendSiteDownNotification')
        .mockResolvedValue(true);

      await notificationsService.handleSiteFailure(projectId);

      expect(
        notificationsService.sendSiteDownNotification
      ).not.toHaveBeenCalled();
      expect(mockTelegramService.handleSiteFailure).not.toHaveBeenCalled();
    });

    it('should log error when unexpected failure occurs', async () => {
      const projectId = 'project-id';

      // Force an error within the try block
      mockPrisma.siteCheck.findMany.mockResolvedValue([
        { status: 'ERROR', checkedAt: new Date() },
        { status: 'SUCCESS', checkedAt: new Date() },
      ]);
      mockPrisma.project.findFirst.mockRejectedValue(new Error('DB boom'));

      await notificationsService.handleSiteFailure(projectId);

      expect(mockErrorService.logError).toHaveBeenCalledWith(
        expect.any(Error),
        'Site failure notification failed'
      );
    });
  });
});
