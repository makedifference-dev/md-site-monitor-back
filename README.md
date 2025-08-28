# MD Site Monitor Backend

Backend API для системы авторизации и управления пользователями.

## 🚀 Технологии

- **Node.js** v24.6.0
- **Express.js** v5.x
- **TypeScript** v5.x
- **Prisma** v6.x - ORM для работы с базой данных
- **PostgreSQL** - основная база данных
- **bcryptjs** - хеширование паролей
- **jsonwebtoken** - JWT токены для авторизации
- **Swagger/OpenAPI 3.0** - автоматическая документация API
- **ESLint** + **Prettier** - линтинг и форматирование кода

## 📋 Требования

- Node.js >= 18.18
- PostgreSQL >= 12
- npm >= 9

## 🛠️ Установка и настройка

### 1. Клонирование и установка зависимостей

```bash
git clone <repository-url>
cd md-site-monitor-back
npm install
```

### 2. Настройка базы данных

1. Создайте базу данных PostgreSQL:
```sql
CREATE DATABASE md_site_monitor;
```

2. Скопируйте файл переменных окружения:
```bash
cp env.example .env
```

3. Настройте переменные в `.env`:
```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/md_site_monitor?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Password Configuration
BCRYPT_ROUNDS=12
```

### 3. Инициализация базы данных

```bash
# Генерация Prisma клиента
npx prisma generate

# Применение миграций
npx prisma migrate dev --name init

# (Опционально) Заполнение тестовыми данными
npx prisma db seed
```

### 4. Запуск приложения

```bash
# Разработка
npm run dev

# Продакшн
npm run build
npm start
```

## 📚 API Endpoints

### 🔐 Авторизация (`/auth`)

| Метод | Endpoint | Описание | Авторизация |
|-------|----------|----------|-------------|
| POST | `/auth/register` | Регистрация пользователя | ❌ |
| POST | `/auth/login` | Вход пользователя | ❌ |
| POST | `/auth/refresh` | Обновление токена | ❌ |
| POST | `/auth/logout` | Выход пользователя | ❌ |
| GET | `/auth/profile` | Получение профиля | ✅ |
| POST | `/auth/logout-all` | Выход со всех устройств | ✅ |

### 📊 Основные endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/` | Информация о API |
| GET | `/api-docs` | Swagger UI документация |
| GET | `/api-docs/json` | OpenAPI спецификация |

## 🔐 Авторизация

### Регистрация пользователя

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "username",
    "password": "password123",
    "firstName": "Иван",
    "lastName": "Иванов"
  }'
```

### Вход пользователя

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Использование токена

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🏗️ Архитектура проекта

```
src/
├── modules/           # Бизнес-модули
│   ├── auth/         # Модуль авторизации
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.middleware.ts
│   │   └── auth.module.ts
│   ├── api-info/     # Информация о API
│   └── docs/         # Документация
├── decorators/       # Декораторы для документации
├── utils/           # Утилиты
└── app.ts          # Главный файл приложения
```

## 🗄️ База данных

### Модели Prisma

- **User** - пользователи системы
- **RefreshToken** - токены обновления

### Миграции

```bash
# Создание новой миграции
npx prisma migrate dev --name migration_name

# Применение миграций в продакшне
npx prisma migrate deploy

# Сброс базы данных (только для разработки)
npx prisma migrate reset
```

## 🛠️ Разработка

### Скрипты

```bash
# Запуск в режиме разработки
npm run dev

# Сборка проекта
npm run build

# Запуск в продакшне
npm start

# Линтинг
npm run lint
npm run lint:fix

# Форматирование
npm run format
npm run format:check

# Проверка кода
npm run code:check
npm run code:fix
```

### Работа с базой данных

```bash
# Открыть Prisma Studio
npx prisma studio

# Просмотр схемы
npx prisma format

# Валидация схемы
npx prisma validate
```

## 📖 Документация

- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI Spec**: http://localhost:3000/api-docs/json
- **Prisma Docs**: https://www.prisma.io/docs/

## 🔒 Безопасность

- Хеширование паролей с bcrypt
- JWT токены с refresh механизмом
- Валидация входных данных
- CORS настройки
- Helmet для безопасности HTTP заголовков

## 🚀 Планы развития

- [ ] Расширенная система ролей и разрешений
- [ ] Двухфакторная аутентификация (2FA)
- [ ] Социальная авторизация (OAuth)
- [ ] Управление сессиями
- [ ] Логирование действий пользователей
- [ ] API для управления пользователями
- [ ] Docker контейнеризация
- [ ] CI/CD pipeline
