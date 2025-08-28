import * as tls from 'tls';
import { URL } from 'url';
import type { SSLCertificateInfo } from './monitoring.types';

export class SSLChecker {
  /**
   * Проверяет SSL сертификат для указанного URL
   */
  static async checkSSLCertificate(url: string): Promise<SSLCertificateInfo> {
    try {
      const parsedUrl = new URL(url);

      // Проверяем только HTTPS URLs
      if (parsedUrl.protocol !== 'https:') {
        return {
          valid: false,
          error: 'Not an HTTPS URL',
        };
      }

      const hostname = parsedUrl.hostname;
      const port = parsedUrl.port || 443;

      return new Promise(resolve => {
        const socket = tls.connect(
          {
            host: hostname,
            port: parseInt(port.toString()),
            servername: hostname, // SNI
            rejectUnauthorized: false, // Не отклоняем невалидные сертификаты
          },
          () => {
            const cert = socket.getPeerCertificate();

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (!cert || Object.keys(cert).length === 0) {
              socket.destroy();
              resolve({
                valid: false,
                error: 'No certificate received',
              });
              return;
            }

            const now = new Date();
            const expiry = new Date(cert.valid_to);
            const valid = expiry > now;

            socket.destroy();

            resolve({
              valid,
              expiry,
              issuer: cert.issuer.CN || cert.issuer.O || 'Unknown',
            });
          }
        );

        socket.on('error', (error: Error) => {
          socket.destroy();
          resolve({
            valid: false,
            error: error.message,
          });
        });

        // Таймаут для SSL проверки
        socket.setTimeout(10000, () => {
          socket.destroy();
          resolve({
            valid: false,
            error: 'SSL check timeout',
          });
        });
      });
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown SSL error',
      };
    }
  }

  /**
   * Проверяет, является ли URL HTTPS
   */
  static isHTTPS(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Получает количество дней до истечения сертификата
   */
  static getDaysUntilExpiry(expiry: Date): number {
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
