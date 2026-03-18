import { Room, Player, GameState, Question, Answer, Vote, RoundResults } from './types/game.types';
import { getRandomQuestion } from './utils/questions';
import { roomStore } from './room-store';

export class GameEngine {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  startGame(roomCode: string): boolean {
    const room = roomStore.getRoom(roomCode);
    
    if (!room || room.status !== 'lobby') {
      return false;
    }

    if (room.players.length < 2) {
      return false;
    }

    room.status = 'playing';
    room.gameState = this.createGameState(1);
    
    // Запускаем таймер на ответы
    this.startAnswerTimer(roomCode, room.settings.answerTimerSec);
    
    return true;
  }

  submitAnswer(roomCode: string, playerId: string, answerText: string): boolean {
    const room = roomStore.getRoom(roomCode);
    
    if (!room || !room.gameState || room.gameState.phase !== 'answering') {
      return false;
    }

    // Проверяем, не ответил ли уже игрок
    const existingAnswer = room.gameState.answers.find(a => a.playerId === playerId);
    if (existingAnswer) {
      return false;
    }

    const answer: Answer = {
      id: this.generateAnswerId(),
      text: answerText,
      playerId,
      isCorrect: false
    };

    room.gameState.answers.push(answer);
    
    // Если все игроки ответили, переходим к голосованию
    if (room.gameState.answers.length === room.players.length) {
      this.startVoting(roomCode);
    }

    return true;
  }

  submitVote(roomCode: string, playerId: string, answerId: string): boolean {
    const room = roomStore.getRoom(roomCode);
    
    if (!room || !room.gameState || room.gameState.phase !== 'voting') {
      return false;
    }

    // Проверяем, не голосовал ли уже игрок
    const existingVote = room.gameState.votes.find(v => v.playerId === playerId);
    if (existingVote) {
      return false;
    }

    const vote: Vote = {
      playerId,
      answerId
    };

    room.gameState.votes.push(vote);
    
    // Если все игроки проголосовали, показываем результаты
    if (room.gameState.votes.length === room.players.length) {
      this.showResults(roomCode);
    }

    return true;
  }

  nextRound(roomCode: string): boolean {
    const room = roomStore.getRoom(roomCode);
    
    if (!room || !room.gameState) {
      return false;
    }

    const nextRound = room.gameState.currentRound + 1;
    
    if (nextRound > room.settings.roundCount) {
      // Игра завершена
      this.endGame(roomCode);
      return true;
    }

    // Начинаем новый раунд
    room.gameState = this.createGameState(nextRound);
    this.startAnswerTimer(roomCode, room.settings.answerTimerSec);
    
    return true;
  }

  private createGameState(round: number): GameState {
    const question = getRandomQuestion();
    
    // Добавляем правильный ответ как первый
    const answers: Answer[] = [{
      id: this.generateAnswerId(),
      text: question.answer,
      playerId: 'system',
      isCorrect: true
    }];

    return {
      currentRound: round,
      question,
      phase: 'answering',
      answers,
      votes: [],
      timeRemaining: 90
    };
  }

  private startVoting(roomCode: string): void {
    const room = roomStore.getRoom(roomCode);
    
    if (!room || !room.gameState) {
      return;
    }

    room.gameState.phase = 'voting';
    room.gameState.timeRemaining = room.settings.voteTimerSec;
    
    // Перемешиваем ответы для голосования
    const shuffledAnswers = this.shuffleArray([...room.gameState.answers]);
    room.gameState.answers = shuffledAnswers;
    
    this.startVoteTimer(roomCode, room.settings.voteTimerSec);
  }

  private showResults(roomCode: string): void {
    const room = roomStore.getRoom(roomCode);
    
    if (!room || !room.gameState) {
      return;
    }

    room.gameState.phase = 'reveal';
    
    // Подсчитываем очки
    const results = this.calculateRoundResults(room.gameState);
    
    // Обновляем очки игроков
    results.scores.forEach(scoredPlayer => {
      const roomPlayer = room.players.find(p => p.id === scoredPlayer.id);
      if (roomPlayer) {
        roomPlayer.score = scoredPlayer.score;
      }
    });

    // Очищаем таймеры
    this.clearTimer(roomCode);
  }

  public calculateRoundResults(gameState: GameState): RoundResults {
    const results: RoundResults = {
      answers: gameState.answers,
      votes: gameState.votes,
      scores: []
    };

    // Копируем текущие очки игроков
    const playerScores = new Map<string, number>();
    
    // Подсчитываем очки за раунд
    gameState.votes.forEach(vote => {
      const votedAnswer = gameState.answers.find(a => a.id === vote.answerId);
      if (votedAnswer) {
        // Голосующий получает 1000 очков за правильный ответ
        if (votedAnswer.isCorrect) {
          const currentScore = playerScores.get(vote.playerId) || 0;
          playerScores.set(vote.playerId, currentScore + 1000);
        }
        
        // Автор ложного ответа получает 500 очков за каждый обманутый голос
        if (!votedAnswer.isCorrect && votedAnswer.playerId !== 'system') {
          const authorScore = playerScores.get(votedAnswer.playerId) || 0;
          playerScores.set(votedAnswer.playerId, authorScore + 500);
        }
      }
    });

    // Создаем массив с обновленными очками
    results.scores = Array.from(playerScores.entries()).map(([playerId, score]) => ({
      id: playerId,
      nickname: '', // Будет заполнено из room.players
      score,
      isConnected: true
    }));

    return results;
  }

  private endGame(roomCode: string): void {
    const room = roomStore.getRoom(roomCode);
    
    if (!room) {
      return;
    }

    room.status = 'finished';
    this.clearTimer(roomCode);
  }

  private startAnswerTimer(roomCode: string, seconds: number): void {
    this.clearTimer(roomCode);
    
    const timer = setInterval(() => {
      const room = roomStore.getRoom(roomCode);
      if (room && room.gameState && room.gameState.timeRemaining !== undefined) {
        room.gameState.timeRemaining--;
        
        if (room.gameState.timeRemaining <= 0) {
          this.startVoting(roomCode);
        }
      }
    }, 1000);
    
    this.timers.set(roomCode, timer);
  }

  private startVoteTimer(roomCode: string, seconds: number): void {
    this.clearTimer(roomCode);
    
    const timer = setInterval(() => {
      const room = roomStore.getRoom(roomCode);
      if (room && room.gameState && room.gameState.timeRemaining !== undefined) {
        room.gameState.timeRemaining--;
        
        if (room.gameState.timeRemaining <= 0) {
          this.showResults(roomCode);
        }
      }
    }, 1000);
    
    this.timers.set(roomCode, timer);
  }

  private clearTimer(roomCode: string): void {
    const timer = this.timers.get(roomCode);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(roomCode);
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateAnswerId(): string {
    return `answer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const gameEngine = new GameEngine();
