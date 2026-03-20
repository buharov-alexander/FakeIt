# Тесты Fibbage Game

Эта папка содержит автоматизированные тесты для игры Fibbage с использованием Playwright.

## Установка

```bash
npm install
npx playwright install
```

## Запуск тестов

### Запуск всех тестов (headless режим)
```bash
npm test
```

### Запуск тестов в видимом режиме
```bash
npm run test:headed
```

### Запуск с UI интерфейсом
```bash
npm run test:ui
```

### Просмотр отчетов
```bash
npm run test:report
```

## Структура теста

```typescript
test.describe('Подсчет очков за несколько раундов', () => {
  test('правильный подсчет очков по сценарию: два раунда, перекрестные голосования', async ({ browser }) => {
    // Создаем два контекста для двух игроков
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    // Игрок 1 создает комнату
    // Игрок 2 присоединяется
    // Проводим 2 раунда с перекрестными голосованиями
    // Проверяем итоговые очки
  });
});
```

## Конфигурация

Файл `playwright.config.ts` содержит настройки:
- Браузеры: Chrome, Firefox, Safari
- Базовый URL: http://localhost:3000
- Автоматический запуск сервера для тестов
- Скриншоты при ошибках
- HTML отчеты

## Отладка

Для отладки тестов можно использовать:
1. `npm run test:headed` - запуск в видимом режиме
2. `npm run test:ui` - запуск с интерактивным интерфейсом
3. `page.pause()` - пауза в коде для ручной проверки

## Добавление новых тестов

Создавайте новые `.spec.ts` файлы в папке `tests/` следуя шаблону:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Новая группа тестов', () => {
  test('название теста', async ({ page }) => {
    // Логика теста
  });
});
```
