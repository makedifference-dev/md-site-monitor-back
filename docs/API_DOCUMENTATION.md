# MD Site Monitor API Documentation

## 📚 Swagger UI

Полная интерактивная документация доступна по адресу: **http://localhost:3000/api-docs**

## 🔐 Авторизация

Все защищенные эндпоинты требуют JWT токен в заголовке `Authorization: Bearer <token>`

### Получение токена

```bash
# Регистрация
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "fullName": "Иван Иванов"
  }'

# Вход
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

## 📋 Все доступные эндпоинты

### 🔐 Авторизация (`/auth`)

| Метод | Endpoint | Описание | Авторизация |
|-------|----------|----------|-------------|
| POST | `/auth/register` | Регистрация пользователя | ❌ |
| POST | `/auth/login` | Вход пользователя | ❌ |
| POST | `/auth/refresh` | Обновление токена | ❌ |
| POST | `/auth/logout` | Выход пользователя | ❌ |
| GET | `/auth/profile` | Получение профиля | ✅ |
| POST | `/auth/logout-all` | Выход со всех устройств | ✅ |

### 📊 Проекты (`/projects`)

| Метод | Endpoint | Описание | Авторизация |
|-------|----------|----------|-------------|
| POST | `/projects` | Создание проекта | ✅ |
| GET | `/projects` | Список проектов пользователя | ✅ |
| GET | `/projects/{projectId}` | Получение проекта по ID | ✅ |
| PUT | `/projects/{projectId}` | Обновление названия проекта | ✅ |
| DELETE | `/projects/{projectId}` | Деактивация проекта | ✅ |

### 🔍 Мониторинг (`/monitoring`)

| Метод | Endpoint | Описание | Авторизация |
|-------|----------|----------|-------------|
| GET | `/monitoring/stats` | Статистика мониторинга (только админы) | ✅ |
| GET | `/monitoring/projects/{projectId}/history` | История проверок проекта | ✅ |
| POST | `/monitoring/projects/{projectId}/check` | Ручная проверка сайта | ✅ |

### 📧 Уведомления (`/notifications`)

| Метод | Endpoint | Описание | Авторизация |
|-------|----------|----------|-------------|
| POST | `/notifications/test-email` | Тестовая отправка email (только админы) | ✅ |

### ℹ️ Информация (`/`)

| Метод | Endpoint | Описание | Авторизация |
|-------|----------|----------|-------------|
| GET | `/` | Информация о API | ❌ |

### 📖 Документация

| Метод | Endpoint | Описание | Авторизация |
|-------|----------|----------|-------------|
| GET | `/api-docs` | Swagger UI | ❌ |
| GET | `/api-docs/json` | OpenAPI спецификация | ❌ |

## 📊 Примеры использования

### Создание проекта

```bash
curl -X POST http://localhost:3000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "My Website",
    "websiteUrl": "https://example.com"
  }'
```

### Получение статистики мониторинга

```bash
curl -X GET http://localhost:3000/monitoring/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Ручная проверка сайта

```bash
curl -X POST http://localhost:3000/monitoring/projects/PROJECT_ID/check \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### История проверок проекта

```bash
curl -X GET "http://localhost:3000/monitoring/projects/PROJECT_ID/history?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔒 Безопасность

- Все защищенные эндпоинты требуют валидный JWT токен
- Токены имеют ограниченное время жизни
- Поддерживается refresh token для обновления доступа
- Пароли хешируются с использованием bcrypt

## 📈 Мониторинг

Система автоматически проверяет все активные проекты каждые 10 минут:

- **HTTP статус** - проверка доступности сайта
- **Время ответа** - измерение скорости загрузки
- **SSL сертификат** - проверка валидности и срока действия
- **Обработка ошибок** - логирование всех проблем

## 📧 Уведомления

Система автоматически отправляет уведомления при обнаружении проблем:

- **Первая неудачная проверка** - уведомление отправляется только при первой подряд неудачной проверке
- **Email уведомления** - содержат информацию о проекте, ошибке и времени обнаружения
- **Telegram уведомления** - мгновенные уведомления в Telegram боте
- **Настраиваемые SMTP** - поддержка различных SMTP серверов через переменные окружения
- **HTML и текстовые письма** - красивые HTML письма с текстовой версией

### Настройка SMTP

Добавьте в `.env` файл:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@mdsitemonitor.com
FROM_NAME=MD Site Monitor
```

### Настройка Telegram Bot

1. **Создайте бота** через [@BotFather](https://t.me/botfather) в Telegram
2. **Получите токен** бота
3. **Добавьте в `.env` файл:**

```bash
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

### Использование Telegram Bot

1. **Найдите бота** по имени или ссылке
2. **Отправьте команду** `/start` для начала работы
3. **Привяжите аккаунт** командой `/link your@email.com`
4. **Получайте уведомления** автоматически при проблемах с сайтами

**Доступные команды:**
- `/start` - Начать работу с ботом
- `/link <email>` - Привязать аккаунт к Telegram
- `/unlink` - Отвязать аккаунт от Telegram
- `/status` - Проверить статус привязки
- `/help` - Показать справку

## 🛠️ Разработка

### Добавление нового эндпоинта

1. Создайте контроллер и сервис в соответствующем модуле
2. Добавьте роут в модуль
3. Создайте документацию в `*.docs.ts` файле
4. Обновите конфигурацию Swagger в `docs.config.ts`

### Структура документации

```typescript
// В *.docs.ts файле
export const moduleDocs = {
  'METHOD /path': generateEndpointDoc(
    '/path',
    'method',
    'Description',
    'Tag',
    requestSchema,
    responseSchema,
    requiresAuth
  ),
};

export const moduleSchemas = {
  SchemaName: generateSchemaFromInterface(example),
};
```

## 📝 Запомнить на будущее

✅ **ВСЕГДА создавать документацию** для новых эндпоинтов  
✅ **Использовать generateEndpointDoc** для единообразия  
✅ **Добавлять схемы** в moduleSchemas  
✅ **Обновлять docs.config.ts** при добавлении новых модулей  
✅ **Тестировать документацию** через Swagger UI  
✅ **Использовать английский язык** в описаниях  
✅ **Указывать авторизацию** для защищенных эндпоинтов  
✅ **Добавлять примеры** в схемы данных
