# Организация типов в файлах .types.ts

## Обзор

Все типы в модулях теперь организованы в специальных файлах `.types.ts`, что обеспечивает лучшую структуру и организацию кода.

## Выполненные изменения

### 1. Созданы новые файлы .types.ts

#### 🔧 **Docs Module** (`src/modules/docs/docs.types.ts`)

```typescript
// Типы для модуля документации
import type { OpenAPIV3 } from 'openapi-types';

export interface SwaggerUtils {
  generateSchemaFromInterface: <T>(
    example: T,
    requiredFields?: string[]
  ) => OpenAPIV3.SchemaObject;
  // ... другие методы
}

export interface DocumentationConfig {
  title: string;
  version: string;
  description: string;
  basePath: string;
  tags: OpenAPIV3.TagObject[];
}

export interface SchemaDefinition {
  name: string;
  schema: OpenAPIV3.SchemaObject;
  example?: unknown;
}

export interface EndpointDefinition {
  path: string;
  method: string;
  summary: string;
  description?: string;
  tags?: string[];
  requestSchema?: OpenAPIV3.SchemaObject;
  responseSchema?: OpenAPIV3.SchemaObject;
  requiresAuth?: boolean;
}
```

#### 🔧 **Cache Module** (`src/modules/core/cache/cache.types.ts`)

```typescript
// Типы для модуля кэширования

export enum CachePriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export interface CacheStrategy {
  priority: CachePriority;
  ttl: number;
  invalidateOnWrite: boolean;
  invalidatePatterns: string[];
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  strategy?: CacheStrategy;
}

export type CacheOperation = 'create' | 'update' | 'delete';

export interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
}
```

### 2. Переименован core/types.ts

#### 🔧 **Core Module** (`src/modules/core/core.types.ts`)

```typescript
// Общие типы для переиспользования между модулями

export interface PaginationInfo {
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface GracefulShutdownOptions {
  server: import('http').Server;
  timeout?: number;
  onShutdown?: () => Promise<void>;
}
```

### 3. Перенесены типы из других файлов

#### 🔧 **Monitoring Module**

- `SSLCertificateInfo` перенесен из `ssl-checker.ts` в `monitoring.types.ts`
- Обновлены импорты в `ssl-checker.ts`

#### 🔧 **Health Module**

- `HealthStatus` перенесен из `health.service.ts` в `health.types.ts`
- Удалено дублирование типов

#### 🔧 **Cache Module**

- `CacheItem<T>`, `CacheStrategy`, `CachePriority` перенесены в `cache.types.ts`
- Обновлены импорты в `cache.service.ts` и `cache-strategy.ts`

## Структура файлов .types.ts

### ✅ **Существующие файлы .types.ts:**

1. **`auth.types.ts`** - типы аутентификации
   - `RequestUser`, `RegisterRequest`, `LoginRequest`, `AuthResponse`
   - Express типы для `req.user`

2. **`projects.types.ts`** - типы проектов
   - `CreateProjectRequest`, `ProjectResponse`, `ProjectsListResponse`

3. **`monitoring.types.ts`** - типы мониторинга
   - `SiteCheckResult`, `MonitoringStats`, `ProjectCheckHistory`
   - `SSLCertificateInfo` (перенесен из ssl-checker.ts)

4. **`notifications.types.ts`** - типы уведомлений
   - `NotificationConfig`, `EmailNotification`, `SiteDownNotification`

5. **`telegram.types.ts`** - типы Telegram
   - `TelegramBotConfig`, `TelegramUser`, `TelegramNotification`

6. **`health.types.ts`** - типы health check
   - `HealthCheck`, `HealthStatus` (перенесен из health.service.ts)

7. **`error.types.ts`** - типы ошибок
   - `ApiError`, `ValidationError`, `AuthError`, `NotFoundError`

8. **`api-info.types.ts`** - типы информации об API
   - `RootInfoResponse`

### ✅ **Новые файлы .types.ts:**

9. **`docs.types.ts`** - типы документации
   - `SwaggerUtils`, `DocumentationConfig`, `SchemaDefinition`, `EndpointDefinition`

10. **`core.types.ts`** - общие типы (переименован из types.ts)
    - `PaginationInfo`, `GracefulShutdownOptions` (перенесен из graceful-shutdown.ts)

11. **`cache.types.ts`** - типы кэширования
    - `CachePriority`, `CacheStrategy`, `CacheItem<T>`, `CacheConfig`

## Обновленные импорты

### 🔄 **Изменения в импортах:**

#### Core Module:

```typescript
// Было
import type { PaginationInfo } from '../core/types';

// Стало
import type { PaginationInfo } from '../core/core.types';
```

#### Monitoring Module:

```typescript
// Было
import type { SSLCertificateInfo } from './ssl-checker';

// Стало
import type { SSLCertificateInfo } from './monitoring.types';
```

#### Cache Module:

```typescript
// Было
import { CacheStrategyManager, type CacheStrategy } from './cache-strategy';
interface CacheItem<T> { ... }

// Стало
import { CacheStrategyManager } from './cache-strategy';
import type { CacheStrategy, CacheItem } from './cache.types';
```

#### Health Module:

```typescript
// Было
interface HealthStatus { ... } // локально в health.service.ts

// Стало
import type { HealthCheck, HealthStatus } from './health.types';
```

## Преимущества новой организации

### ✅ **Лучшая структура**

- Все типы модуля в одном месте
- Легко найти нужные типы
- Четкое разделение ответственности

### ✅ **Упрощенная навигация**

- Разработчик знает, где искать типы
- Нет необходимости искать в разных файлах
- Логическая группировка типов

### ✅ **Улучшенная инкапсуляция**

- Каждый модуль содержит свои типы
- Меньше зависимостей между модулями
- Самодостаточность модулей

### ✅ **Упрощенная поддержка**

- Легче рефакторить типы
- Проще добавлять новые типы
- Меньше дублирования

### ✅ **Лучшая документация**

- Типы рядом с примерами для Swagger
- Автоматическая генерация схем
- Примеры использования

## Принципы организации

### 1. **Принцип близости**

Типы размещаются рядом с кодом, который их использует функционально.

### 2. **Принцип единственной ответственности**

Каждый файл `.types.ts` отвечает только за типы своего модуля.

### 3. **Принцип инкапсуляции**

Модуль содержит все необходимые типы для своей работы.

### 4. **Принцип переиспользования**

Общие типы остаются в `core.types.ts` для использования во всех модулях.

## Рекомендации

### Для дальнейшего развития:

1. **Создавайте .types.ts файлы** - для каждого нового модуля
2. **Группируйте связанные типы** - в соответствующих файлах
3. **Используйте примеры** - для Swagger документации
4. **Следите за импортами** - обновляйте при изменении структуры

### Для поддержки:

1. **Проверяйте структуру** - при добавлении новых типов
2. **Обновляйте документацию** - при изменении типов
3. **Тестируйте импорты** - после рефакторинга
4. **Следите за дублированием** - избегайте повторения типов

## Заключение

Организация типов в файлах `.types.ts` значительно улучшила структуру проекта:

- **Лучшая организация** - все типы в соответствующих файлах
- **Упрощенная навигация** - легко найти нужные типы
- **Улучшенная инкапсуляция** - модули самодостаточны
- **Упрощенная поддержка** - легче работать с типами

Это изменение соответствует принципам модульной архитектуры и улучшает структуру проекта.
