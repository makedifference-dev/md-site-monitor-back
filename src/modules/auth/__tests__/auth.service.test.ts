import { AuthService } from '@/modules/auth/auth.service';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock DatabaseService, bcrypt, jsonwebtoken
jest.mock('../../modules/core/database/database.service', () => ({
  DatabaseService: {
    getInstance: jest.fn(),
  },
}));

jest.mock('../../modules/error/error.service', () => ({
  ErrorService: jest.fn().mockImplementation(() => ({
    createCustomError: jest.fn().mockImplementation((code, message, status) => {
      const error = new Error(message);
      (error as any).code = code;
      (error as any).status = status;
      return error;
    }),
    createAuthError: jest.fn().mockImplementation(message => {
      const error = new Error(message);
      (error as any).code = 'AUTH_ERROR';
      return error;
    }),
    logError: jest.fn(),
  })),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const {
      DatabaseService,
    } = require('../../modules/core/database/database.service');
    DatabaseService.getInstance.mockReturnValue(mockPrisma);

    authService = new AuthService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        phone: '+1234567890',
      };

      const createdUser = {
        id: 'user-id',
        email: userData.email,
        password: 'hashed-password',
        fullName: userData.fullName,
        phone: userData.phone,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const hashedPassword = 'hashed-password';
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrisma.user.create.mockResolvedValue(createdUser);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken);
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await authService.register(userData);

      expect(result.user).toEqual({
        id: createdUser.id,
        email: createdUser.email,
        fullName: createdUser.fullName,
        phone: createdUser.phone,
        isActive: createdUser.isActive,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      });
      expect(result.accessToken).toBe(accessToken);
      expect(result.refreshToken).toBe(refreshToken);
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Test User',
        phone: '+1234567890',
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(authService.register(userData)).rejects.toThrow(
        'User with this email already exists'
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: 'user-id',
        email: loginData.email,
        password: 'hashed-password',
        fullName: 'Test User',
        phone: '+1234567890',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      mockPrisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken);
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await authService.login(loginData);

      expect(result.user).toEqual({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
      expect(result.accessToken).toBe(accessToken);
      expect(result.refreshToken).toBe(refreshToken);
    });

    it('should throw error if user not found', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error if password is incorrect', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const user = {
        id: 'user-id',
        email: loginData.email,
        password: 'hashed-password',
        fullName: 'Test User',
        phone: '+1234567890',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginData)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error if user is blocked', async () => {
      const loginData = { email: 'test@example.com', password: 'password123' };
      const user = {
        id: 'user-id',
        email: loginData.email,
        password: 'hashed-password',
        fullName: 'Test User',
        phone: '+1234567890',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(authService.login(loginData)).rejects.toThrow(
        'Account is blocked'
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const token = 'valid-refresh-token';
      const userId = 'user-id';

      const user = {
        id: userId,
        email: 'test@example.com',
        password: 'hashed-password',
        fullName: 'Test User',
        phone: '+1234567890',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const refreshTokenRecord = {
        id: 'token-id',
        token,
        userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Future date
        user,
      };

      const newAccessToken = 'new-access-token';
      const newRefreshToken = 'new-refresh-token';

      mockPrisma.refreshToken.findUnique.mockResolvedValue(refreshTokenRecord);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(newAccessToken)
        .mockReturnValueOnce(newRefreshToken);
      mockPrisma.refreshToken.update.mockResolvedValue({});

      const result = await authService.refreshToken(token);

      expect(result.user).toEqual({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
      expect(result.accessToken).toBe(newAccessToken);
      expect(result.refreshToken).toBe(newRefreshToken);
    });

    it('should throw error if refresh token is invalid', async () => {
      const token = 'invalid-refresh-token';

      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(authService.refreshToken(token)).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should throw error when refresh token is expired and delete it', async () => {
      const token = 'expired-token';
      const user = {
        id: 'user-id',
        email: 'e',
        password: 'p',
        fullName: 'f',
        phone: 'ph',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const record = {
        id: 'id',
        token,
        userId: 'user-id',
        expiresAt: new Date(Date.now() - 1000),
        user,
      };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(record);
      mockPrisma.refreshToken.delete.mockResolvedValue({});

      await expect(authService.refreshToken(token)).rejects.toThrow(
        'Refresh token expired'
      );
      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: record.id },
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const token = 'refresh-token';

      mockPrisma.refreshToken.deleteMany.mockResolvedValue({});

      // Expect hashed token was used in DB query
      const { hashRefreshToken } = require('@/modules/auth/token.utils');
      await expect(authService.logout(token)).resolves.toBeUndefined();
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: hashRefreshToken(token) },
      });
    });
  });

  describe('logoutAll', () => {
    it('should logout from all sessions', async () => {
      const userId = 'user-id';
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({});
      await expect(authService.logoutAll(userId)).resolves.toBeUndefined();
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      const token = 'valid-access-token';
      const userId = 'user-id';

      const user = {
        id: userId,
        email: 'test@example.com',
        password: 'hashed-password',
        fullName: 'Test User',
        phone: '+1234567890',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId });
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await authService.validateToken(token);

      expect(result).toEqual(user);
    });

    it('should throw error if token is invalid', async () => {
      const token = 'invalid-token';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.validateToken(token)).rejects.toThrow(
        'Invalid token'
      );
    });

    it('should throw error if user not found or blocked', async () => {
      const token = 'valid';
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'uid' });
      mockPrisma.user.findUnique.mockResolvedValue({ isActive: false });

      await expect(authService.validateToken(token)).rejects.toThrow(
        'Invalid token'
      );
    });
  });
});
