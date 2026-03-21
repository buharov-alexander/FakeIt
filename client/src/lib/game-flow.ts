import { GamePhase } from '@/types/game.types';

// Определяем правильную последовательность фаз
export const GAME_FLOW_SEQUENCE: GamePhase[] = [
  GamePhase.LOBBY,
  GamePhase.PLAYING,
  GamePhase.ANSWERING,
  GamePhase.VOTING,
  GamePhase.REVEAL,
  GamePhase.FINISHED
];

// Функция для получения следующей фазы
export const getNextPhase = (currentPhase: GamePhase): GamePhase | null => {
  const currentIndex = GAME_FLOW_SEQUENCE.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === GAME_FLOW_SEQUENCE.length - 1) {
    return null;
  }
  return GAME_FLOW_SEQUENCE[currentIndex + 1];
};

// Функция для проверки, можно ли перейти к следующей фазе
export const canTransitionTo = (fromPhase: GamePhase, toPhase: GamePhase): boolean => {
  const fromIndex = GAME_FLOW_SEQUENCE.indexOf(fromPhase);
  const toIndex = GAME_FLOW_SEQUENCE.indexOf(toPhase);
  
  // Можно переходить только вперед в последовательности
  return toIndex === fromIndex + 1;
};

// Функция для получения имени фазы для отображения
export const getPhaseDisplayName = (phase: GamePhase): string => {
  const phaseNames = {
    [GamePhase.LOBBY]: 'Лобби',
    [GamePhase.PLAYING]: 'Игра',
    [GamePhase.ANSWERING]: 'Ввод ответов',
    [GamePhase.VOTING]: 'Голосование',
    [GamePhase.REVEAL]: 'Результаты',
    [GamePhase.FINISHED]: 'Завершено'
  };
  
  return phaseNames[phase] || 'Неизвестная фаза';
};
