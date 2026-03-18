import { GAME_PHASES, GamePhase } from './game-phases';

// Определяем правильную последовательность фаз
export const GAME_FLOW_SEQUENCE: GamePhase[] = [
  GAME_PHASES.LOBBY,
  GAME_PHASES.PLAYING,
  GAME_PHASES.ANSWERING,
  GAME_PHASES.VOTING,
  GAME_PHASES.REVEAL,
  GAME_PHASES.FINISHED
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
    [GAME_PHASES.LOBBY]: 'Лобби',
    [GAME_PHASES.PLAYING]: 'Игра',
    [GAME_PHASES.ANSWERING]: 'Ввод ответов',
    [GAME_PHASES.VOTING]: 'Голосование',
    [GAME_PHASES.REVEAL]: 'Результаты',
    [GAME_PHASES.FINISHED]: 'Завершено'
  };
  
  return phaseNames[phase] || 'Неизвестная фаза';
};
