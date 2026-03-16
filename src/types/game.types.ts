import { GamePhase } from '@/lib/game-phases';

export interface Player {
  id: string;
  nickname: string;
  score: number;
  isConnected: boolean;
}

export interface GameSettings {
  maxPlayers: number;
  roundCount: number;
  answerTimerSec: number;
  voteTimerSec: number;
}

export interface Question {
  id: string;
  text: string;
  answer: string;
  category?: string;
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

export interface GameState {
  currentRound: number;
  question: Question;
  phase: 'answering' | 'voting' | 'reveal';
  answers: Answer[];
  votes: Vote[];
  timeRemaining?: number;
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  status: GamePhase;
  settings: GameSettings;
  gameState?: GameState;
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

// Socket event types
export interface ServerToClientEvents {
  'room:update': (room: Room) => void;
  'game:start': (gameState: GameState) => void;
  'round:question': (question: Question, timeRemaining: number) => void;
  'round:voting_start': (answers: Answer[], timeRemaining: number) => void;
  'round:results': (results: { answers: Answer[], votes: Vote[], scores: Player[] }) => void;
  'game:end': (finalScores: Player[]) => void;
  'player:disconnect': (playerId: string) => void;
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'room:join': (data: RoomJoinRequest) => void;
  'room:create': (data: RoomCreateRequest) => void;
  'room:leave': () => void;
  'round:answer_submit': (data: AnswerSubmitRequest) => void;
  'round:vote_submit': (data: VoteSubmitRequest) => void;
}
