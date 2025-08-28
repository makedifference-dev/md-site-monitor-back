import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Сжатие ответов
export const compressionMiddleware = compression({
  level: 6, // Уровень сжатия (0-9)
  threshold: 1024, // Минимальный размер для сжатия
  filter: (req: Request, res: Response) => {
    // Не сжимаем изображения и другие бинарные файлы
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
});

// Заголовки производительности
export const performanceHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Кэширование статических ресурсов
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 год

  // Безопасность
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Производительность
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');

  next();
};

// Логирование медленных запросов
export const slowQueryLogger = (threshold: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > threshold) {
        console.warn(
          `🐌 Slow request: ${req.method} ${req.path} - ${duration}ms`
        );
      }
    });

    next();
  };
};

// Rate limiting для API
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Пропускаем health check и документацию
    return req.path.startsWith('/health') || req.path.startsWith('/api-docs');
  },
});

// Rate limiting для авторизации (более строгий)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток входа
  message: {
    error: 'TOO_MANY_AUTH_ATTEMPTS',
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Пропускаем refresh token
    return req.path === '/auth/refresh';
  },
});

// Middleware для мониторинга производительности
export const performanceMonitor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;

    // Логируем только медленные запросы
    if (duration > 1000) {
      console.warn(
        `📊 Performance: ${req.method} ${req.path} - ${duration.toFixed(2)}ms - ${res.statusCode}`
      );
    }
  });

  next();
};
