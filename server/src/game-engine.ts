import { Server } from 'socket.io';
import questions from './data/questions.json';
import { GameState, Answer, Vote, Question, RoundResults, GamePhase, TIMER_CONSTANTS } from './types/game.types';
import { roomStore } from './room-store';

export class GameEngine {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  startGame(roomCode: string): boolean {
    const room = roomStore.getRoom(roomCode);
    
    if (!room || room.status !== GamePhase.LOBBY) {
      return false;
    }

    if (room.players.length < 2) {
      return false;
    }

    room.status = GamePhase.PLAYING;
    room.gameState = this.createGameState(1);
    
    // Запускаем таймер на ответы
    this.startAnswerTimer(roomCode, room.settings.answerTimerSec);
    
    return true;
  }

  submitAnswer(roomCode: string, playerId: string, answerText: string): boolean {
    const room = roomStore.getRoom(roomCode);
    
    if (!room || !room.gameState || room.gameState.phase !== GamePhase.ANSWERING) {
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
    
    if (!room || !room.gameState || room.gameState.phase !== GamePhase.VOTING) {
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
      this.clearTimer(roomCode); // Останавливаем таймер голосования
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
    const question = this.getRandomQuestion();
    
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
      phase: GamePhase.ANSWERING,
      answers,
      votes: [],
      timeRemaining: TIMER_CONSTANTS.DEFAULT_ANSWER_TIME
    };
  }

  private startVoting(roomCode: string): void {
    const room = roomStore.getRoom(roomCode);
    
    if (!room || !room.gameState) {
      return;
    }

    room.gameState.phase = GamePhase.VOTING;
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

    // Проверяем, не в фазе ли уже результаты
    if (room.gameState.phase === GamePhase.REVEAL) {
      return;
    }

    room.gameState.phase = GamePhase.REVEAL;
    
    // Сохраняем текущие очки игроков перед подсчетом
    const originalScores = new Map<string, number>();
    room.players.forEach(player => {
      originalScores.set(player.id, player.score);
    });
    
    // Подсчитываем и отправляем результаты
    const results = this.calculateRoundResults(roomCode, room.gameState, originalScores);
    
    // Обновляем очки игроков в комнате
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

  public calculateRoundResults(roomCode: string, gameState: GameState, originalScores: Map<string, number>): RoundResults {
    const results: RoundResults = {
      answers: gameState.answers,
      votes: gameState.votes,
      scores: []
    };

    const room = roomStore.getRoom(roomCode);
    if (!room) {
      return results;
    }

    // Подсчитываем очки за раунд
    const roundScoreChanges = new Map<string, number>();
    
    gameState.votes.forEach(vote => {
      const votedAnswer = gameState.answers.find(a => a.id === vote.answerId);
      if (votedAnswer) {
        // Если проголосовали за правильный ответ
        if (votedAnswer.isCorrect) {
          const currentScore = roundScoreChanges.get(vote.playerId) || 0;
          roundScoreChanges.set(vote.playerId, currentScore + 1000);
        }
        
        // Если проголосовали за ложный ответ, даем очки автору ответа
        if (!votedAnswer.isCorrect && votedAnswer.playerId !== 'system') {
          const currentScore = roundScoreChanges.get(votedAnswer.playerId) || 0;
          roundScoreChanges.set(votedAnswer.playerId, currentScore + 500);
        }
      }
    });

    // Конвертируем в массив с никнеймами и изменениями очков
    roundScoreChanges.forEach((roundScore, playerId) => {
      const previousScore = originalScores.get(playerId) || 0;
      const totalScore = previousScore + roundScore;
      
      // Находим никнейм игрока
      const player = room.players.find(p => p.id === playerId);
      const nickname = player ? player.nickname : '';
      
      results.scores.push({
        id: playerId,
        nickname,
        score: totalScore,
        isConnected: true,
        roundScoreChange: roundScore // Добавляем изменение очков за раунд
      });
    });

    // Добавляем игроков, которые не заработали очки в этом раунде
    room.players.forEach(player => {
      if (!results.scores.find(s => s.id === player.id)) {
        const previousScore = originalScores.get(player.id) || 0;
        results.scores.push({
          id: player.id,
          nickname: player.nickname,
          score: previousScore, // Очки остаются без изменений
          isConnected: true,
          roundScoreChange: 0 // Без изменений
        });
      }
    });

    return results;
  }

  endGame(roomCode: string): void {
    const room = roomStore.getRoom(roomCode);
    
    if (!room) {
      return;
    }

    room.status = GamePhase.FINISHED;
    this.clearTimer(roomCode);
  }

  // Утилиты
  private generateAnswerId(): string {
    return `answer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRandomQuestion(): Question {
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
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
