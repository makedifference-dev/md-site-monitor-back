import { Request, Response } from 'express';
import { AuthController } from '../../modules/auth/auth.controller';
import { AuthService } from '../../modules/auth/auth.service';
import { ErrorService } from '../../modules/error/error.service';
import { ValidationError, AuthError } from '../../modules/error/error.types';

// Mock the services
jest.mock('../../modules/auth/auth.service');
jest.mock('../../modules/error/error.service');

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: any;
  let mockErrorService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock services
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      logoutAll: jest.fn(),
    };

    mockErrorService = {
      createValidationError: jest.fn(),
      createAuthError: jest.fn(),
    };

    // Create controller with mocked services
    authController = new AuthController(mockAuthService, mockErrorService);

    // Create mock request and response
    mockRequest = {
      body: {},
      user: {
        id: '1',
        email: 'user@example.com',
        fullName: 'Test User',
        phone: '+1234567890',
        telegramId: null,
        telegramUsername: null,
        isActive: true,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        phone: '+1234567890',
      };
      const authResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          phone: '+1234567890',
          telegramId: null,
          telegramUsername: null,
          isActive: true,
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockRequest.body = registerData;
      mockAuthService.register.mockResolvedValue(authResponse);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User successfully registered',
        data: authResponse,
      });
    });

    it('should return validation error for missing email', async () => {
      const validationError: ValidationError = {
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required',
        statusCode: 400,
      };

      mockRequest.body = { password: 'password123' };
      mockErrorService.createValidationError.mockReturnValue(validationError);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.createValidationError).toHaveBeenCalledWith(
        'Email and password are required'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(validationError);
    });

    it('should return validation error for short password', async () => {
      const validationError: ValidationError = {
        error: 'VALIDATION_ERROR',
        message: 'Password must contain at least 6 characters',
        statusCode: 400,
      };

      mockRequest.body = { email: 'test@example.com', password: '123' };
      mockErrorService.createValidationError.mockReturnValue(validationError);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.createValidationError).toHaveBeenCalledWith(
        'Password must contain at least 6 characters'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(validationError);
    });

    it('should throw error from auth service', async () => {
      const authError = new Error('User already exists');
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };
      mockAuthService.register.mockRejectedValue(authError);

      await expect(
        authController.register(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('User already exists');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };
      const authResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          phone: '+1234567890',
          telegramId: null,
          telegramUsername: null,
          isActive: true,
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockRequest.body = loginData;
      mockAuthService.login.mockResolvedValue(authResponse);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Login successful',
        data: authResponse,
      });
    });

    it('should return validation error for missing credentials', async () => {
      const validationError: ValidationError = {
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required',
        statusCode: 400,
      };

      mockRequest.body = {};
      mockErrorService.createValidationError.mockReturnValue(validationError);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.createValidationError).toHaveBeenCalledWith(
        'Email and password are required'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(validationError);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshData = { refreshToken: 'refresh-token' };
      const authResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          phone: '+1234567890',
          telegramId: null,
          telegramUsername: null,
          isActive: true,
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockRequest.body = refreshData;
      mockAuthService.refreshToken.mockResolvedValue(authResponse);

      await authController.refreshToken(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        'refresh-token'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Token refreshed',
        data: authResponse,
      });
    });

    it('should return validation error for missing refresh token', async () => {
      const validationError: ValidationError = {
        error: 'VALIDATION_ERROR',
        message: 'Refresh token is required',
        statusCode: 400,
      };

      mockRequest.body = {};
      mockErrorService.createValidationError.mockReturnValue(validationError);

      await authController.refreshToken(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.createValidationError).toHaveBeenCalledWith(
        'Refresh token is required'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(validationError);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const logoutData = { refreshToken: 'refresh-token' };

      mockRequest.body = logoutData;
      mockAuthService.logout.mockResolvedValue(undefined);

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.logout).toHaveBeenCalledWith('refresh-token');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Logout successful',
      });
    });

    it('should return validation error for missing refresh token', async () => {
      const validationError: ValidationError = {
        error: 'VALIDATION_ERROR',
        message: 'Refresh token is required',
        statusCode: 400,
      };

      mockRequest.body = {};
      mockErrorService.createValidationError.mockReturnValue(validationError);

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.createValidationError).toHaveBeenCalledWith(
        'Refresh token is required'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(validationError);
    });
  });

  describe('logoutAll', () => {
    it('should logout from all devices successfully', async () => {
      mockAuthService.logoutAll.mockResolvedValue(undefined);

      await authController.logoutAll(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.logoutAll).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Logout from all devices completed',
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      await authController.getProfile(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User profile',
        data: mockRequest.user,
      });
    });
  });
});
