import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { type PrismaClient, type User } from '@prisma/client';
import { hashRefreshToken, generateTokens } from './token.utils';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
} from './auth.contract';
import { ErrorService } from '../error/error.service';
import { DatabaseService } from '../core/database/database.service';
import { ConfigService } from '../core/config.service';

export class AuthService {
  private prisma: PrismaClient;
  private errorService: ErrorService;
  private configService: ConfigService;

  constructor(errorService?: ErrorService) {
    this.prisma = DatabaseService.getInstance();
    this.errorService = errorService ?? new ErrorService();
    this.configService = ConfigService.getInstance();
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Проверяем, существует ли пользователь
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw this.errorService.createCustomError(
        'REGISTRATION_ERROR',
        'User with this email already exists',
        400
      );
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(
      data.password,
      this.configService.bcryptRounds
    );

    // Создаем пользователя
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        phone: data.phone,
      },
    });

    // Генерируем токены
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      this.configService
    );

    // Сохраняем refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: hashRefreshToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
      },
    });

    const { password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    // Ищем пользователя
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw this.errorService.createAuthError('Invalid email or password');
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw this.errorService.createAuthError('Invalid email or password');
    }

    // Проверяем, активен ли пользователь
    if (!user.isActive) {
      throw this.errorService.createAuthError(
        'Account is blocked',
        'FORBIDDEN'
      );
    }

    // Генерируем токены
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      this.configService
    );

    // Сохраняем refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: hashRefreshToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
      },
    });

    const { password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    // Проверяем refresh token
    const refreshTokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: hashRefreshToken(token) },
      include: { user: true },
    });

    if (!refreshTokenRecord) {
      throw this.errorService.createAuthError('Invalid refresh token');
    }

    if (refreshTokenRecord.expiresAt < new Date()) {
      // Удаляем истекший токен
      await this.prisma.refreshToken.delete({
        where: { id: refreshTokenRecord.id },
      });
      throw this.errorService.createAuthError('Refresh token expired');
    }

    // Генерируем новые токены
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      refreshTokenRecord.userId,
      this.configService
    );

    // Обновляем refresh token
    await this.prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: {
        token: hashRefreshToken(newRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
      },
    });

    const { password, ...userWithoutPassword } = refreshTokenRecord.user;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: hashRefreshToken(token) },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  // Token generation moved to token.utils.ts

  async validateToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, this.configService.jwtSecret) as {
        userId: string;
      };
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user?.isActive) {
        throw this.errorService.createAuthError('User not found or blocked');
      }

      return user;
    } catch {
      throw this.errorService.createAuthError('Invalid token');
    }
  }
}
