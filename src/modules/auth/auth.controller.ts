import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterRequest, LoginRequest } from './auth.types';
import { ErrorService } from '../error/error.service';

export class AuthController {
  private errorService: ErrorService;

  constructor(
    private authService: AuthService,
    errorService: ErrorService
  ) {
    this.errorService = errorService;
  }

  async register(req: Request, res: Response): Promise<void> {
    const { email, password, fullName, phone } = req.body as RegisterRequest;

    // Валидация
    if (!email || !password) {
      const error = this.errorService.createValidationError(
        'Email and password are required'
      );
      res.status(400).json(error);
      return;
    }

    if (password.length < 6) {
      const error = this.errorService.createValidationError(
        'Password must contain at least 6 characters'
      );
      res.status(400).json(error);
      return;
    }

    const result = await this.authService.register({
      email,
      password,
      fullName,
      phone,
    });

    res.status(201).json({
      message: 'User successfully registered',
      data: result,
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as LoginRequest;

    // Валидация
    if (!email || !password) {
      const error = this.errorService.createValidationError(
        'Email and password are required'
      );
      res.status(400).json(error);
      return;
    }

    const result = await this.authService.login({ email, password });

    res.status(200).json({
      message: 'Login successful',
      data: result,
    });
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as { refreshToken: string };

    if (!refreshToken) {
      const error = this.errorService.createValidationError(
        'Refresh token is required'
      );
      res.status(400).json(error);
      return;
    }

    const result = await this.authService.refreshToken(refreshToken);

    res.status(200).json({
      message: 'Token refreshed',
      data: result,
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as { refreshToken: string };

    if (!refreshToken) {
      const error = this.errorService.createValidationError(
        'Refresh token is required'
      );
      res.status(400).json(error);
      return;
    }

    await this.authService.logout(refreshToken);

    res.status(200).json({
      message: 'Logout successful',
    });
  }

  async logoutAll(req: Request, res: Response): Promise<void> {
    const user = req.user as { id: string }; // Пользователь уже проверен middleware

    await this.authService.logoutAll(user.id);

    res.status(200).json({
      message: 'Logout from all devices completed',
    });
  }

  getProfile(req: Request, res: Response): void {
    const user = req.user as { id: string }; // Пользователь уже проверен middleware

    res.status(200).json({
      message: 'User profile',
      data: user,
    });
  }
}
