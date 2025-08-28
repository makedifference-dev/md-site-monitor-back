// Общие типы для переиспользования между модулями

export interface PaginationInfo {
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Типы для graceful shutdown
 */
export interface GracefulShutdownOptions {
  server: import('http').Server;
  timeout?: number;
  onShutdown?: () => Promise<void>;
}
