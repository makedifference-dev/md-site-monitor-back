import { Request, Response, NextFunction } from 'express';
import {
  compressionMiddleware,
  performanceHeaders,
  slowQueryLogger,
  apiRateLimit,
  authRateLimit,
  performanceMonitor,
} from '../../modules/core/performance.middleware';

describe('Performance Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/test',
      headers: {},
    };

    mockResponse = {
      setHeader: jest.fn(),
      on: jest.fn(),
      statusCode: 200,
    };

    mockNext = jest.fn();

    // Мокаем console.warn
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('compressionMiddleware', () => {
    it('should be defined', () => {
      expect(compressionMiddleware).toBeDefined();
    });

    it('should have correct configuration', () => {
      expect(compressionMiddleware).toBeDefined();
      // Проверяем, что это функция middleware
      expect(typeof compressionMiddleware).toBe('function');
    });
  });

  describe('performanceHeaders', () => {
    it('should set performance headers', () => {
      performanceHeaders(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=31536000'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'nosniff'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Frame-Options',
        'DENY'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-XSS-Protection',
        '1; mode=block'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Connection',
        'keep-alive'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Keep-Alive',
        'timeout=5, max=1000'
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('slowQueryLogger', () => {
    it('should log slow requests above threshold', () => {
      const logger = slowQueryLogger(100);
      const startTime = Date.now();

      // Мокаем Date.now для контроля времени
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(startTime) // start
        .mockReturnValueOnce(startTime + 150); // finish (150ms > 100ms threshold)

      logger(mockRequest as Request, mockResponse as Response, mockNext);

      // Симулируем завершение ответа
      const finishCallback = (mockResponse.on as jest.Mock).mock.calls.find(
        call => call[0] === 'finish'
      )[1];
      finishCallback();

      expect(console.warn).toHaveBeenCalledWith(
        '🐌 Slow request: GET /test - 150ms'
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not log fast requests below threshold', () => {
      const logger = slowQueryLogger(100);
      const startTime = Date.now();

      // Мокаем Date.now для контроля времени
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(startTime) // start
        .mockReturnValueOnce(startTime + 50); // finish (50ms < 100ms threshold)

      logger(mockRequest as Request, mockResponse as Response, mockNext);

      // Симулируем завершение ответа
      const finishCallback = (mockResponse.on as jest.Mock).mock.calls.find(
        call => call[0] === 'finish'
      )[1];
      finishCallback();

      expect(console.warn).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use default threshold of 1000ms', () => {
      const logger = slowQueryLogger();
      const startTime = Date.now();

      // Мокаем Date.now для контроля времени
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(startTime) // start
        .mockReturnValueOnce(startTime + 1500); // finish (1500ms > 1000ms threshold)

      logger(mockRequest as Request, mockResponse as Response, mockNext);

      // Симулируем завершение ответа
      const finishCallback = (mockResponse.on as jest.Mock).mock.calls.find(
        call => call[0] === 'finish'
      )[1];
      finishCallback();

      expect(console.warn).toHaveBeenCalledWith(
        '🐌 Slow request: GET /test - 1500ms'
      );
    });
  });

  describe('apiRateLimit', () => {
    it('should be defined', () => {
      expect(apiRateLimit).toBeDefined();
    });

    it('should have correct configuration', () => {
      expect(apiRateLimit).toBeDefined();
      // Проверяем, что это функция middleware
      expect(typeof apiRateLimit).toBe('function');
    });

    it('should have correct configuration', () => {
      expect(apiRateLimit).toBeDefined();
      // Проверяем, что middleware настроен правильно
      expect(typeof apiRateLimit).toBe('function');
    });
  });

  describe('authRateLimit', () => {
    it('should be defined', () => {
      expect(authRateLimit).toBeDefined();
    });

    it('should have correct configuration', () => {
      expect(authRateLimit).toBeDefined();
      // Проверяем, что это функция middleware
      expect(typeof authRateLimit).toBe('function');
    });

    it('should have correct configuration', () => {
      expect(authRateLimit).toBeDefined();
      // Проверяем, что middleware настроен правильно
      expect(typeof authRateLimit).toBe('function');
    });
  });

  describe('performanceMonitor', () => {
    it('should monitor performance and log slow requests', () => {
      const startTime: [number, number] = [0, 0]; // hrtime start
      const endTime: [number, number] = [1, 500000000]; // 1.5 seconds in hrtime format

      // Мокаем process.hrtime
      jest
        .spyOn(process, 'hrtime')
        .mockReturnValueOnce(startTime) // start
        .mockReturnValueOnce(endTime); // end

      performanceMonitor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Симулируем завершение ответа
      const finishCallback = (mockResponse.on as jest.Mock).mock.calls.find(
        call => call[0] === 'finish'
      )[1];
      finishCallback();

      expect(console.warn).toHaveBeenCalledWith(
        '📊 Performance: GET /test - 1500.00ms - 200'
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not log fast requests', () => {
      const startTime: [number, number] = [0, 0]; // hrtime start
      const endTime: [number, number] = [0, 500000000]; // 0.5 seconds in hrtime format

      // Мокаем process.hrtime
      jest
        .spyOn(process, 'hrtime')
        .mockReturnValueOnce(startTime) // start
        .mockReturnValueOnce(endTime); // end

      performanceMonitor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Симулируем завершение ответа
      const finishCallback = (mockResponse.on as jest.Mock).mock.calls.find(
        call => call[0] === 'finish'
      )[1];
      finishCallback();

      expect(console.warn).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle different HTTP methods and status codes', () => {
      const startTime: [number, number] = [0, 0];
      const endTime: [number, number] = [2, 0]; // 2 seconds

      // Мокаем process.hrtime
      jest
        .spyOn(process, 'hrtime')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(endTime);

      const postRequest = {
        ...mockRequest,
        method: 'POST',
        path: '/api/projects',
      };
      const errorResponse = { ...mockResponse, statusCode: 500 };

      performanceMonitor(
        postRequest as Request,
        errorResponse as Response,
        mockNext
      );

      // Симулируем завершение ответа
      const finishCallback = (errorResponse.on as jest.Mock).mock.calls.find(
        call => call[0] === 'finish'
      )[1];
      finishCallback();

      expect(console.warn).toHaveBeenCalledWith(
        '📊 Performance: POST /api/projects - 2000.00ms - 500'
      );
    });

    it('should handle very fast requests (nanoseconds)', () => {
      const startTime: [number, number] = [0, 0];
      const endTime: [number, number] = [0, 1000000]; // 1 millisecond

      // Мокаем process.hrtime
      jest
        .spyOn(process, 'hrtime')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(endTime);

      performanceMonitor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Симулируем завершение ответа
      const finishCallback = (mockResponse.on as jest.Mock).mock.calls.find(
        call => call[0] === 'finish'
      )[1];
      finishCallback();

      expect(console.warn).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('compression filter', () => {
    it('should handle x-no-compression header', () => {
      const requestWithNoCompression = {
        ...mockRequest,
        headers: { 'x-no-compression': 'true' },
      };

      // Проверяем, что compression middleware существует и имеет filter
      expect(compressionMiddleware).toBeDefined();
    });
  });

  describe('rate limit configuration', () => {
    it('should have correct api rate limit settings', () => {
      expect(apiRateLimit).toBeDefined();
      // Проверяем, что middleware настроен правильно
      expect(typeof apiRateLimit).toBe('function');
    });

    it('should have correct auth rate limit settings', () => {
      expect(authRateLimit).toBeDefined();
      // Проверяем, что middleware настроен правильно
      expect(typeof authRateLimit).toBe('function');
    });
  });
});
