import type { Request, Response } from 'express';
import type { AuthService } from './auth.service';
import {
  type RegisterRequest,
  type LoginRequest,
  type RequestUser,
  validateLogin,
  validateRefresh,
  validateRegister,
} from './auth.contract';
import type { ErrorService } from '../error/error.service';

export class AuthController {
  private errorService: ErrorService;

  constructor(
    private authService: AuthService,
    errorService: ErrorService
  ) {
    this.errorService = errorService;
  }

  async register(req: Request, res: Response): Promise<void> {
    const parsed = validateRegister(req.body);
    if (!parsed.ok) {
      const error = this.errorService.createValidationError(parsed.message);
      res.status(400).json(error);
      return;
    }
    const { email, password, fullName, phone } = parsed.data as RegisterRequest;

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
    const parsed = validateLogin(req.body);
    if (!parsed.ok) {
      const error = this.errorService.createValidationError(parsed.message);
      res.status(400).json(error);
      return;
    }
    const { email, password } = parsed.data as LoginRequest;

    const result = await this.authService.login({ email, password });

    res.status(200).json({
      message: 'Login successful',
      data: result,
    });
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const parsed = validateRefresh(req.body);
    if (!parsed.ok) {
      const error = this.errorService.createValidationError(parsed.message);
      res.status(400).json(error);
      return;
    }
    const { refreshToken } = parsed.data as { refreshToken: string };

    const result = await this.authService.refreshToken(refreshToken);

    res.status(200).json({
      message: 'Token refreshed',
      data: result,
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const parsed = validateRefresh(req.body);
    if (!parsed.ok) {
      const error = this.errorService.createValidationError(parsed.message);
      res.status(400).json(error);
      return;
    }
    const { refreshToken } = parsed.data as { refreshToken: string };

    await this.authService.logout(refreshToken);

    res.status(200).json({
      message: 'Logout successful',
    });
  }

  async logoutAll(req: Request, res: Response): Promise<void> {
    const user = req.user as RequestUser; // Пользователь уже проверен middleware

    await this.authService.logoutAll(user.id);

    res.status(200).json({
      message: 'Logout from all devices completed',
    });
  }

  getProfile(req: Request, res: Response): void {
    const user = req.user as RequestUser; // Пользователь уже проверен middleware

    res.status(200).json({
      message: 'User profile',
      data: user,
    });
  }
}
