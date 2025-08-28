// Типы для авторизации с примерами данных
import type { User } from '@prisma/client';

// Express types
export type RequestUser = Omit<User, 'password'>;

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export type UserResponse = Omit<User, 'password'>;

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

// Reuse shared ApiResponse

// Примеры данных для автоматической генерации схем
export const registerRequestExample: RegisterRequest = {
  email: 'user@example.com',
  password: 'password123',
  fullName: 'Иван Иванов',
  phone: '+7 (999) 123-45-67',
};

export const loginRequestExample: LoginRequest = {
  email: 'user@example.com',
  password: 'password123',
};

export const refreshTokenRequestExample: RefreshTokenRequest = {
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};

export const logoutRequestExample: LogoutRequest = {
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};

export const userResponseExample: UserResponse = {
  id: 'clx1234567890',
  email: 'user@example.com',
  fullName: 'Иван Иванов',
  phone: '+7 (999) 123-45-67',
  telegramId: null,
  telegramUsername: null,
  isActive: true,
  role: 'USER' as User['role'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const authResponseExample: AuthResponse = {
  user: userResponseExample,
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};
