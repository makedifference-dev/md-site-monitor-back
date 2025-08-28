import { CacheStrategyManager } from './cache-strategy';
import type { CacheStrategy, CacheItem } from './cache.types';

export class CacheService {
  private static instance: CacheService | null = null;
  private cache: Map<string, CacheItem<unknown>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 минут

  public static getInstance(): CacheService {
    CacheService.instance ??= new CacheService();
    return CacheService.instance;
  }

  /**
   * Получить данные из кэша
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Проверяем, не истек ли срок действия
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Сохранить данные в кэш
   */
  set<T>(
    key: string,
    data: T,
    ttl: number = this.DEFAULT_TTL,
    strategy?: CacheStrategy
  ): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      strategy,
    });
  }

  /**
   * Удалить данные из кэша
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Очистить весь кэш
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Получить размер кэша
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Проверить, существует ли ключ в кэше
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    // Проверяем, не истек ли срок действия
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Получить данные с автоматическим обновлением кэша
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFunction();
    const strategy = CacheStrategyManager.getStrategy(key);
    const finalTtl = ttl ?? strategy.ttl;
    this.set(key, data, finalTtl, strategy);
    return data;
  }

  /**
   * Инвалидировать кэш по паттерну ключа
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}
