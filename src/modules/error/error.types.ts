// Типы для модуля Error

export interface ApiError {
  error: string;
  message: string;
  statusCode?: number;
  details?: unknown;
}

export interface ValidationError extends ApiError {
  error: 'VALIDATION_ERROR';
  field?: string;
}

export interface AuthError extends ApiError {
  error: 'AUTH_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN';
}

export interface NotFoundError extends ApiError {
  error: 'NOT_FOUND';
  resource?: string;
}

export interface InternalError extends ApiError {
  error: 'INTERNAL_ERROR';
}

export interface DatabaseError extends ApiError {
  error: 'DATABASE_ERROR';
  operation?: string;
}

// Примеры ошибок для автоматической генерации схем
export const validationErrorExample: ValidationError = {
  error: 'VALIDATION_ERROR',
  message: 'Data validation error',
  statusCode: 400,
  field: 'email',
};

export const authErrorExample: AuthError = {
  error: 'AUTH_ERROR',
  message: 'Authentication error',
  statusCode: 401,
};

export const notFoundErrorExample: NotFoundError = {
  error: 'NOT_FOUND',
  message: 'Resource not found',
  statusCode: 404,
  resource: 'user',
};

export const internalErrorExample: InternalError = {
  error: 'INTERNAL_ERROR',
  message: 'Internal server error',
  statusCode: 500,
};

export const databaseErrorExample: DatabaseError = {
  error: 'DATABASE_ERROR',
  message: 'Database error',
  statusCode: 500,
  operation: 'create',
};
