import { CachePriority, type CacheStrategy } from './cache.contract';
export { CachePriority, CacheStrategy };

export const CACHE_STRATEGIES: Record<string, CacheStrategy | undefined> = {
  // Статистика мониторинга - обновляется часто, но не критично
  monitoring_stats: {
    priority: CachePriority.MEDIUM,
    ttl: 2 * 60 * 1000, // 2 минуты
    invalidateOnWrite: true,
    invalidatePatterns: ['monitoring_stats'],
  },

  // История проверок проекта - может быть немного устаревшей
  project_history: {
    priority: CachePriority.MEDIUM,
    ttl: 1 * 60 * 1000, // 1 минута
    invalidateOnWrite: true,
    invalidatePatterns: ['project_history_*'],
  },

  // Данные пользователя - редко изменяются
  user_data: {
    priority: CachePriority.LOW,
    ttl: 5 * 60 * 1000, // 5 минут
    invalidateOnWrite: true,
    invalidatePatterns: ['user_*'],
  },

  // Список проектов пользователя - обновляется при изменениях
  user_projects: {
    priority: CachePriority.MEDIUM,
    ttl: 3 * 60 * 1000, // 3 минуты
    invalidateOnWrite: true,
    invalidatePatterns: ['user_projects_*'],
  },

  // SSL статистика - обновляется редко
  ssl_stats: {
    priority: CachePriority.LOW,
    ttl: 10 * 60 * 1000, // 10 минут
    invalidateOnWrite: true,
    invalidatePatterns: ['ssl_stats'],
  },
};

export class CacheStrategyManager {
  static getStrategy(key: string): CacheStrategy {
    // Определяем стратегию по ключу
    if (key.startsWith('monitoring_stats')) {
      return CACHE_STRATEGIES.monitoring_stats ?? this.getDefaultStrategy();
    }
    if (key.startsWith('project_history_')) {
      return CACHE_STRATEGIES.project_history ?? this.getDefaultStrategy();
    }
    if (key.startsWith('user_projects_')) {
      return CACHE_STRATEGIES.user_projects ?? this.getDefaultStrategy();
    }
    if (key.startsWith('user_')) {
      return CACHE_STRATEGIES.user_data ?? this.getDefaultStrategy();
    }
    if (key.startsWith('ssl_stats')) {
      return CACHE_STRATEGIES.ssl_stats ?? this.getDefaultStrategy();
    }

    // По умолчанию используем средний приоритет
    return this.getDefaultStrategy();
  }

  private static getDefaultStrategy(): CacheStrategy {
    return {
      priority: CachePriority.MEDIUM,
      ttl: 5 * 60 * 1000,
      invalidateOnWrite: true,
      invalidatePatterns: [],
    };
  }

  static shouldInvalidate(
    key: string,
    _operation: 'create' | 'update' | 'delete'
  ): boolean {
    const strategy = this.getStrategy(key);
    return strategy.invalidateOnWrite;
  }

  static getInvalidationPatterns(key: string): string[] {
    const strategy = this.getStrategy(key);
    return strategy.invalidatePatterns;
  }
}
