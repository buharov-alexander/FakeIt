export enum GamePhase {
  LOBBY = 'lobby',
  PLAYING = 'playing',
  FINISHED = 'finished',
  ANSWERING = 'answering',
  VOTING = 'voting',
  REVEAL = 'reveal'
}

// Константы для таймеров
export const TIMER_CONSTANTS = {
  DEFAULT_ANSWER_TIME: 300,    // 5 минут на ответы
  DEFAULT_VOTE_TIME: 300       // 5 минут на голосование
} as const;

export interface Room {
  code: string;           // Уникальный код комнаты (6 символов)
  hostId: string;         // ID хоста
  players: Player[];      // Список игроков
  status: GamePhase;
  settings: GameSettings;
  gameState?: GameState;
}

export interface Player {
  id: string;             // Socket ID
  nickname: string;
  score: number;
  isConnected: boolean;
}

export interface PlayerWithRoundScore extends Player {
  roundScoreChange?: number;  // Изменение очков за текущий раунд
}

export interface GameSettings {
  maxPlayers: number;       // 2–8
  roundCount: number;       // Количество раундов
  answerTimerSec: number;   // Таймер на ответ
  voteTimerSec: number;     // Таймер на голосование
}

export interface GameState {
  currentRound: number;
  question: Question;
  phase: GamePhase;
  answers: Answer[];        // Ответы игроков + правильный
  votes: Vote[];
  timeRemaining?: number;
}

export interface Question {
  id: string;
  text: string;
  answer: string;
}

export interface Answer {
  id: string;
  text: string;
  playerId: string;
  isCorrect: boolean;
}

export interface Vote {
  playerId: string;
  answerId: string;
}

// Socket события
export interface ClientToServerEvents {
  'room:join': (data: RoomJoinRequest) => void;
  'room:create': (data?: RoomCreateRequest) => void;
  'game:start': () => void;
  'game:next_round': () => void;
  'round:answer_submit': (data: AnswerSubmitRequest) => void;
  'round:vote_submit': (data: VoteSubmitRequest) => void;
}

export interface ServerToClientEvents {
  'room:update': (room: Room) => void;
  'game:start': (gameState: GameState) => void;
  'round:question': (question: Question, timeRemaining: number) => void;
  'round:voting_start': (answers: Answer[], timeRemaining: number) => void;
  'round:results': (results: RoundResults) => void;
  'game:end': (finalScores: Player[]) => void;
  'player:disconnect': (playerId: string) => void;
  'error': (message: string) => void;
}

export interface RoomJoinRequest {
  code: string;
  nickname: string;
}

export interface RoomCreateRequest {
  settings?: Partial<GameSettings>;
}

export interface AnswerSubmitRequest {
  answer: string;
}

export interface VoteSubmitRequest {
  answerId: string;
}

export interface RoundResults {
  answers: Answer[];
  votes: Vote[];
  scores: PlayerWithRoundScore[];
}
