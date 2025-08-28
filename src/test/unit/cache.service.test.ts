import { CacheService } from '../../modules/core/cache/cache.service';
import { CacheStrategyManager } from '../../modules/core/cache/cache-strategy';
import { CachePriority } from '../../modules/core/cache/cache.types';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = CacheService.getInstance();
    cacheService.clear();
  });

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = CacheService.getInstance();
      const instance2 = CacheService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('set and get', () => {
    it('should set and get values', () => {
      cacheService.set('test', 'value');
      expect(cacheService.get('test')).toBe('value');
    });

    it('should handle different types', () => {
      cacheService.set('string', 'test');
      cacheService.set('number', 123);
      cacheService.set('object', { key: 'value' });

      expect(cacheService.get('string')).toBe('test');
      expect(cacheService.get('number')).toBe(123);
      expect(cacheService.get('object')).toEqual({ key: 'value' });
    });
  });

  describe('delete', () => {
    it('should delete existing key', () => {
      cacheService.set('test', 'value');
      expect(cacheService.delete('test')).toBe(true);
      expect(cacheService.get('test')).toBeNull();
    });

    it('should return false for non-existent key', () => {
      expect(cacheService.delete('non-existent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      expect(cacheService.size()).toBe(2);

      cacheService.clear();
      expect(cacheService.size()).toBe(0);
      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.get('key2')).toBeNull();
    });
  });

  describe('size', () => {
    it('should return correct size', () => {
      expect(cacheService.size()).toBe(0);
      cacheService.set('key1', 'value1');
      expect(cacheService.size()).toBe(1);
      cacheService.set('key2', 'value2');
      expect(cacheService.size()).toBe(2);
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      cacheService.set('test', 'value');
      expect(cacheService.has('test')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cacheService.has('non-existent')).toBe(false);
    });
  });

  describe('getOrSet', () => {
    it('should return existing value', async () => {
      cacheService.set('test', 'cached');
      const result = await cacheService.getOrSet('test', async () => 'new');
      expect(result).toBe('cached');
    });

    it('should set fallback value', async () => {
      const fallbackValue = 'fallback';
      const result = await cacheService.getOrSet(
        'test',
        async () => fallbackValue
      );
      expect(result).toBe(fallbackValue);
      expect(cacheService.get('test')).toBe(fallbackValue);
    });
  });

  describe('invalidatePattern', () => {
    it('should invalidate keys by pattern', () => {
      cacheService.set('user_123', 'value1');
      cacheService.set('user_456', 'value2');
      cacheService.set('project_789', 'value3');

      cacheService.invalidatePattern('user_\\d+');
      expect(cacheService.get('user_123')).toBeNull();
      expect(cacheService.get('user_456')).toBeNull();
      expect(cacheService.get('project_789')).toBe('value3');
    });
  });

  describe('TTL and expiration', () => {
    it('should respect TTL', () => {
      cacheService.set('test', 'value', 100); // 100ms TTL
      expect(cacheService.get('test')).toBe('value');
    });

    it('should handle different TTL values', () => {
      cacheService.set('short', 'value1', 50);
      cacheService.set('long', 'value2', 200);

      expect(cacheService.get('short')).toBe('value1');
      expect(cacheService.get('long')).toBe('value2');
    });
  });

  describe('cache invalidation on write', () => {
    it('should invalidate related patterns', () => {
      cacheService.set('user_projects_123', 'projects');
      cacheService.set('user_data_123', 'data');
      cacheService.set('monitoring_stats', 'stats');

      // Симулируем создание нового проекта
      const strategy = CacheStrategyManager.getStrategy('user_projects_123');
      if (strategy.invalidateOnWrite) {
        strategy.invalidatePatterns.forEach(pattern => {
          cacheService.invalidatePattern(pattern);
        });
      }

      expect(cacheService.get('user_projects_123')).toBeNull();
      // user_data_123 НЕ инвалидируется, так как user_projects_ теперь имеет свой паттерн
      expect(cacheService.get('user_data_123')).toBe('data');
      expect(cacheService.get('monitoring_stats')).toBe('stats'); // Не должно быть инвалидировано
    });
  });

  describe('cache strategy integration', () => {
    it('should use correct strategy for monitoring stats', () => {
      const strategy = CacheStrategyManager.getStrategy('monitoring_stats');
      expect(strategy.priority).toBe(CachePriority.MEDIUM);
      expect(strategy.ttl).toBe(2 * 60 * 1000);
    });

    it('should use correct strategy for user data', () => {
      const strategy = CacheStrategyManager.getStrategy('user_123');
      expect(strategy.priority).toBe(CachePriority.LOW);
      expect(strategy.ttl).toBe(5 * 60 * 1000);
    });

    it('should use default strategy for unknown keys', () => {
      const strategy = CacheStrategyManager.getStrategy('unknown_key');
      expect(strategy.priority).toBe(CachePriority.MEDIUM);
      expect(strategy.ttl).toBe(5 * 60 * 1000);
    });
  });
});
