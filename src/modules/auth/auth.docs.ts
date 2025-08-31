// Автоматически сгенерированная документация для авторизации
import {
  buildEndpoint,
  ref,
  generateSchemaFromInterface,
} from '../docs/swagger.utils';
import {
  registerRequestExample,
  loginRequestExample,
  refreshTokenRequestExample,
  logoutRequestExample,
  authResponseExample,
  userResponseExample,
} from './auth.contract';

// Схемы будут использоваться в authSchemas

// Генерируем документацию для каждого endpoint
export const authDocs = {
  '/auth/register': buildEndpoint(
    '/auth/register',
    'post',
    'Register new user',
    {
      tag: 'Auth',
      requestBody: { schema: ref('RegisterRequest'), required: true },
      responses: { '200': { schema: ref('AuthResponse') } },
    }
  ),

  '/auth/login': buildEndpoint('/auth/login', 'post', 'User login', {
    tag: 'Auth',
    requestBody: { schema: ref('LoginRequest'), required: true },
    responses: { '200': { schema: ref('AuthResponse') } },
  }),

  '/auth/refresh': buildEndpoint(
    '/auth/refresh',
    'post',
    'Refresh access token',
    {
      tag: 'Auth',
      requestBody: { schema: ref('RefreshTokenRequest'), required: true },
      responses: { '200': { schema: ref('AuthResponse') } },
    }
  ),

  '/auth/logout': buildEndpoint('/auth/logout', 'post', 'User logout', {
    tag: 'Auth',
    security: [{ bearerAuth: [] }],
    responses: { '200': { schema: ref('ApiResponse') } },
  }),

  '/auth/profile': buildEndpoint('/auth/profile', 'get', 'Get user profile', {
    tag: 'Auth',
    security: [{ bearerAuth: [] }],
    responses: { '200': { schema: ref('UserResponse') } },
  }),

  '/auth/logout-all': buildEndpoint(
    '/auth/logout-all',
    'post',
    'Logout from all devices',
    {
      tag: 'Auth',
      security: [{ bearerAuth: [] }],
      responses: { '200': { schema: ref('ApiResponse') } },
    }
  ),
};

// Схемы для Swagger
export const authSchemas = {
  RegisterRequest: generateSchemaFromInterface(registerRequestExample),
  LoginRequest: generateSchemaFromInterface(loginRequestExample),
  RefreshTokenRequest: generateSchemaFromInterface(refreshTokenRequestExample),
  LogoutRequest: generateSchemaFromInterface(logoutRequestExample),
  AuthResponse: generateSchemaFromInterface(authResponseExample),
  UserResponse: generateSchemaFromInterface(userResponseExample),
  ApiResponse: generateSchemaFromInterface(authResponseExample),
};
