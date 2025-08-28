// Типы для модуля кэширования

/**
 * Приоритеты кэширования
 */
export enum CachePriority {
  HIGH = 'high', // Критически важные данные (TTL: 30 сек)
  MEDIUM = 'medium', // Важные данные (TTL: 2-5 мин)
  LOW = 'low', // Менее важные данные (TTL: 10-30 мин)
}

/**
 * Стратегия кэширования
 */
export interface CacheStrategy {
  priority: CachePriority;
  ttl: number;
  invalidateOnWrite: boolean;
  invalidatePatterns: string[];
}

/**
 * Элемент кэша
 */
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  strategy?: CacheStrategy;
}

/**
 * Операции кэширования
 */
export type CacheOperation = 'create' | 'update' | 'delete';

/**
 * Конфигурация кэша
 */
export interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
}

// Примеры для Swagger
export const cacheStrategyExample: CacheStrategy = {
  priority: CachePriority.MEDIUM,
  ttl: 5 * 60 * 1000, // 5 минут
  invalidateOnWrite: true,
  invalidatePatterns: ['user_*', 'project_*'],
};

export const cacheConfigExample: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 минут
  maxSize: 1000,
  cleanupInterval: 60 * 1000, // 1 минута
};
