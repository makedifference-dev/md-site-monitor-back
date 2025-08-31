import { z } from 'zod';
import {
  makeValidator,
  nonEmptyString,
} from '@/modules/core/validation/validate';
import type { User } from '@prisma/client';

// =============== Schemas ===============

export const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(6, { message: 'Password must contain at least 6 characters' }),
  fullName: z.string(),
  phone: z.string(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(6, { message: 'Password must contain at least 6 characters' }),
});

export const refreshSchema = z.object({
  refreshToken: nonEmptyString(),
});

// =============== Validators ===============

export const validateRegister = makeValidator(registerSchema, err => {
  const pwIssue = err.issues.find(i => i.path[0] === 'password');
  if (
    pwIssue &&
    pwIssue.message.includes('Password must contain at least 6 characters')
  ) {
    return 'Password must contain at least 6 characters';
  }
  const fields = err.issues.map(i => i.path[0]);
  if (fields.includes('email') || fields.includes('password')) {
    return 'Email and password are required';
  }
  return 'Invalid request data';
});

export const validateLogin = makeValidator(loginSchema, err => {
  const pwIssue = err.issues.find(i => i.path[0] === 'password');
  if (
    pwIssue &&
    pwIssue.message.includes('Password must contain at least 6 characters')
  ) {
    return 'Password must contain at least 6 characters';
  }
  return 'Email and password are required';
});

export const validateRefresh = makeValidator(
  refreshSchema,
  () => 'Refresh token is required'
);

// =============== Types (from schemas) ===============

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshSchema>;
export type LogoutRequest = RefreshTokenRequest;

// Express / Prisma-linked types
export type RequestUser = Omit<User, 'password'>;
export type UserResponse = Omit<User, 'password'>;

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

// =============== Examples for Swagger ===============

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
// =============== Express augmentation ===============
declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}
