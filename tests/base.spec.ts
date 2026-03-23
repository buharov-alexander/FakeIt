import { test, expect, type Page, type Browser } from '@playwright/test';

test.describe('Base tests', () => {
  test('Test calculate score', async ({ browser }: { browser: Browser }) => {
    // Создаем два браузера для двух игроков
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Игрок 1 создает комнату
    await page1.goto('http://localhost:3000');
    await page1.fill('input[placeholder*="Введите никнейм"]', 'Игрок1');
    await page1.click('button:has-text("Создать игру")');
    
    // Ждем загрузки лобби
    await page1.waitForSelector('text=Код комнаты:');
    
    // Ищем код комнаты - ищем элемент после текста "Код комнаты:"
    let roomCode = '';
    
    // Способ 1: ищем sibling элемент после текста
    try {
      const codeElement1 = await page1.locator('text=Код комнаты:').locator('..').locator('span, div, code, [class*="font-mono"], [class*="font-bold"]').first();
      const text1 = await codeElement1.textContent();
      if (text1 && text1 !== 'Код комнаты:') {
        roomCode = text1.trim();
      }
    } catch (e) {
      console.log('Способ 1 не сработал:', e);
    }
    
    // Способ 2: ищем все элементы с моно-шрифтом и берем тот, что похож на код комнаты
    if (!roomCode) {
      try {
        const monoElements = await page1.locator('[class*="font-mono"]').all();
        for (const element of monoElements) {
          const text = await element.textContent();
          if (text && /^[A-Z0-9]{6}$/.test(text.trim())) {
            roomCode = text.trim();
            break;
          }
        }
      } catch (e) {
        console.log('Способ 2 не сработал:', e);
      }
    }
    
    console.log('Найденный код комнаты:', roomCode);
    console.log('Длина кода:', roomCode.length);
    
    expect(roomCode).toBeTruthy();
    expect(roomCode.length).toBe(6);
    
    // Игрок 2 присоединяется к комнате
    await page2.goto('http://localhost:3000');
    await page2.fill('input[placeholder*="Введите никнейм"]', 'Игрок2');
    await page2.fill('#roomCode', roomCode);
    await page2.click('button:has-text("Присоединиться")');
    
    // Ждем подключения обоих игроков
    await page1.waitForSelector('text=Игроки (2/8)');
    await page2.waitForSelector('text=Ожидание начала игры от хоста...');
    
    // Начинаем игру
    await page1.click('button:has-text("Начать игру")');
    
    // === РАУНД 1 ===
    
    // Ждем этапа ответов
    await page1.waitForSelector('text=Придумайте ложный ответ');
    await page2.waitForSelector('text=Придумайте ложный ответ');
    
    // Игрок 1 отправляет ответ
    await page1.fill('textarea[placeholder*="Введите ваш выдуманный ответ"]', 'Ответ Игрока1 Раунд1');
    await page1.click('button:has-text("Отправить ответ")');
    
    // Игрок 2 отправляет ответ
    await page2.fill('textarea[placeholder*="Введите ваш выдуманный ответ"]', 'Ответ Игрока2 Раунд1');
    await page2.click('button:has-text("Отправить ответ")');
    
    // Ждем этапа голосования
    await page1.waitForSelector('text=Выберите правильный ответ');
    await page2.waitForSelector('text=Выберите правильный ответ');
    
    // Отладка: получаем все кнопки ответов
    const allButtons1 = await page1.locator('button').all();
    const allButtons2 = await page2.locator('button').all();
    
    console.log('Количество кнопок на странице 1:', allButtons1.length);
    console.log('Количество кнопок на странице 2:', allButtons2.length);
    
    // Выводим текст всех кнопок для отладки
    for (let i = 0; i < allButtons2.length; i++) {
      const buttonText = await allButtons2[i].textContent();
      console.log(`Кнопка ${i} на странице 2:`, buttonText);
    }
    
    // Игрок 1 выбирает ответ Игрока2 (неправильный)
    const player2AnswerButton1 = await page1.locator('button').filter({ hasText: 'ответ игрока2 раунд1' }).first();
    await expect(player2AnswerButton1).toBeVisible();
    await player2AnswerButton1.click();
    await page1.click('button:has-text("Проголосовать")');
    
    // Игрок 2 выбирает правильный ответ (ищем кнопку которая НЕ содержит "ответ игрока2 раунд1" И "Ответ Игрока1 Раунд1")
    const allPlayer2Buttons = await page2.locator('button').all();
    let correctAnswerButton2 = null;
    
    for (const button of allPlayer2Buttons) {
      const buttonText = await button.textContent();
      if (buttonText && 
          !buttonText.includes('ответ игрока2 раунд1') && 
          !buttonText.includes('ответ игрока1 раунд1')) {
        correctAnswerButton2 = button;
        break;
      }
    }
    
    expect(correctAnswerButton2).toBeTruthy();
    await correctAnswerButton2!.click();
    await page2.click('button:has-text("Проголосовать")');
    
    // Ждем результатов раунда 1
    await page1.waitForSelector('text=Результаты раунда 1');
    await page2.waitForSelector('text=Результаты раунда 1');
    
    // Проверяем очки после раунда 1
    // Игрок1 должен получить 0 очков (выбрал неправильный ответ)
    // Игрок2 должен получить 1500 очков (1000 за правильный + 500 за то что Игрок1 выбрал его ответ)
    
    const player1Score1 = await getPlayerScore(page1, 'Игрок1');
    const player2Score1 = await getPlayerScore(page2, 'Игрок2');
    
    console.log('После раунда 1 - Игрок1:', player1Score1, 'Игрок2:', player2Score1);
    
    expect(player1Score1).toBe(0);
    expect(player2Score1).toBe(1500);
    
    // Переходим к следующему раунду
    await page1.click('button:has-text("Следующий раунд")');
    
    // === РАУНД 2 ===
    
    // Ждем этапа ответов
    await page1.waitForSelector('text=Придумайте ложный ответ');
    await page2.waitForSelector('text=Придумайте ложный ответ');
    
    // Игрок 1 отправляет ответ
    await page1.fill('textarea[placeholder*="Введите ваш выдуманный ответ"]', 'Ответ Игрока1 Раунд2');
    await page1.click('button:has-text("Отправить ответ")');
    
    // Игрок 2 отправляет ответ
    await page2.fill('textarea[placeholder*="Введите ваш выдуманный ответ"]', 'Ответ Игрока2 Раунд2');
    await page2.click('button:has-text("Отправить ответ")');
    
    // Ждем этапа голосования
    await page1.waitForSelector('text=Выберите правильный ответ');
    await page2.waitForSelector('text=Выберите правильный ответ');
    
    // Игрок 1 выбирает правильный ответ (ищем кнопку которая НЕ содержит "Ответ Игрока1 Раунд2" И "Ответ Игрока2 Раунд2")
    const allPlayer1Buttons = await page1.locator('button').all();
    let correctAnswerButton1 = null;
    
    for (const button of allPlayer1Buttons) {
      const buttonText = await button.textContent();
      if (buttonText && 
          !buttonText.includes('ответ игрока1 раунд2') && 
          !buttonText.includes('ответ игрока2 раунд2')) {
        correctAnswerButton1 = button;
        break;
      }
    }
    
    expect(correctAnswerButton1).toBeTruthy();
    await correctAnswerButton1!.click();
    await page1.click('button:has-text("Проголосовать")');
    
    // Игрок 2 выбирает ответ Игрока1 (неправильный)
    const player1AnswerButton2 = await page2.locator('button').filter({ hasText: 'ответ игрока1 раунд2' }).first();
    await expect(player1AnswerButton2).toBeVisible();
    await player1AnswerButton2.click();
    await page2.click('button:has-text("Проголосовать")');
    
    // Ждем результатов раунда 2
    await page1.waitForSelector('text=Результаты раунда 2');
    await page2.waitForSelector('text=Результаты раунда 2');
    
    // Проверяем итоговые очки
    // Игрок1 должен получить 1500 очков (1000 за правильный ответ во 2 раунде)
    // Игрок2 должен получить 1500 очков (500 за то что Игрок1 выбрал его ответ в 1 раунде)
    
    const player1Score2 = await getPlayerScore(page1, 'Игрок1');
    const player2Score2 = await getPlayerScore(page2, 'Игрок2');
    
    console.log('После раунда 2 - Игрок1:', player1Score2, 'Игрок2:', player2Score2);
    
    expect(player1Score2).toBe(1500);
    expect(player2Score2).toBe(1500);
    
    // Закрываем контексты
    await context1.close();
    await context2.close();
  });
  
  test('Test forbid voting for own answer', async ({ browser }: { browser: Browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Игрок 1 создает комнату
    await page1.goto('http://localhost:3000');
    await page1.fill('input[placeholder*="Введите никнейм"]', 'Игрок1');
    await page1.click('button:has-text("Создать игру")');
    
    await page1.waitForSelector('text=Код комнаты:');
    
    // Ищем код комнаты теми же способами что и в основном тесте
    let roomCode = '';
    
    try {
      const codeElement1 = await page1.locator('text=Код комнаты:').locator('..').locator('span, div, code, [class*="font-mono"], [class*="font-bold"]').first();
      const text1 = await codeElement1.textContent();
      if (text1 && text1 !== 'Код комнаты:') {
        roomCode = text1.trim();
      }
    } catch (e) {
      console.log('Способ 1 не сработал:', e);
    }
    
    if (!roomCode) {
      try {
        const monoElements = await page1.locator('[class*="font-mono"]').all();
        for (const element of monoElements) {
          const text = await element.textContent();
          if (text && /^[A-Z0-9]{6}$/.test(text.trim())) {
            roomCode = text.trim();
            break;
          }
        }
      } catch (e) {
        console.log('Способ 2 не сработал:', e);
      }
    }
    
    expect(roomCode).toBeTruthy();
    expect(roomCode.length).toBe(6);
    
    // Игрок 2 присоединяется
    await page2.goto('http://localhost:3000');
    await page2.fill('input[placeholder*="Введите никнейм"]', 'Игрок2');
    await page2.fill('#roomCode', roomCode);
    await page2.click('button:has-text("Присоединиться")');
    
    await page1.waitForSelector('text=Игроки (2/8)');
    await page1.click('button:has-text("Начать игру")');
    
    // Отправляем ответы
    await page1.waitForSelector('text=Придумайте ложный ответ');
    await page2.waitForSelector('text=Придумайте ложный ответ');
    
    await page1.fill('textarea[placeholder*="Введите ваш выдуманный ответ"]', 'Ответ Игрока1');
    await page1.click('button:has-text("Отправить ответ")');
    
    await page2.fill('textarea[placeholder*="Введите ваш выдуманный ответ"]', 'Ответ Игрока2');
    await page2.click('button:has-text("Отправить ответ")');
    
    // Ждем этапа голосования
    await page1.waitForSelector('text=Выберите правильный ответ');
    await page2.waitForSelector('text=Выберите правильный ответ');
    
    // Проверяем что кнопки своих ответов заблокированы
    const player1OwnAnswer = await page1.locator('button').filter({ hasText: 'ВАШ ОТВЕТ' }).first();
    await expect(player1OwnAnswer).toBeDisabled();
    
    const player2OwnAnswer = await page2.locator('button').filter({ hasText: 'ВАШ ОТВЕТ' }).first();
    await expect(player2OwnAnswer).toBeDisabled();
    
    await context1.close();
    await context2.close();
  });
});

// Вспомогательная функция для получения очков игрока
async function getPlayerScore(page: Page, playerName: string): Promise<number> {
  // Ищем строку с именем игрока и получаем очки
  const scoreRow = await page.locator('text=' + playerName).first();
  const scoreElement = await scoreRow.locator('xpath=../../..').locator('.text-lg.font-bold').first();
  const scoreText = await scoreElement.textContent();
  return parseInt(scoreText || '0');
}
