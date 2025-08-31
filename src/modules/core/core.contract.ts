// Общие типы для переиспользования между модулями

export interface PaginationInfo {
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Типы для graceful shutdown
 */
import type { Server } from 'http';
export interface GracefulShutdownOptions {
  server: Server;
  timeout?: number;
  onShutdown?: () => Promise<void>;
}
