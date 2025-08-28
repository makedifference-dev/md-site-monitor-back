// Автоматически сгенерированная документация для авторизации
import {
  generateSchemaFromInterface,
  generateEndpointDoc,
} from '../docs/swagger.utils';
import {
  registerRequestExample,
  loginRequestExample,
  refreshTokenRequestExample,
  logoutRequestExample,
  authResponseExample,
  userResponseExample,
} from './auth.types';

// Схемы будут использоваться в authSchemas

// Генерируем документацию для каждого endpoint
export const authDocs = {
  '/auth/register': generateEndpointDoc(
    '/auth/register',
    'post',
    'Register new user',
    'Auth'
  ),

  '/auth/login': generateEndpointDoc(
    '/auth/login',
    'post',
    'User login',
    'Auth'
  ),

  '/auth/refresh': generateEndpointDoc(
    '/auth/refresh',
    'post',
    'Refresh access token',
    'Auth'
  ),

  '/auth/logout': generateEndpointDoc(
    '/auth/logout',
    'post',
    'User logout',
    'Auth'
  ),

  '/auth/profile': generateEndpointDoc(
    '/auth/profile',
    'get',
    'Get user profile',
    'Auth'
  ),

  '/auth/logout-all': generateEndpointDoc(
    '/auth/logout-all',
    'post',
    'Logout from all devices',
    'Auth'
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
