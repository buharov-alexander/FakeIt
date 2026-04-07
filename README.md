# FakeIt - Игра на блеф для друзей
[![Playwright Tests](https://github.com/buharov-alexander/FakeIt/actions/workflows/playwright.yml/badge.svg)](https://github.com/buharov-alexander/FakeIt/actions/workflows/playwright.yml)

Многопользовательская игра в стиле FakeIt с реальным временем, написанная на Next.js и Socket.io.

## Структура проекта

```
fakeit/
├── client/                 # Next.js фронтенд
│   ├── src/
│   │   ├── app/           # Next.js App Router страницы
│   │   │   ├── page.tsx   # Главная страница
│   │   │   ├── layout.tsx # Корневой layout
│   │   │   ├── globals.css # Глобальные стили
│   │   │   └── room/      # Страницы комнат
│   │   │       └── [code]/ # Динамические страницы комнат
│   │   ├── components/    # React компоненты
│   │   │   ├── Lobby.tsx  # Лобби комнаты
│   │   │   ├── GameScreen.tsx # Игровой экран
│   │   │   ├── VotingScreen.tsx # Экран голосования
│   │   │   └── ResultsScreen.tsx # Экран результатов
│   │   ├── hooks/         # React хуки
│   │   │   └── useRoom.ts # Хук для управления комнатой
│   │   ├── lib/           # Утилиты и клиенты
│   │   │   └── socket-client.ts # Socket.io клиент
│   │   └── types/         # TypeScript типы
│   │       └── game.types.ts # Общие типы игры
│   ├── Dockerfile         # Docker конфигурация
│   ├── next.config.js     # Next.js конфигурация
│   ├── tailwind.config.js # Tailwind CSS конфигурация
│   ├── postcss.config.mjs # PostCSS конфигурация
│   └── package.json       # Зависимости клиента
├── server/                 # Express + Socket.io бэкенд
│   ├── src/
│   │   ├── data/          # Игровые данные
│   │   │   └── questions.json # База вопросов
│   │   ├── types/         # TypeScript типы
│   │   │   └── game.types.ts # Типы событий и сущностей
│   │   ├── room-store.ts  # Хранилище комнат в памяти
│   │   ├── game-engine.ts # Игровая логика и состояния
│   │   └── index.ts       # Точка входа сервера
│   ├── Dockerfile         # Docker конфигурация
│   └── package.json       # Зависимости сервера
├── docker-compose.yml     # Docker Compose конфигурация
├── .gitignore              # Игнорируемые файлы
└── package.json           # Корневые скрипты
```

## Быстрый запуск

### Локальная разработка

```bash
npm install
npm run dev
```

Запустит:
- Сервер на http://localhost:3001
- Клиент на http://localhost:3000

### Docker развертывание

```bash
docker-compose up
```

Запустит:
- Клиент на http://localhost:3000
- Сервер на http://localhost:3001
- Health checks для обоих сервисов

## Технологии

### Фронтенд (Next.js)
- **Next.js 16** с App Router
- **TypeScript** для типизации
- **Tailwind CSS v4** для стилей
- **Socket.io Client** для real-time коммуникации
- **React Hooks** для управления состоянием

### Бэкенд (Express)
- **Express** HTTP сервер
- **Socket.io** WebSocket сервер
- **TypeScript** для типизации
- **In-memory storage** для комнат
- **Health endpoints** для Docker

## API события Socket.io

### Клиент → Сервер
- `room:create` - Создание новой комнаты
- `room:join` - Присоединение к комнате
- `game:start` - Начало игры
- `game:next_round` - Следующий раунд
- `round:answer_submit` - Отправка ответа на вопрос
- `round:vote_submit` - Отправка голоса

### Сервер → Клиент
- `room:update` - Обновление состояния комнаты
- `room:created` - Комната создана с реальным кодом
- `game:start` - Начало игры
- `round:question` - Новый вопрос раунда
- `round:voting_start` - Начало голосования
- `round:results` - Результаты раунда
- `game:end` - Конец игры
- `player:disconnect` - Игрок отключился
- `error` - Ошибка сервера

## Игровой процесс

1. **Создание комнаты** - Хост создает комнату, получает уникальный код
2. **Присоединение игроков** - Другие игроки вводят код для входа
3. **Начало игры** - Минимум 2 игрока для старта
4. **Раунды ответов** - Игроки пишут правдивый и ложные ответы
5. **Голосование** - Все голосуют за правильный ответ
6. **Подсчет очков** - Очки за угадывание и успешный обман
7. **Победитель** - Игрок с максимальным счетом

## Docker скрипты

### Клиент
```bash
npm run docker:build  # Собрать образ
npm run docker:run    # Запустить контейнер
npm run docker:stop   # Остановить контейнер
```

### Сервер
```bash
npm run docker:build  # Собрать образ
npm run docker:run    # Запустить контейнер
npm run docker:stop   # Остановить контейнер
```

## Лицензия

MIT
