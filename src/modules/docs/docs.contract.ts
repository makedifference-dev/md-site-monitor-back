// Типы для модуля документации

import type { OpenAPIV3 } from 'openapi-types';

/**
 * Типы для Swagger утилит
 */
export interface SwaggerUtils {
  generateSchemaFromInterface: <_T>(
    example: _T,
    requiredFields?: string[]
  ) => OpenAPIV3.SchemaObject;
  createApiResponseSchema: <_T>(
    dataSchema: OpenAPIV3.SchemaObject,
    description?: string
  ) => OpenAPIV3.SchemaObject;
  createErrorSchema: (
    errorCode: string,
    description?: string
  ) => OpenAPIV3.SchemaObject;
  createPaginatedResponseSchema: <_T>(
    dataSchema: OpenAPIV3.SchemaObject,
    description?: string
  ) => OpenAPIV3.SchemaObject;
  generateEndpointDoc: (
    path: string,
    method: string,
    summary: string,
    description?: string
  ) => OpenAPIV3.OperationObject;
}

/**
 * Типы для генерации документации
 */
export interface DocumentationConfig {
  title: string;
  version: string;
  description: string;
  basePath: string;
  tags: OpenAPIV3.TagObject[];
}

/**
 * Типы для схем документации
 */
export interface SchemaDefinition {
  name: string;
  schema: OpenAPIV3.SchemaObject;
  example?: unknown;
}

/**
 * Типы для эндпоинтов документации
 */
export interface EndpointDefinition {
  path: string;
  method: string;
  summary: string;
  description?: string;
  tags?: string[];
  requestSchema?: OpenAPIV3.SchemaObject;
  responseSchema?: OpenAPIV3.SchemaObject;
  requiresAuth?: boolean;
}

// Примеры для Swagger
export const documentationConfigExample: DocumentationConfig = {
  title: 'MD Site Monitor API',
  version: '1.0.0',
  description: 'API для мониторинга сайтов',
  basePath: '/',
  tags: [
    {
      name: 'Auth',
      description: 'Аутентификация и авторизация',
    },
    {
      name: 'Projects',
      description: 'Управление проектами',
    },
    {
      name: 'Monitoring',
      description: 'Мониторинг сайтов',
    },
  ],
};

export const schemaDefinitionExample: SchemaDefinition = {
  name: 'UserResponse',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      fullName: { type: 'string' },
    },
    required: ['id', 'email'],
  },
  example: {
    id: 'clx1234567890',
    email: 'user@example.com',
    fullName: 'Иван Иванов',
  },
};

export const endpointDefinitionExample: EndpointDefinition = {
  path: '/auth/login',
  method: 'post',
  summary: 'User login',
  description: 'Аутентификация пользователя',
  tags: ['Auth'],
  requestSchema: {
    type: 'object',
    properties: {
      email: { type: 'string' },
      password: { type: 'string' },
    },
    required: ['email', 'password'],
  },
  responseSchema: {
    type: 'object',
    properties: {
      message: { type: 'string' },
      data: {
        type: 'object',
        properties: {
          user: { type: 'object' },
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
    },
  },
  requiresAuth: false,
};
