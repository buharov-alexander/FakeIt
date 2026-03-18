import { Room, Player, GameSettings } from './types/game.types';

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
      answerTimerSec: 90,
      voteTimerSec: 60
    };

    const room: Room = {
      code,
      hostId,
      players: [host],
      status: 'lobby',
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

  leaveRoom(code: string, playerId: string): boolean {
    const room = this.rooms.get(code);
    
    if (!room) {
      return false;
    }

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return false;
    }

    room.players.splice(playerIndex, 1);

    // Если хост вышел, удаляем комнату
    if (room.players.length === 0) {
      this.rooms.delete(code);
    } else if (room.hostId === playerId) {
      // Назначаем нового хоста
      room.hostId = room.players[0].id;
    }

    return true;
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
