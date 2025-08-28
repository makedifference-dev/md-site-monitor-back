# Перераспределение типов по модулям

## Обзор

Проведена реорганизация типов из `core/types.ts` с целью более грамотного распределения их по соответствующим бизнес-модулям.

## Проблема

Изначально в `src/modules/core/types.ts` были собраны все типы, включая те, которые относятся к конкретным модулям:

```typescript
// core/types.ts - ПРОБЛЕМА
export interface HealthCheck { ... }        // → относится к health модулю
export interface NotificationConfig { ... } // → относится к notifications модулю
export interface TelegramBotConfig { ... }  // → относится к telegram модулю
export interface TelegramUser { ... }       // → относится к telegram модулю
export interface TelegramNotification { ... } // → относится к telegram модулю
export interface PaginationInfo { ... }     // → общий тип (правильно в core)
export interface ApiResponse<T> { ... }     // → УДАЛЕН (не использовался в коде)
export interface RequestUser { ... }        // → относится к auth модулю
```

## Решение

### 1. Оставлены в Core только действительно общие типы

**`src/modules/core/types.ts`** - теперь содержит только типы, используемые во всем приложении:

```typescript
// Общие типы для переиспользования между модулями
export interface PaginationInfo {
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Shared API utility types
// УДАЛЕНО - не использовался в коде

// Express types - перенесены в auth.types.ts
```

### 2. Специфичные типы перенесены в соответствующие модули

#### 🔍 Health Module (`src/modules/health/health.types.ts`)

```typescript
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  responseTime?: number;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  checks: {
    database: HealthCheck;
    memory: HealthCheck;
    disk: HealthCheck;
  };
  uptime: number;
  version: string;
  environment: string;
}
```

#### 📧 Notifications Module (`src/modules/notifications/notifications.types.ts`)

```typescript
import type { ApiResponse } from '../core/types';

export interface NotificationConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SiteDownNotification {
  projectId: string;
  projectName: string;
  websiteUrl: string;
  userEmail: string;
  userName: string;
  errorMessage: string;
  failedAt: Date;
}

export interface NotificationRequest {
  type: 'email' | 'telegram';
  recipient: string;
  subject: string;
  message: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface NotificationResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// API Response types
export type CreateNotificationResponse = ApiResponse<NotificationResponse>;
export type GetNotificationConfigResponse = ApiResponse<NotificationConfig>;
export type UpdateNotificationConfigResponse = ApiResponse<NotificationConfig>;
```

#### 🔐 Auth Module (`src/modules/auth/auth.types.ts`)

```typescript
import type { User } from '@prisma/client';
import type { ApiResponse } from '../core/types';

// Express types
export type RequestUser = Omit<User, 'password'>;

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export type UserResponse = Omit<User, 'password'>;

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}
```

#### 🤖 Telegram Module (`src/modules/telegram/telegram.types.ts`)

```typescript
import type { ApiResponse } from '../core/types';

export interface TelegramBotConfig {
  token: string;
  webhookUrl?: string;
}

export interface TelegramUser {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
}

export interface TelegramNotification {
  chatId: number;
  message: string;
  parseMode?: 'HTML' | 'Markdown';
  disableWebPagePreview?: boolean;
}

export interface TelegramLinkRequest {
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
}

export interface TelegramLinkResponse {
  success: boolean;
  message: string;
}

// API Response types
export type LinkTelegramAccountResponse = ApiResponse<TelegramLinkResponse>;
export type UnlinkTelegramAccountResponse = ApiResponse<{ success: boolean }>;
export type GetTelegramStatusResponse = ApiResponse<{
  linked: boolean;
  telegramId?: number;
}>;
```

## Принципы перераспределения

### 1. **Принцип близости**

Типы размещаются в том модуле, к которому они относятся функционально.

### 2. **Принцип инкапсуляции**

Каждый модуль содержит все типы, необходимые для его работы.

### 3. **Принцип переиспользования**

Общие типы остаются в `core/types.ts` для использования во всех модулях.

### 4. **Принцип зависимости**

Модули могут импортировать общие типы из `core/types.ts`, но не друг друга.

## Преимущества нового подхода

### ✅ **Лучшая организация**

- Типы находятся рядом с кодом, который их использует
- Легче найти нужные типы
- Проще понять, какие типы относятся к какому модулю

### ✅ **Улучшенная инкапсуляция**

- Каждый модуль самодостаточен в плане типов
- Меньше зависимостей между модулями
- Легче рефакторить отдельные модули

### ✅ **Упрощенная навигация**

- Разработчик сразу понимает, где искать типы
- Нет необходимости искать в общем файле
- Лучшая структура проекта

### ✅ **Масштабируемость**

- Легко добавлять новые типы в соответствующие модули
- Нет риска загромождения общего файла типов
- Простое управление зависимостями

## Миграция импортов

### Обновленные импорты:

#### Auth Module:

```typescript
// RequestUser теперь определен в auth.types.ts
// Никаких изменений в импортах не требуется
```

#### Health Module:

```typescript
// Было
import type { HealthCheck } from '../core/types';

// Стало
import type { HealthCheck } from './health.types';
```

#### Notifications Module:

```typescript
// Было
import type { NotificationConfig } from '../core/types';

// Стало
import type { NotificationConfig } from './notifications.types';
```

#### Telegram Module:

```typescript
// Было
import type {
  TelegramBotConfig,
  TelegramUser,
  TelegramNotification,
} from '../core/types';

// Стало
import type {
  TelegramBotConfig,
  TelegramUser,
  TelegramNotification,
} from './telegram.types';
```

### Сохраненные импорты из Core:

```typescript
// Эти импорты остались без изменений
import type { PaginationInfo } from '../core/core.types';

// RequestUser теперь импортируется из auth модуля
import type { RequestUser } from '../auth/auth.types';

// ApiResponse больше не используется - удален из всех модулей
```

## Структура типов после реорганизации

```
src/modules/
├── core/
│   └── core.types.ts               # Общие типы (PaginationInfo)
├── auth/
│   ├── auth.types.ts               # Auth-specific types (RequestUser, etc.)
│   └── auth.service.ts
├── health/
│   ├── health.types.ts             # HealthCheck, HealthStatus
│   └── health.service.ts
├── notifications/
│   ├── notifications.types.ts      # NotificationConfig, EmailNotification, etc.
│   └── notifications.service.ts
├── telegram/
│   ├── telegram.types.ts           # TelegramBotConfig, TelegramUser, etc.
│   └── telegram.service.ts

├── projects/
│   ├── projects.types.ts           # Project-specific types
│   └── projects.service.ts
└── monitoring/
    ├── monitoring.types.ts         # Monitoring-specific types
    └── monitoring.service.ts
```

## Рекомендации

### Для дальнейшего развития:

1. **Следуйте принципу близости** - размещайте типы в соответствующих модулях
2. **Используйте общие типы из core** - для переиспользуемых интерфейсов
3. **Документируйте сложные типы** - добавляйте комментарии к интерфейсам
4. **Избегайте циклических зависимостей** - модули не должны импортировать типы друг друга
5. **Группируйте связанные типы** - в одном файле типов модуля

### Для поддержки:

1. **Регулярно анализируйте типы** - проверяйте, не появились ли новые общие типы
2. **Следите за дублированием** - избегайте создания одинаковых типов в разных модулях
3. **Обновляйте документацию** - при изменении структуры типов
4. **Тестируйте импорты** - убеждайтесь, что все импорты работают корректно

## Заключение

Перераспределение типов по модулям значительно улучшило организацию кода:

- **Улучшена структура** - типы находятся рядом с соответствующим кодом
- **Упрощена навигация** - легче найти нужные типы
- **Улучшена инкапсуляция** - каждый модуль самодостаточен
- **Сохранена функциональность** - все тесты проходят
- **Готовность к масштабированию** - легко добавлять новые типы

Новая структура типов обеспечивает лучшую организацию кода и упрощает дальнейшую разработку и поддержку проекта.
