/* eslint-disable no-console, no-undef */
import {
  CacheStrategyManager,
  CACHE_STRATEGIES,
  CachePriority,
} from '../../modules/core/cache/cache-strategy';

describe('CacheStrategyManager', () => {
  describe('getStrategy', () => {
    it('should return monitoring_stats strategy for monitoring_stats keys', () => {
      const strategy = CacheStrategyManager.getStrategy('monitoring_stats');

      expect(strategy).toEqual(CACHE_STRATEGIES.monitoring_stats);
      expect(strategy.priority).toBe(CachePriority.MEDIUM);
      expect(strategy.ttl).toBe(2 * 60 * 1000); // 2 минуты
      expect(strategy.invalidateOnWrite).toBe(true);
      expect(strategy.invalidatePatterns).toEqual(['monitoring_stats']);
    });

    it('should return monitoring_stats strategy for monitoring_stats with suffix', () => {
      const strategy = CacheStrategyManager.getStrategy(
        'monitoring_stats_global'
      );

      expect(strategy).toEqual(CACHE_STRATEGIES.monitoring_stats);
    });

    it('should return project_history strategy for project_history keys', () => {
      const strategy = CacheStrategyManager.getStrategy('project_history_123');

      expect(strategy).toEqual(CACHE_STRATEGIES.project_history);
      expect(strategy.priority).toBe(CachePriority.MEDIUM);
      expect(strategy.ttl).toBe(1 * 60 * 1000); // 1 минута
      expect(strategy.invalidateOnWrite).toBe(true);
      expect(strategy.invalidatePatterns).toEqual(['project_history_*']);
    });

    it('should return user_data strategy for user keys', () => {
      const strategy = CacheStrategyManager.getStrategy('user_123');

      expect(strategy).toEqual(CACHE_STRATEGIES.user_data);
      expect(strategy.priority).toBe(CachePriority.LOW);
      expect(strategy.ttl).toBe(5 * 60 * 1000); // 5 минут
      expect(strategy.invalidateOnWrite).toBe(true);
      expect(strategy.invalidatePatterns).toEqual(['user_*']);
    });

    it('should return user_data strategy for user keys with different patterns', () => {
      const strategy1 = CacheStrategyManager.getStrategy('user_profile_123');
      const strategy2 = CacheStrategyManager.getStrategy('user_settings_123');

      expect(strategy1).toEqual(CACHE_STRATEGIES.user_data);
      expect(strategy2).toEqual(CACHE_STRATEGIES.user_data);
    });

    it('should return user_projects strategy for user_projects keys', () => {
      const strategy = CacheStrategyManager.getStrategy('user_projects_123');

      expect(strategy).toEqual(CACHE_STRATEGIES.user_projects);
      expect(strategy.priority).toBe(CachePriority.MEDIUM);
      expect(strategy.ttl).toBe(3 * 60 * 1000); // 3 минуты
      expect(strategy.invalidateOnWrite).toBe(true);
      expect(strategy.invalidatePatterns).toEqual(['user_projects_*']);
    });

    it('should return ssl_stats strategy for ssl_stats keys', () => {
      const strategy = CacheStrategyManager.getStrategy('ssl_stats');

      expect(strategy).toEqual(CACHE_STRATEGIES.ssl_stats);
      expect(strategy.priority).toBe(CachePriority.LOW);
      expect(strategy.ttl).toBe(10 * 60 * 1000); // 10 минут
      expect(strategy.invalidateOnWrite).toBe(true);
      expect(strategy.invalidatePatterns).toEqual(['ssl_stats']);
    });

    it('should return ssl_stats strategy for ssl_stats with suffix', () => {
      const strategy = CacheStrategyManager.getStrategy('ssl_stats_global');

      expect(strategy).toEqual(CACHE_STRATEGIES.ssl_stats);
    });

    it('should return default strategy for unknown keys', () => {
      const strategy = CacheStrategyManager.getStrategy('unknown_key');

      expect(strategy).toEqual({
        priority: CachePriority.MEDIUM,
        ttl: 5 * 60 * 1000, // 5 минут
        invalidateOnWrite: true,
        invalidatePatterns: [],
      });
    });

    it('should return default strategy for empty key', () => {
      const strategy = CacheStrategyManager.getStrategy('');

      expect(strategy).toEqual({
        priority: CachePriority.MEDIUM,
        ttl: 5 * 60 * 1000,
        invalidateOnWrite: true,
        invalidatePatterns: [],
      });
    });

    it('should prioritize user_projects over user for user_projects keys', () => {
      const strategy = CacheStrategyManager.getStrategy('user_projects_123');

      // Должен вернуть user_projects стратегию, а не user_data
      expect(strategy).toEqual(CACHE_STRATEGIES.user_projects);
      expect(strategy).not.toEqual(CACHE_STRATEGIES.user_data);
    });
  });

  describe('shouldInvalidate', () => {
    it('should return true for create operation on monitoring_stats', () => {
      const result = CacheStrategyManager.shouldInvalidate(
        'monitoring_stats',
        'create'
      );
      expect(result).toBe(true);
    });

    it('should return true for update operation on project_history', () => {
      const result = CacheStrategyManager.shouldInvalidate(
        'project_history_123',
        'update'
      );
      expect(result).toBe(true);
    });

    it('should return true for delete operation on user data', () => {
      const result = CacheStrategyManager.shouldInvalidate(
        'user_123',
        'delete'
      );
      expect(result).toBe(true);
    });

    it('should return true for any operation on user_projects', () => {
      const createResult = CacheStrategyManager.shouldInvalidate(
        'user_projects_123',
        'create'
      );
      const updateResult = CacheStrategyManager.shouldInvalidate(
        'user_projects_123',
        'update'
      );
      const deleteResult = CacheStrategyManager.shouldInvalidate(
        'user_projects_123',
        'delete'
      );

      expect(createResult).toBe(true);
      expect(updateResult).toBe(true);
      expect(deleteResult).toBe(true);
    });

    it('should return true for any operation on ssl_stats', () => {
      const createResult = CacheStrategyManager.shouldInvalidate(
        'ssl_stats',
        'create'
      );
      const updateResult = CacheStrategyManager.shouldInvalidate(
        'ssl_stats',
        'update'
      );
      const deleteResult = CacheStrategyManager.shouldInvalidate(
        'ssl_stats',
        'delete'
      );

      expect(createResult).toBe(true);
      expect(updateResult).toBe(true);
      expect(deleteResult).toBe(true);
    });

    it('should return true for unknown keys (default strategy)', () => {
      const result = CacheStrategyManager.shouldInvalidate(
        'unknown_key',
        'create'
      );
      expect(result).toBe(true);
    });
  });

  describe('getInvalidationPatterns', () => {
    it('should return monitoring_stats patterns', () => {
      const patterns =
        CacheStrategyManager.getInvalidationPatterns('monitoring_stats');
      expect(patterns).toEqual(['monitoring_stats']);
    });

    it('should return project_history patterns', () => {
      const patterns = CacheStrategyManager.getInvalidationPatterns(
        'project_history_123'
      );
      expect(patterns).toEqual(['project_history_*']);
    });

    it('should return user patterns', () => {
      const patterns = CacheStrategyManager.getInvalidationPatterns('user_123');
      expect(patterns).toEqual(['user_*']);
    });

    it('should return user_projects patterns', () => {
      const patterns =
        CacheStrategyManager.getInvalidationPatterns('user_projects_123');
      expect(patterns).toEqual(['user_projects_*']);
    });

    it('should return ssl_stats patterns', () => {
      const patterns =
        CacheStrategyManager.getInvalidationPatterns('ssl_stats');
      expect(patterns).toEqual(['ssl_stats']);
    });

    it('should return empty array for unknown keys', () => {
      const patterns =
        CacheStrategyManager.getInvalidationPatterns('unknown_key');
      expect(patterns).toEqual([]);
    });

    it('should return empty array for empty key', () => {
      const patterns = CacheStrategyManager.getInvalidationPatterns('');
      expect(patterns).toEqual([]);
    });
  });

  describe('CACHE_STRATEGIES', () => {
    it('should have all required strategies defined', () => {
      expect(CACHE_STRATEGIES.monitoring_stats).toBeDefined();
      expect(CACHE_STRATEGIES.project_history).toBeDefined();
      expect(CACHE_STRATEGIES.user_data).toBeDefined();
      expect(CACHE_STRATEGIES.user_projects).toBeDefined();
      expect(CACHE_STRATEGIES.ssl_stats).toBeDefined();
    });

    it('should have correct TTL values', () => {
      expect(CACHE_STRATEGIES.monitoring_stats!.ttl).toBe(2 * 60 * 1000); // 2 минуты
      expect(CACHE_STRATEGIES.project_history!.ttl).toBe(1 * 60 * 1000); // 1 минута
      expect(CACHE_STRATEGIES.user_data!.ttl).toBe(5 * 60 * 1000); // 5 минут
      expect(CACHE_STRATEGIES.user_projects!.ttl).toBe(3 * 60 * 1000); // 3 минуты
      expect(CACHE_STRATEGIES.ssl_stats!.ttl).toBe(10 * 60 * 1000); // 10 минут
    });

    it('should have correct priorities', () => {
      expect(CACHE_STRATEGIES.monitoring_stats!.priority).toBe(
        CachePriority.MEDIUM
      );
      expect(CACHE_STRATEGIES.project_history!.priority).toBe(
        CachePriority.MEDIUM
      );
      expect(CACHE_STRATEGIES.user_data!.priority).toBe(CachePriority.LOW);
      expect(CACHE_STRATEGIES.user_projects!.priority).toBe(
        CachePriority.MEDIUM
      );
      expect(CACHE_STRATEGIES.ssl_stats!.priority).toBe(CachePriority.LOW);
    });

    it('should have invalidateOnWrite set to true for all strategies', () => {
      expect(CACHE_STRATEGIES.monitoring_stats!.invalidateOnWrite).toBe(true);
      expect(CACHE_STRATEGIES.project_history!.invalidateOnWrite).toBe(true);
      expect(CACHE_STRATEGIES.user_data!.invalidateOnWrite).toBe(true);
      expect(CACHE_STRATEGIES.user_projects!.invalidateOnWrite).toBe(true);
      expect(CACHE_STRATEGIES.ssl_stats!.invalidateOnWrite).toBe(true);
    });

    it('should have correct invalidation patterns', () => {
      expect(CACHE_STRATEGIES.monitoring_stats!.invalidatePatterns).toEqual([
        'monitoring_stats',
      ]);
      expect(CACHE_STRATEGIES.project_history!.invalidatePatterns).toEqual([
        'project_history_*',
      ]);
      expect(CACHE_STRATEGIES.user_data!.invalidatePatterns).toEqual([
        'user_*',
      ]);
      expect(CACHE_STRATEGIES.user_projects!.invalidatePatterns).toEqual([
        'user_projects_*',
      ]);
      expect(CACHE_STRATEGIES.ssl_stats!.invalidatePatterns).toEqual([
        'ssl_stats',
      ]);
    });
  });
});
