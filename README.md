# Fibbage - Игра на блеф для друзей

Многопользовательская игра в стиле Fibbage с реальным временем, написанная на Next.js и Socket.io.

## Структура проекта

```
fibbage/
├── client/                 # Next.js фронтенд
│   ├── src/
│   │   ├── app/           # Страницы Next.js
│   │   ├── components/    # React компоненты
│   │   └── lib/           # Утилиты и socket клиент
│   ├── package.json       # Зависимости клиента
│   └── tsconfig.json      # TypeScript конфигурация
├── server/                 # Express + Socket.io бэкенд
│   ├── src/
│   │   ├── data/          # Вопросы и данные
│   │   ├── types/         # TypeScript типы
│   │   ├── utils/         # Утилиты
│   │   ├── room-store.ts  # Хранилище комнат
│   │   ├── game-engine.ts # Игровая логика
│   │   └── index.ts       # Точка входа сервера
│   └── package.json       # Зависимости сервера
├── .gitignore              # Игнорируемые файлы
└── package.json           # Корневые скрипты
```

## Запуск проекта

### Быстрый старт (оба процесса)

```bash
npm install
npm run dev
```

这将同时启动:
- Сервер на http://localhost:3001
- Клиент на http://localhost:3000

### Отдельный запуск

#### Сервер
```bash
cd server
npm install
npm run dev
```

#### Клиент
```bash
cd client
npm install
npm run dev
```

## Технологии

### Фронтенд
- **Next.js 16** - React фреймворк
- **TypeScript** - Типизация
- **Tailwind CSS** - Стили
- **Socket.io Client** - WebSocket клиент

### Бэкенд
- **Express** - HTTP сервер
- **Socket.io** - Real-time коммуникация
- **TypeScript** - Типизация
- **In-memory storage** - Хранение комнат в памяти

## Игровые механики

1. **Создание комнаты** - Хост создает комнату с уникальным кодом
2. **Присоединение** - Игроки присоединяются по коду
3. **Раунды** - 5 раундов с вопросами
4. **Ответы** - Игроки пишут ложные ответы
5. **Голосование** - Игроки угадывают правильный ответ
6. **Очки** - Начисление за правильные ответы и обман

## API события

### Клиент → Сервер
- `room:create` - Создание комнаты
- `room:join` - Присоединение к комнате
- `game:start` - Начало игры
- `round:answer_submit` - Отправка ответа
- `round:vote_submit` - Отправка голоса

### Сервер → Клиент
- `room:update` - Обновление комнаты
- `game:start` - Начало игры
- `round:question` - Новый вопрос
- `round:voting_start` - Начало голосования
- `round:results` - Результаты раунда
- `game:end` - Конец игры

## Разработка

### Добавление вопросов

Вопросы хранятся в `server/src/data/questions.json`:

```json
[
  {
    "id": "q1",
    "text": "Самая высокая гора в мире — это _____",
    "answer": "Эверест"
  }
]
```

### Настройка игры

Настройки в `server/src/room-store.ts`:
- `maxPlayers` - Макс. игроков (2-8)
- `roundCount` - Количество раундов
- `answerTimerSec` - Время на ответ
- `voteTimerSec` - Время на голосование

## Лицензия

MIT
