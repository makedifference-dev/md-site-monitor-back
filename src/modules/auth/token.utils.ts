import { createHash, createHmac } from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { ConfigService } from '@/modules/core/config.service';

// Hash refresh token with optional pepper. Uses SHA-256 HMAC if pepper provided
export function hashRefreshToken(token: string): string {
  const pepper = process.env.REFRESH_TOKEN_PEPPER ?? '';
  if (pepper) {
    return createHmac('sha256', pepper).update(token).digest('hex');
  }
  return createHash('sha256').update(token).digest('hex');
}

// Generate access and refresh tokens for a user
export function generateTokens(
  userId: string,
  config: ConfigService
): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as SignOptions);

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn } as SignOptions
  );

  return { accessToken, refreshToken };
}
