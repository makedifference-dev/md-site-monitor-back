import type {
  ApiError,
  ValidationError,
  AuthError,
  NotFoundError,
  InternalError,
} from './error.contract';

export class ErrorService {
  createValidationError(message: string, field?: string): ValidationError {
    return {
      error: 'VALIDATION_ERROR',
      message,
      statusCode: 400,
      field,
    };
  }

  createAuthError(
    message: string,
    type: 'AUTH_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' = 'AUTH_ERROR'
  ): AuthError {
    return {
      error: type,
      message,
      statusCode: type === 'FORBIDDEN' ? 403 : 401,
    };
  }

  createNotFoundError(message: string, resource?: string): NotFoundError {
    return {
      error: 'NOT_FOUND',
      message,
      statusCode: 404,
      resource,
    };
  }

  createInternalError(
    message: string = 'Internal server error'
  ): InternalError {
    return {
      error: 'INTERNAL_ERROR',
      message,
      statusCode: 500,
    };
  }

  createCustomError(
    error: string,
    message: string,
    statusCode: number = 500
  ): ApiError {
    return {
      error,
      message,
      statusCode,
    };
  }

  // Метод для логирования ошибок
  logError(error: Error | ApiError, context?: string): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      context,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    };

    console.error('🚨 Error logged:', JSON.stringify(errorInfo, null, 2));
  }

  // Метод для обработки неизвестных ошибок
  handleUnknownError(error: unknown): InternalError {
    this.logError(error instanceof Error ? error : new Error(String(error)));

    return this.createInternalError(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
