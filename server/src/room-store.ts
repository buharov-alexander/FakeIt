import { Room, Player, GameSettings, GamePhase, TIMER_CONSTANTS } from './types/game.types';

export class RoomStore {
  private rooms: Map<string, Room> = new Map();

  createRoom(nickname: string, settings?: Partial<GameSettings>): Room {
    const code = this.generateUniqueCode();
    const hostId = this.generatePlayerId();
    
    const host: Player = {
      id: hostId,
      nickname,
      score: 0,
      isConnected: true
    };

    const defaultSettings: GameSettings = {
      maxPlayers: 8,
      roundCount: 5,
      answerTimerSec: TIMER_CONSTANTS.DEFAULT_ANSWER_TIME,
      voteTimerSec: TIMER_CONSTANTS.DEFAULT_VOTE_TIME
    };

    const room: Room = {
      code,
      hostId,
      players: [host],
      status: GamePhase.LOBBY,
      settings: { ...defaultSettings, ...settings }
    };

    this.rooms.set(code, room);
    return room;
  }

  joinRoom(code: string, nickname: string): Room | null {
    const room = this.rooms.get(code);
    
    if (!room) {
      return null;
    }

    if (room.players.length >= room.settings.maxPlayers) {
      return null;
    }

    const existingPlayer = room.players.find(p => p.nickname === nickname);
    if (existingPlayer) {
      return null;
    }

    const newPlayer: Player = {
      id: this.generatePlayerId(),
      nickname,
      score: 0,
      isConnected: true
    };

    room.players.push(newPlayer);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): Room | null {
    return this.rooms.get(code) || null;
  }

  updatePlayerStatus(code: string, playerId: string, isConnected: boolean): boolean {
    const room = this.rooms.get(code);
    
    if (!room) {
      return false;
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return false;
    }

    player.isConnected = isConnected;
    return true;
  }

  private generateUniqueCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    while (true) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      if (!this.rooms.has(code)) {
        return code;
      }
    }
  }

  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}

export const roomStore = new RoomStore();
