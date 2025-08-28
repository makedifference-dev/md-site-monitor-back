/* eslint-disable no-console, no-undef */
import { SSLChecker } from '../../modules/monitoring/ssl-checker';
import * as tls from 'tls';

// Мокаем tls модуль
jest.mock('tls');

describe('SSLChecker', () => {
  let mockSocket: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Создаем мок сокета
    mockSocket = {
      getPeerCertificate: jest.fn(),
      destroy: jest.fn(),
      on: jest.fn(),
      setTimeout: jest.fn(),
    };

    (tls.connect as jest.Mock).mockImplementation((options, callback) => {
      // Вызываем callback сразу для успешного соединения
      if (callback) {
        setTimeout(() => callback(), 0);
      }
      return mockSocket;
    });
  });

  describe('checkSSLCertificate', () => {
    it('should return error for non-HTTPS URLs', async () => {
      const result = await SSLChecker.checkSSLCertificate('http://example.com');

      expect(result).toEqual({
        valid: false,
        error: 'Not an HTTPS URL',
      });
    });

    it('should return error for invalid URLs', async () => {
      const result = await SSLChecker.checkSSLCertificate('invalid-url');

      expect(result).toEqual({
        valid: false,
        error: 'Unknown SSL error',
      });
    });

    it('should handle SSL connection errors', async () => {
      const errorMessage = 'Connection refused';
      mockSocket.on.mockImplementation(
        (event: string, callback: (error: Error) => void) => {
          if (event === 'error') {
            callback(new Error(errorMessage));
          }
        }
      );

      const result = await SSLChecker.checkSSLCertificate(
        'https://example.com'
      );

      expect(result).toEqual({
        valid: false,
        error: errorMessage,
      });
      expect(mockSocket.destroy).toHaveBeenCalled();
    });

    it('should handle SSL timeout', async () => {
      mockSocket.setTimeout.mockImplementation(
        (timeout: number, callback: () => void) => {
          callback();
        }
      );

      const result = await SSLChecker.checkSSLCertificate(
        'https://example.com'
      );

      expect(result).toEqual({
        valid: false,
        error: 'SSL check timeout',
      });
      expect(mockSocket.destroy).toHaveBeenCalled();
    });

    it('should handle missing certificate', async () => {
      mockSocket.getPeerCertificate.mockReturnValue({});

      const result = await SSLChecker.checkSSLCertificate(
        'https://example.com'
      );

      expect(result).toEqual({
        valid: false,
        error: 'No certificate received',
      });
      expect(mockSocket.destroy).toHaveBeenCalled();
    });

    it('should handle valid certificate with CN issuer', async () => {
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней в будущем
      mockSocket.getPeerCertificate.mockReturnValue({
        valid_to: expiryDate.toISOString(),
        issuer: { CN: "Let's Encrypt" },
      });

      const result = await SSLChecker.checkSSLCertificate(
        'https://example.com'
      );

      expect(result).toEqual({
        valid: true,
        expiry: expiryDate,
        issuer: "Let's Encrypt",
      });
      expect(mockSocket.destroy).toHaveBeenCalled();
    });

    it('should handle valid certificate with O issuer', async () => {
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      mockSocket.getPeerCertificate.mockReturnValue({
        valid_to: expiryDate.toISOString(),
        issuer: { O: 'DigiCert Inc' },
      });

      const result = await SSLChecker.checkSSLCertificate(
        'https://example.com'
      );

      expect(result).toEqual({
        valid: true,
        expiry: expiryDate,
        issuer: 'DigiCert Inc',
      });
    });

    it('should handle expired certificate', async () => {
      const expiryDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 дней в прошлом
      mockSocket.getPeerCertificate.mockReturnValue({
        valid_to: expiryDate.toISOString(),
        issuer: { CN: 'Test CA' },
      });

      const result = await SSLChecker.checkSSLCertificate(
        'https://example.com'
      );

      expect(result).toEqual({
        valid: false,
        expiry: expiryDate,
        issuer: 'Test CA',
      });
    });

    it('should handle unknown issuer', async () => {
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      mockSocket.getPeerCertificate.mockReturnValue({
        valid_to: expiryDate.toISOString(),
        issuer: {},
      });

      const result = await SSLChecker.checkSSLCertificate(
        'https://example.com'
      );

      expect(result).toEqual({
        valid: true,
        expiry: expiryDate,
        issuer: 'Unknown',
      });
    });

    it('should use custom port when specified', async () => {
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      mockSocket.getPeerCertificate.mockReturnValue({
        valid_to: expiryDate.toISOString(),
        issuer: { CN: 'Test CA' },
      });

      await SSLChecker.checkSSLCertificate('https://example.com:8443');

      expect(tls.connect).toHaveBeenCalledWith(
        {
          host: 'example.com',
          port: 8443,
          servername: 'example.com',
          rejectUnauthorized: false,
        },
        expect.any(Function)
      );
    });
  });

  describe('isHTTPS', () => {
    it('should return true for HTTPS URLs', () => {
      expect(SSLChecker.isHTTPS('https://example.com')).toBe(true);
      expect(SSLChecker.isHTTPS('https://api.example.com/path')).toBe(true);
      expect(SSLChecker.isHTTPS('https://example.com:8443')).toBe(true);
    });

    it('should return false for HTTP URLs', () => {
      expect(SSLChecker.isHTTPS('http://example.com')).toBe(false);
      expect(SSLChecker.isHTTPS('http://api.example.com/path')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(SSLChecker.isHTTPS('invalid-url')).toBe(false);
      expect(SSLChecker.isHTTPS('')).toBe(false);
      expect(SSLChecker.isHTTPS('ftp://example.com')).toBe(false);
    });

    it('should return false for URLs without protocol', () => {
      expect(SSLChecker.isHTTPS('example.com')).toBe(false);
      expect(SSLChecker.isHTTPS('www.example.com')).toBe(false);
    });
  });

  describe('getDaysUntilExpiry', () => {
    it('should return positive days for future expiry', () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней
      const days = SSLChecker.getDaysUntilExpiry(futureDate);

      expect(days).toBeGreaterThan(0);
      expect(days).toBeCloseTo(30, 0);
    });

    it('should return negative days for past expiry', () => {
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 дней назад
      const days = SSLChecker.getDaysUntilExpiry(pastDate);

      expect(days).toBeLessThan(0);
      expect(days).toBeCloseTo(-30, 0);
    });

    it('should return 0 for current date', () => {
      const now = new Date();
      const days = SSLChecker.getDaysUntilExpiry(now);

      expect(days).toBe(0);
    });

    it('should handle exact day calculation', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const days = SSLChecker.getDaysUntilExpiry(tomorrow);

      expect(days).toBe(1);
    });

    it('should round up partial days', () => {
      const halfDay = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 часов
      const days = SSLChecker.getDaysUntilExpiry(halfDay);

      expect(days).toBe(1); // Math.ceil округляет вверх
    });
  });
});
