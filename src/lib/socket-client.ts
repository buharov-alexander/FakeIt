'use client';

import { io, Socket } from 'socket.io-client';
import { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  Room, 
  GameState, 
  Question, 
  Answer, 
  Vote,
  Player,
  RoomJoinRequest,
  RoomCreateRequest,
  AnswerSubmitRequest,
  VoteSubmitRequest
} from '@/types/game.types';
import { 
  generateMockRoom, 
  generateMockGameState, 
  generateMockVotingAnswers, 
  generateMockRoundResults, 
  generateMockFinalScores,
  mockQuestions 
} from '@/lib/mock-data';

class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private mockMode = true;

  connect() {
    if (this.mockMode) {
      console.log('Mock mode: Simulating socket connection');
      return;
    }

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Room operations
  createRoom(callback: (roomCode: string) => void, data?: RoomCreateRequest) {
    if (this.mockMode) {
      // Mock response
      setTimeout(() => {
        const roomCode = this.generateRoomCode();
        callback(roomCode);
      }, 500);
      return;
    }

    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('room:create', data || {});
  }

  joinRoom(data: RoomJoinRequest, callback: (room: Room) => void) {
    if (this.mockMode) {
      setTimeout(() => {
        const mockRoom = generateMockRoom(data.code, 'Host', data.nickname);
        callback(mockRoom);
      }, 500);
      return;
    }

    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('room:join', data);
  }

  leaveRoom() {
    if (this.mockMode) return;
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('room:leave');
  }

  // Game operations
  submitAnswer(data: AnswerSubmitRequest) {
    if (this.mockMode) {
      console.log('Mock: Answer submitted', data);
      return;
    }

    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('round:answer_submit', data);
  }

  submitVote(data: VoteSubmitRequest) {
    if (this.mockMode) {
      console.log('Mock: Vote submitted', data);
      return;
    }

    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('round:vote_submit', data);
  }

  // Event listeners
  onRoomUpdate(callback: (room: Room) => void) {
    if (this.mockMode) {
      // Mock room updates
      return;
    }

    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('room:update', callback);
  }

  onGameStart(callback: (gameState: GameState) => void) {
    if (this.mockMode) {
      setTimeout(() => {
        const mockGameState = generateMockGameState(1);
        callback(mockGameState);
      }, 2000);
      return;
    }

    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('game:start', callback);
  }

  onRoundQuestion(callback: (question: Question, timeRemaining: number) => void) {
    if (this.mockMode) {
      return;
    }

    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('round:question', callback);
  }

  onVotingStart(callback: (answers: Answer[], timeRemaining: number) => void) {
    if (this.mockMode) {
      setTimeout(() => {
        const mockAnswers = generateMockVotingAnswers();
        callback(mockAnswers, 60);
      }, 5000);
      return;
    }

    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('round:voting_start', callback);
  }

  onRoundResults(callback: (results: { answers: Answer[], votes: Vote[], scores: Player[] }) => void) {
    if (this.mockMode) {
      setTimeout(() => {
        const mockResults = generateMockRoundResults([
          { id: 'host-123', nickname: 'Host', score: 0, isConnected: true },
          { id: 'player-123', nickname: 'Player', score: 0, isConnected: true }
        ]);
        callback(mockResults);
      }, 8000);
      return;
    }

    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('round:results', callback);
  }

  onGameEnd(callback: (finalScores: Player[]) => void) {
    if (this.mockMode) {
      return;
    }

    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('game:end', callback);
  }

  onError(callback: (message: string) => void) {
    if (this.mockMode) {
      return;
    }

    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('error', callback);
  }

  // Remove event listeners
  off(event: keyof ServerToClientEvents, callback?: (...args: any[]) => void) {
    if (this.mockMode) return;
    if (!this.socket) throw new Error('Socket not connected');
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Enable/disable mock mode for testing
  setMockMode(enabled: boolean) {
    this.mockMode = enabled;
  }
}

export const socketClient = new SocketClient();
