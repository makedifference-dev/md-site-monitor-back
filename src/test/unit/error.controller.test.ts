import { Request, Response, NextFunction } from 'express';
import { ErrorController } from '../../modules/error/error.controller';
import { ErrorService } from '../../modules/error/error.service';
import {
  ValidationError,
  AuthError,
  NotFoundError,
  InternalError,
} from '../../modules/error/error.types';

// Mock the ErrorService
jest.mock('../../modules/error/error.service');

describe('ErrorController', () => {
  let errorController: ErrorController;
  let mockErrorService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock service
    mockErrorService = {
      logError: jest.fn(),
      createValidationError: jest.fn(),
      createAuthError: jest.fn(),
      createNotFoundError: jest.fn(),
      handleUnknownError: jest.fn(),
    };

    // Create controller with mocked service
    errorController = new ErrorController(mockErrorService);

    // Create mock request, response, and next function
    mockRequest = {
      method: 'GET',
      path: '/test',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('handleError', () => {
    it('should handle API error correctly', () => {
      const apiError: ValidationError = {
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        statusCode: 400,
      };

      errorController.handleError(
        apiError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockErrorService.logError).toHaveBeenCalledWith(
        apiError,
        'GET /test'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(apiError);
    });

    it('should handle ValidationError correctly', () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      const apiError: ValidationError = {
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        statusCode: 400,
      };

      mockErrorService.createValidationError.mockReturnValue(apiError);

      errorController.handleError(
        validationError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockErrorService.createValidationError).toHaveBeenCalledWith(
        'Validation failed'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(apiError);
    });

    it('should handle UnauthorizedError correctly', () => {
      const authError = new Error('Unauthorized');
      authError.name = 'UnauthorizedError';
      const apiError: AuthError = {
        error: 'UNAUTHORIZED',
        message: 'Unauthorized',
        statusCode: 401,
      };

      mockErrorService.createAuthError.mockReturnValue(apiError);

      errorController.handleError(
        authError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockErrorService.createAuthError).toHaveBeenCalledWith(
        'Unauthorized',
        'UNAUTHORIZED'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(apiError);
    });

    it('should handle NotFoundError correctly', () => {
      const notFoundError = new Error('Not found');
      notFoundError.name = 'NotFoundError';
      const apiError: NotFoundError = {
        error: 'NOT_FOUND',
        message: 'Not found',
        statusCode: 404,
      };

      mockErrorService.createNotFoundError.mockReturnValue(apiError);

      errorController.handleError(
        notFoundError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockErrorService.createNotFoundError).toHaveBeenCalledWith(
        'Not found'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(apiError);
    });

    it('should handle unknown errors correctly', () => {
      const unknownError = new Error('Unknown error');
      const apiError: InternalError = {
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        statusCode: 500,
      };

      mockErrorService.handleUnknownError.mockReturnValue(apiError);

      errorController.handleError(
        unknownError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockErrorService.handleUnknownError).toHaveBeenCalledWith(
        unknownError
      );
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(apiError);
    });
  });

  describe('handleNotFound', () => {
    it('should handle 404 errors correctly', () => {
      const apiError: NotFoundError = {
        error: 'NOT_FOUND',
        message: 'Route GET /test not found',
        statusCode: 404,
      };

      mockErrorService.createNotFoundError.mockReturnValue(apiError);

      errorController.handleNotFound(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.createNotFoundError).toHaveBeenCalledWith(
        'Route GET /test not found'
      );
      expect(mockErrorService.logError).toHaveBeenCalledWith(
        apiError,
        'GET /test'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(apiError);
    });
  });

  describe('getErrorHandler', () => {
    it('should return bound error handler', () => {
      const errorHandler = errorController.getErrorHandler();
      expect(typeof errorHandler).toBe('function');
    });
  });

  describe('getNotFoundHandler', () => {
    it('should return bound not found handler', () => {
      const notFoundHandler = errorController.getNotFoundHandler();
      expect(typeof notFoundHandler).toBe('function');
    });
  });
});
