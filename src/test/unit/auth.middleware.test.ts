/* eslint-disable no-console, no-undef */
import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from '../../modules/auth/auth.middleware';
import { AuthService } from '../../modules/auth/auth.service';
import { ErrorService } from '../../modules/error/error.service';

// Мокаем AuthService
jest.mock('../../modules/auth/auth.service');
jest.mock('../../modules/error/error.service');

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockErrorService: jest.Mocked<ErrorService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Создаем моки
    mockAuthService = {
      validateToken: jest.fn(),
    } as any;

    mockErrorService = {
      createAuthError: jest.fn(),
    } as any;

    // Мокаем конструкторы
    (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
      () => mockAuthService
    );
    (ErrorService as jest.MockedClass<typeof ErrorService>).mockImplementation(
      () => mockErrorService
    );

    authMiddleware = new AuthMiddleware(mockErrorService);

    // Мокаем Express объекты
    mockRequest = {
      headers: {},
      user: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    it('should authenticate user with valid token', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'USER' as const,
        isActive: true,
        fullName: 'Test User',
        phone: '+1234567890',
        telegramId: null,
        telegramUsername: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockAuthService.validateToken.mockResolvedValue(mockUser);
      mockErrorService.createAuthError.mockReturnValue({
        error: 'UNAUTHORIZED' as const,
        message: 'Test error',
        statusCode: 401,
      });

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.validateToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        isActive: mockUser.isActive,
        fullName: mockUser.fullName,
        phone: mockUser.phone,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when no authorization header', async () => {
      const authError = {
        error: 'UNAUTHORIZED' as const,
        message: 'Authorization token not provided',
        statusCode: 401,
      };

      mockErrorService.createAuthError.mockReturnValue(authError);

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockErrorService.createAuthError).toHaveBeenCalledWith(
        'Authorization token not provided',
        'UNAUTHORIZED'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(authError);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', async () => {
      mockRequest.headers = {
        authorization: 'Invalid token',
      };

      const authError = {
        error: 'UNAUTHORIZED' as const,
        message: 'Authorization token not provided',
        statusCode: 401,
      };

      mockErrorService.createAuthError.mockReturnValue(authError);

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockErrorService.createAuthError).toHaveBeenCalledWith(
        'Authorization token not provided',
        'UNAUTHORIZED'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(authError);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token validation fails', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockAuthService.validateToken.mockRejectedValue(
        new Error('Invalid token')
      );

      const authError = {
        error: 'UNAUTHORIZED' as const,
        message: 'Invalid authorization token',
        statusCode: 401,
      };

      mockErrorService.createAuthError.mockReturnValue(authError);

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.validateToken).toHaveBeenCalledWith(
        'invalid-token'
      );
      expect(mockErrorService.createAuthError).toHaveBeenCalledWith(
        'Invalid authorization token',
        'UNAUTHORIZED'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(authError);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access when user has required role', () => {
      const requireAdmin = authMiddleware.requireRole(['ADMIN']);

      mockRequest.user = {
        id: 'admin123',
        email: 'admin@example.com',
        role: 'ADMIN' as const,
        isActive: true,
        fullName: 'Admin User',
        phone: '+1234567890',
        telegramId: null,
        telegramUsername: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow access when user has one of required roles', () => {
      const requireAdminOrUser = authMiddleware.requireRole(['ADMIN', 'USER']);

      mockRequest.user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'USER' as const,
        isActive: true,
        fullName: 'Regular User',
        phone: '+1234567890',
        telegramId: null,
        telegramUsername: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      requireAdminOrUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      const requireAdmin = authMiddleware.requireRole(['ADMIN']);

      const authError = {
        error: 'UNAUTHORIZED' as const,
        message: 'User not authorized',
        statusCode: 401,
      };

      mockErrorService.createAuthError.mockReturnValue(authError);

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockErrorService.createAuthError).toHaveBeenCalledWith(
        'User not authorized',
        'UNAUTHORIZED'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(authError);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user does not have required role', () => {
      const requireAdmin = authMiddleware.requireRole(['ADMIN']);

      mockRequest.user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'USER' as const,
        isActive: true,
        fullName: 'Regular User',
        phone: '+1234567890',
        telegramId: null,
        telegramUsername: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const forbiddenError = {
        error: 'FORBIDDEN' as const,
        message: 'Insufficient permissions to perform operation',
        statusCode: 403,
      };

      mockErrorService.createAuthError.mockReturnValue(forbiddenError);

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockErrorService.createAuthError).toHaveBeenCalledWith(
        'Insufficient permissions to perform operation',
        'FORBIDDEN'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(forbiddenError);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user has no role', () => {
      const requireAdmin = authMiddleware.requireRole(['ADMIN']);

      mockRequest.user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'USER' as const, // Используем USER вместо undefined
        isActive: true,
        fullName: 'Regular User',
        phone: '+1234567890',
        telegramId: null,
        telegramUsername: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const forbiddenError = {
        error: 'FORBIDDEN' as const,
        message: 'Insufficient permissions to perform operation',
        statusCode: 403,
      };

      mockErrorService.createAuthError.mockReturnValue(forbiddenError);

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockErrorService.createAuthError).toHaveBeenCalledWith(
        'Insufficient permissions to perform operation',
        'FORBIDDEN'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(forbiddenError);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
