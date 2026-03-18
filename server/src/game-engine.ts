import { Room, Player, GameState, Question, Answer, Vote, RoundResults } from './types/game.types';
import { getRandomQuestion } from './utils/questions';
import { roomStore } from './room-store';
import { Server } from 'socket.io';

export class GameEngine {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

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
    // Исключаем системный ответ из подсчета
    const playerAnswersCount = room.gameState.answers.filter(a => a.playerId !== 'system').length;
    if (playerAnswersCount === room.players.length) {
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
    
    // Отправляем событие о начале голосования
    this.io.to(roomCode).emit('round:voting_start', room.gameState.answers, room.gameState.timeRemaining);
    
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

    // Отправляем результаты
    this.io.to(roomCode).emit('round:results', results);

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
        // Если проголосовали за правильный ответ
        if (votedAnswer.isCorrect) {
          const currentScore = playerScores.get(vote.playerId) || 0;
          playerScores.set(vote.playerId, currentScore + 1000);
        }
        
        // Если проголосовали за ложный ответ, даем очки автору ответа
        if (!votedAnswer.isCorrect && votedAnswer.playerId !== 'system') {
          const currentScore = playerScores.get(votedAnswer.playerId) || 0;
          playerScores.set(votedAnswer.playerId, currentScore + 500);
        }
      }
    });

    // Конвертируем в массив
    playerScores.forEach((score, playerId) => {
      results.scores.push({
        id: playerId,
        nickname: '', // Будет заполнено выше
        score,
        isConnected: true
      });
    });

    return results;
  }

  endGame(roomCode: string): void {
    const room = roomStore.getRoom(roomCode);
    
    if (!room) {
      return;
    }

    room.status = 'finished';
    this.clearTimer(roomCode);
  }

  // Утилиты
  private generateAnswerId(): string {
    return `answer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private startAnswerTimer(roomCode: string, seconds: number): void {
    this.clearTimer(roomCode);
    
    this.timers.set(roomCode, setTimeout(() => {
      this.startVoting(roomCode);
    }, seconds * 1000));
  }

  private startVoteTimer(roomCode: string, seconds: number): void {
    this.clearTimer(roomCode);
    
    this.timers.set(roomCode, setTimeout(() => {
      this.showResults(roomCode);
    }, seconds * 1000));
  }

  private clearTimer(roomCode: string): void {
    const timer = this.timers.get(roomCode);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(roomCode);
    }
  }
}
