import {
  EmailNotification,
  NotificationRequest,
  NotificationResponse,
  SiteDownNotification,
} from '../../modules/notifications/notifications.types';

describe('Notifications Types', () => {
  describe('EmailNotification', () => {
    it('should have correct structure', () => {
      const notification: EmailNotification = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test message content</p>',
        text: 'Test message content',
      };

      expect(notification.to).toBe('test@example.com');
      expect(notification.subject).toBe('Test Subject');
      expect(notification.html).toBe('<p>Test message content</p>');
      expect(notification.text).toBe('Test message content');
    });
  });

  describe('NotificationRequest', () => {
    it('should have correct structure', () => {
      const request: NotificationRequest = {
        type: 'email',
        recipient: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message content',
        priority: 'normal',
      };

      expect(request.type).toBe('email');
      expect(request.recipient).toBe('test@example.com');
      expect(request.subject).toBe('Test Subject');
      expect(request.message).toBe('Test message content');
      expect(request.priority).toBe('normal');
    });
  });

  describe('NotificationResponse', () => {
    it('should have success response structure', () => {
      const successResponse: NotificationResponse = {
        success: true,
        messageId: 'msg-123',
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.messageId).toBe('msg-123');
    });

    it('should have error response structure', () => {
      const errorResponse: NotificationResponse = {
        success: false,
        error: 'Failed to send email',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Failed to send email');
    });
  });

  describe('SiteDownNotification', () => {
    it('should have correct structure', () => {
      const notification: SiteDownNotification = {
        projectId: 'project-123',
        projectName: 'Test Project',
        websiteUrl: 'https://example.com',
        userEmail: 'user@example.com',
        userName: 'Test User',
        errorMessage: 'Connection timeout',
        failedAt: new Date(),
      };

      expect(notification.projectId).toBe('project-123');
      expect(notification.projectName).toBe('Test Project');
      expect(notification.websiteUrl).toBe('https://example.com');
      expect(notification.userEmail).toBe('user@example.com');
      expect(notification.userName).toBe('Test User');
      expect(notification.errorMessage).toBe('Connection timeout');
      expect(notification.failedAt).toBeInstanceOf(Date);
    });
  });
});
