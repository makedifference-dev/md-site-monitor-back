# Перенос RequestUser в Auth Module

## Обзор

Тип `RequestUser` и его глобальное объявление для Express перенесены из `core/types.ts` в `auth/auth.types.ts`, так как они относятся к функциональности аутентификации.

## Причина переноса

`RequestUser` используется для типизации пользователя в Express Request после аутентификации через JWT middleware. Это логически относится к модулю аутентификации, а не к общим утилитам.

## Выполненные изменения

### 1. Добавлен в Auth Module

**`src/modules/auth/auth.types.ts`** - добавлены Express типы:

```typescript
// Express types
export type RequestUser = Omit<User, 'password'>;

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}
```

### 2. Удален из Core Module

**`src/modules/core/types.ts`** - удалены Express типы:

```typescript
// УДАЛЕНО:
// Express types
// import type { User } from '@prisma/client';
// export type RequestUser = Omit<User, 'password'>;
// declare global { ... }
```

### 3. Обновлены импорты

#### Notifications Controller:

```typescript
// Было
import type { RequestUser } from '../core/types';

// Стало
import type { RequestUser } from '../auth/auth.types';
```

#### Monitoring Controller:

```typescript
// Было
import type { RequestUser } from '../core/types';

// Стало
import type { RequestUser } from '../auth/auth.types';
```

#### Auth Middleware:

```typescript
// Было
} as import('../core/types').RequestUser;

// Стало
} as import('./auth.types').RequestUser;
```

## Структура после переноса

### Core Module (`src/modules/core/types.ts`)

```typescript
// Общие типы для переиспользования между модулями
export interface PaginationInfo {
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Shared API utility types
export interface PaginationInfo {
  limit: number;
  offset: number;
  hasMore: boolean;
}
```

### Auth Module (`src/modules/auth/auth.types.ts`)

```typescript
import type { User } from '@prisma/client';
import type { PaginationInfo } from '../core/core.types';

// Express types
export type RequestUser = Omit<User, 'password'>;

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

// Auth-specific types
export interface RegisterRequest { ... }
export interface LoginRequest { ... }
export interface AuthResponse { ... }
// ... другие типы аутентификации
```

## Преимущества переноса

### ✅ **Логическая группировка**

- `RequestUser` находится рядом с другими типами аутентификации
- Легче найти все типы, связанные с аутентификацией
- Улучшена организация кода

### ✅ **Упрощение Core Module**

- `core/types.ts` содержит только действительно общие типы
- Меньше ответственности у core модуля
- Более четкое разделение ответственности

### ✅ **Лучшая инкапсуляция**

- Auth модуль содержит все типы, необходимые для аутентификации
- Включая Express типы, которые используются в auth middleware
- Самодостаточность модуля

### ✅ **Упрощенная навигация**

- Разработчик знает, что все типы аутентификации в auth модуле
- Включая типы для Express middleware
- Логическая связь между типами

## Принципы, которыми руководствовались

### 1. **Принцип близости**

Типы размещаются рядом с кодом, который их использует функционально.

### 2. **Принцип ответственности**

Каждый модуль отвечает за свои типы, включая связанные с ними глобальные объявления.

### 3. **Принцип инкапсуляции**

Auth модуль содержит все необходимое для работы с аутентификацией.

## Влияние на другие модули

### Модули, использующие RequestUser:

- **Notifications Controller** - для получения пользователя из запроса
- **Monitoring Controller** - для получения пользователя из запроса
- **Auth Middleware** - для типизации пользователя в req.user

### Обновленные импорты:

- ✅ `src/modules/notifications/notifications.controller.ts`
- ✅ `src/modules/monitoring/monitoring.controller.ts`
- ✅ `src/modules/auth/auth.middleware.ts`

## Тестирование

### Результаты тестов:

- **Все тесты проходят:** 70/70 ✅
- **Нет ошибок компиляции:** ✅
- **Функциональность сохранена:** ✅

## Рекомендации

### Для дальнейшего развития:

1. **Следуйте принципу близости** - размещайте типы в соответствующих модулях
2. **Группируйте связанные типы** - включая глобальные объявления
3. **Документируйте изменения** - при переносе типов между модулями
4. **Обновляйте импорты** - во всех зависимых файлах

### Для поддержки:

1. **Проверяйте импорты** - при добавлении новых типов
2. **Следите за зависимостями** - между модулями
3. **Тестируйте изменения** - после переноса типов
4. **Обновляйте документацию** - при изменении структуры

## Заключение

Перенос `RequestUser` в auth модуль улучшил организацию кода:

- **Лучшая логическая группировка** - типы аутентификации в одном месте
- **Упрощение core модуля** - только действительно общие типы
- **Улучшенная инкапсуляция** - auth модуль самодостаточен
- **Сохранена функциональность** - все тесты проходят

Это изменение соответствует принципам модульной архитектуры и улучшает структуру проекта.

