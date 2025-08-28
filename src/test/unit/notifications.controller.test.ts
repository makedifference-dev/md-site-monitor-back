import { Request, Response } from 'express';
import { NotificationsController } from '../../modules/notifications/notifications.controller';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { ErrorService } from '../../modules/error/error.service';
import { AuthMiddleware } from '../../modules/auth/auth.middleware';

// Mock the services
jest.mock('../../modules/notifications/notifications.service');
jest.mock('../../modules/error/error.service');
jest.mock('../../modules/auth/auth.middleware');

describe('NotificationsController', () => {
  let notificationsController: NotificationsController;
  let mockNotificationsService: any;
  let mockErrorService: any;
  let mockAuthMiddleware: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock services
    mockNotificationsService = {
      sendEmail: jest.fn(),
    };

    mockErrorService = {
      handleUnknownError: jest.fn(),
    };

    mockAuthMiddleware = {
      authenticate: jest.fn(),
      requireRole: jest.fn(),
    };

    // Create controller with mocked services
    notificationsController = new NotificationsController(
      mockNotificationsService,
      mockErrorService,
      mockAuthMiddleware
    );

    // Create mock request and response
    mockRequest = {
      user: {
        id: '1',
        email: 'admin@example.com',
        fullName: 'Admin User',
        phone: '+1234567890',
        telegramId: null,
        telegramUsername: null,
        isActive: true,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      body: {
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test Message',
      },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('getRouter', () => {
    it('should return router instance', () => {
      const router = notificationsController.getRouter();
      expect(router).toBeDefined();
      expect(typeof router.use).toBe('function');
    });
  });

  describe('sendTestEmail', () => {
    it('should send test email successfully for admin user', async () => {
      mockNotificationsService.sendEmail.mockResolvedValue(true);

      // Access the private method directly for testing
      const sendTestEmailMethod = (
        notificationsController as any
      ).sendTestEmail.bind(notificationsController);
      await sendTestEmailMethod(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockNotificationsService.sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test Email</h1><p>Test Message</p>',
        text: 'Test Message',
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Test email sent successfully',
        data: { to: 'test@example.com', subject: 'Test Subject' },
      });
    });

    it('should return 403 for non-admin user', async () => {
      mockRequest.user = {
        id: '1',
        email: 'user@example.com',
        fullName: 'Regular User',
        phone: '+1234567890',
        telegramId: null,
        telegramUsername: null,
        isActive: true,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const sendTestEmailMethod = (
        notificationsController as any
      ).sendTestEmail.bind(notificationsController);
      await sendTestEmailMethod(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'FORBIDDEN',
        message: 'Access denied. Admin role required.',
        statusCode: 403,
      });
    });

    it('should return 400 for missing required fields', async () => {
      mockRequest.body = { to: 'test@example.com' }; // Missing subject and message

      const sendTestEmailMethod = (
        notificationsController as any
      ).sendTestEmail.bind(notificationsController);
      await sendTestEmailMethod(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'BAD_REQUEST',
        message: 'Email, subject and message are required',
        statusCode: 400,
      });
    });

    it('should return 500 when email sending fails', async () => {
      mockNotificationsService.sendEmail.mockResolvedValue(false);

      const sendTestEmailMethod = (
        notificationsController as any
      ).sendTestEmail.bind(notificationsController);
      await sendTestEmailMethod(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'INTERNAL_ERROR',
        message: 'Failed to send test email',
        statusCode: 500,
      });
    });
  });
});
