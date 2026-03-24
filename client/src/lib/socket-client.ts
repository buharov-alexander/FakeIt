import { io, Socket } from 'socket.io-client';
import { 
  Room, 
  GameState, 
  Question, 
  Answer, 
  Vote, 
  Player, 
  AnswerSubmitRequest, 
  VoteSubmitRequest,
  RoomJoinRequest,
  ClientToServerEvents, 
  ServerToClientEvents 
} from '@/types/game.types';

class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private currentNickname: string = '';

  connect(nickname?: string) {
    if (nickname) {
      this.currentNickname = nickname;
    }
    
    // Не создавать новое соединение если уже существует
    if (this.socket && this.socket.connected) {
      return;
    }
    
    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket'],
      query: nickname ? { nickname } : undefined
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  // Room operations
  createRoom(callback: (room: Room) => void) {
    this.connect(this.currentNickname);
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('room:create', {});
    this.socket.once('room:update', callback);
  }

  joinRoom(data: RoomJoinRequest, callback: (room: Room) => void) {
    this.connect(data.nickname);
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('room:join', data);
    this.socket.once('room:update', callback);
  }

  // Game operations
  submitAnswer(data: AnswerSubmitRequest) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('round:answer_submit', data);
  }

  submitVote(data: VoteSubmitRequest) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('round:vote_submit', data);
  }

  startGame() {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('game:start');
  }

  nextRound() {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('game:next_round');
  }

  // Event listeners
  onRoomUpdate(callback: (room: Room) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('room:update', callback);
  }

  onGameStart(callback: (gameState: GameState) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('game:start', callback);
  }

  onRoundQuestion(callback: (question: Question, timeRemaining: number) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('round:question', callback);
  }

  onVotingStart(callback: (answers: Answer[], timeRemaining: number) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('round:voting_start', callback);
  }

  onRoundResults(callback: (results: { answers: Answer[], votes: Vote[], scores: Player[] }) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('round:results', callback);
  }

  onGameEnd(callback: (finalScores: Player[]) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('game:end', callback);
  }

  onPlayerDisconnect(callback: (playerId: string) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('player:disconnect', callback);
  }

  onError(callback: (message: string) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('error', callback);
  }

  // Remove event listeners
  off(event: keyof ServerToClientEvents, callback?: (...args: any[]) => void) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }
}

export const socketClient = new SocketClient();
