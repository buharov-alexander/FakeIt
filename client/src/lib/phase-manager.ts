import { GameState, Answer, Player, Vote } from '@/types/game.types';
import { GAME_PHASES } from './game-phases';
import { 
  generateMockGameState, 
  generateMockVotingAnswers, 
  generateMockRoundResults, 
  generateMockFinalScores 
} from './mock-data';

export class PhaseManager {
  private currentPhase: string = GAME_PHASES.LOBBY;
  private currentRound: number = 0;
  private players: Player[] = [];

  constructor(players: Player[]) {
    this.players = players;
  }

  // Начать игру - переход от LOBBY к PLAYING
  startGame(): GameState {
    this.currentPhase = GAME_PHASES.PLAYING;
    this.currentRound = 1;
    const gameState = generateMockGameState(this.currentRound);
    gameState.phase = GAME_PHASES.ANSWERING;
    this.currentPhase = GAME_PHASES.ANSWERING;
    return gameState;
  }

  // Завершить ввод ответов - переход к VOTING
  finishAnswering(): { answers: Answer[], timeRemaining: number } {
    this.currentPhase = GAME_PHASES.VOTING;
    const answers = generateMockVotingAnswers();
    return { answers, timeRemaining: 60 };
  }

  // Завершить голосование - переход к REVEAL
  finishVoting(): { answers: Answer[], votes: Vote[], scores: Player[] } {
    this.currentPhase = GAME_PHASES.REVEAL;
    return generateMockRoundResults(this.players);
  }

  // Перейти к следующему раунду или завершить игру
  nextRound(): { gameState?: GameState, finalScores?: Player[], isGameEnd: boolean } {
    if (this.currentRound >= 5) {
      // Завершаем игру
      this.currentPhase = GAME_PHASES.FINISHED;
      const finalScores = generateMockFinalScores(this.players);
      return { finalScores, isGameEnd: true };
    } else {
      // Следующий раунд
      this.currentRound++;
      this.currentPhase = GAME_PHASES.ANSWERING;
      const gameState = generateMockGameState(this.currentRound);
      return { gameState, isGameEnd: false };
    }
  }

  // Получить текущую фазу
  getCurrentPhase(): string {
    return this.currentPhase;
  }

  // Получить текущий раунд
  getCurrentRound(): number {
    return this.currentRound;
  }

  // Обновить игроков (для актуальных очков)
  updatePlayers(players: Player[]) {
    this.players = players;
  }
}
