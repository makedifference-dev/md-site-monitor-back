import { ErrorService } from '@/modules/error/error.service';

describe('ErrorService', () => {
  let errorService: ErrorService;

  beforeEach(() => {
    errorService = new ErrorService();
    jest.clearAllMocks();
  });

  describe('createValidationError', () => {
    it('should create validation error with message', () => {
      const error = errorService.createValidationError('Invalid email format');

      expect(error).toEqual({
        error: 'VALIDATION_ERROR',
        message: 'Invalid email format',
        statusCode: 400,
        field: undefined,
      });
    });

    it('should create validation error with field', () => {
      const error = errorService.createValidationError(
        'Invalid email format',
        'email'
      );

      expect(error).toEqual({
        error: 'VALIDATION_ERROR',
        message: 'Invalid email format',
        statusCode: 400,
        field: 'email',
      });
    });

    it('should always return status code 400', () => {
      const error = errorService.createValidationError('Test error');

      expect(error.statusCode).toBe(400);
    });
  });

  describe('createAuthError', () => {
    it('should create auth error with default type', () => {
      const error = errorService.createAuthError('Invalid credentials');

      expect(error).toEqual({
        error: 'AUTH_ERROR',
        message: 'Invalid credentials',
        statusCode: 401,
      });
    });

    it('should create auth error with AUTH_ERROR type', () => {
      const error = errorService.createAuthError(
        'Invalid credentials',
        'AUTH_ERROR'
      );

      expect(error).toEqual({
        error: 'AUTH_ERROR',
        message: 'Invalid credentials',
        statusCode: 401,
      });
    });

    it('should create auth error with UNAUTHORIZED type', () => {
      const error = errorService.createAuthError(
        'Unauthorized access',
        'UNAUTHORIZED'
      );

      expect(error).toEqual({
        error: 'UNAUTHORIZED',
        message: 'Unauthorized access',
        statusCode: 401,
      });
    });

    it('should create auth error with FORBIDDEN type and status 403', () => {
      const error = errorService.createAuthError(
        'Access forbidden',
        'FORBIDDEN'
      );

      expect(error).toEqual({
        error: 'FORBIDDEN',
        message: 'Access forbidden',
        statusCode: 403,
      });
    });
  });

  describe('createNotFoundError', () => {
    it('should create not found error with message', () => {
      const error = errorService.createNotFoundError('User not found');

      expect(error).toEqual({
        error: 'NOT_FOUND',
        message: 'User not found',
        statusCode: 404,
        resource: undefined,
      });
    });

    it('should create not found error with resource', () => {
      const error = errorService.createNotFoundError('User not found', 'User');

      expect(error).toEqual({
        error: 'NOT_FOUND',
        message: 'User not found',
        statusCode: 404,
        resource: 'User',
      });
    });

    it('should always return status code 404', () => {
      const error = errorService.createNotFoundError('Test error');

      expect(error.statusCode).toBe(404);
    });
  });

  describe('createInternalError', () => {
    it('should create internal error with default message', () => {
      const error = errorService.createInternalError();

      expect(error).toEqual({
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        statusCode: 500,
      });
    });

    it('should create internal error with custom message', () => {
      const error = errorService.createInternalError(
        'Database connection failed'
      );

      expect(error).toEqual({
        error: 'INTERNAL_ERROR',
        message: 'Database connection failed',
        statusCode: 500,
      });
    });

    it('should always return status code 500', () => {
      const error = errorService.createInternalError('Test error');

      expect(error.statusCode).toBe(500);
    });
  });

  describe('createCustomError', () => {
    it('should create custom error with default status code', () => {
      const error = errorService.createCustomError(
        'CUSTOM_ERROR',
        'Custom error message'
      );

      expect(error).toEqual({
        error: 'CUSTOM_ERROR',
        message: 'Custom error message',
        statusCode: 500,
      });
    });

    it('should create custom error with custom status code', () => {
      const error = errorService.createCustomError(
        'CUSTOM_ERROR',
        'Custom error message',
        422
      );

      expect(error).toEqual({
        error: 'CUSTOM_ERROR',
        message: 'Custom error message',
        statusCode: 422,
      });
    });

    it('should handle various status codes', () => {
      const error1 = errorService.createCustomError('ERROR1', 'Message 1', 400);
      const error2 = errorService.createCustomError('ERROR2', 'Message 2', 401);
      const error3 = errorService.createCustomError('ERROR3', 'Message 3', 500);

      expect(error1.statusCode).toBe(400);
      expect(error2.statusCode).toBe(401);
      expect(error3.statusCode).toBe(500);
    });
  });

  describe('logError', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log Error instance', () => {
      const testError = new Error('Test error message');
      errorService.logError(testError, 'Test context');

      expect(consoleSpy).toHaveBeenCalledWith(
        '🚨 Error logged:',
        expect.stringContaining('Test error message')
      );

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1]);
      expect(loggedData.context).toBe('Test context');
      expect(loggedData.error.name).toBe('Error');
      expect(loggedData.error.message).toBe('Test error message');
      expect(loggedData.error.stack).toBeDefined();
    });

    it('should log ApiError instance', () => {
      const apiError = {
        error: 'CUSTOM_ERROR',
        message: 'API error message',
        statusCode: 400,
      };
      errorService.logError(apiError, 'API context');

      expect(consoleSpy).toHaveBeenCalledWith(
        '🚨 Error logged:',
        expect.stringContaining('API error message')
      );

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1]);
      expect(loggedData.context).toBe('API context');
      expect(loggedData.error).toEqual(apiError);
    });

    it('should log error without context', () => {
      const testError = new Error('Test error');
      errorService.logError(testError);

      expect(consoleSpy).toHaveBeenCalledWith(
        '🚨 Error logged:',
        expect.stringContaining('Test error')
      );

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1]);
      expect(loggedData.context).toBeUndefined();
    });

    it('should include timestamp in logged data', () => {
      const testError = new Error('Test error');
      const beforeLog = new Date();
      errorService.logError(testError);
      const afterLog = new Date();

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1]);
      const loggedTimestamp = new Date(loggedData.timestamp);

      expect(loggedTimestamp.getTime()).toBeGreaterThanOrEqual(
        beforeLog.getTime()
      );
      expect(loggedTimestamp.getTime()).toBeLessThanOrEqual(afterLog.getTime());
    });
  });

  describe('handleUnknownError', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should handle Error instance', () => {
      const testError = new Error('Test error message');
      const result = errorService.handleUnknownError(testError);

      expect(result).toEqual({
        error: 'INTERNAL_ERROR',
        message: 'Test error message',
        statusCode: 500,
      });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle string error', () => {
      const result = errorService.handleUnknownError('String error message');

      expect(result).toEqual({
        error: 'INTERNAL_ERROR',
        message: 'Unknown error',
        statusCode: 500,
      });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle number error', () => {
      const result = errorService.handleUnknownError(404);

      expect(result).toEqual({
        error: 'INTERNAL_ERROR',
        message: 'Unknown error',
        statusCode: 500,
      });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle null error', () => {
      const result = errorService.handleUnknownError(null);

      expect(result).toEqual({
        error: 'INTERNAL_ERROR',
        message: 'Unknown error',
        statusCode: 500,
      });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle undefined error', () => {
      const result = errorService.handleUnknownError(undefined);

      expect(result).toEqual({
        error: 'INTERNAL_ERROR',
        message: 'Unknown error',
        statusCode: 500,
      });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle object error', () => {
      const objError = { custom: 'error', code: 123 };
      const result = errorService.handleUnknownError(objError);

      expect(result).toEqual({
        error: 'INTERNAL_ERROR',
        message: 'Unknown error',
        statusCode: 500,
      });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle boolean error', () => {
      const result = errorService.handleUnknownError(false);

      expect(result).toEqual({
        error: 'INTERNAL_ERROR',
        message: 'Unknown error',
        statusCode: 500,
      });
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
