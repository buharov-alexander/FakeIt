export const GAME_PHASES = {
  LOBBY: 'lobby',
  PLAYING: 'playing',
  ANSWERING: 'answering', 
  VOTING: 'voting',
  REVEAL: 'reveal',
  FINISHED: 'finished'
} as const;

export type GamePhase = typeof GAME_PHASES[keyof typeof GAME_PHASES];
