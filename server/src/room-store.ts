import { Room, Player, GameSettings, GamePhase, TIMER_CONSTANTS } from './types/game.types';

export class RoomStore {
  private rooms: Map<string, Room> = new Map();
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map();
  private globalCleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Запускаем глобальную очистку каждые 5 минут
    this.startGlobalCleanup();
  }

  createRoom(nickname: string, settings?: Partial<GameSettings>): Room {
    const code = this.generateUniqueCode();
    const hostId = this.generatePlayerId();
    const now = new Date();
    
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
      settings: { ...defaultSettings, ...settings },
      createdAt: now,
      lastActivity: now
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
    room.lastActivity = new Date();
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): Room | null {
    const room = this.rooms.get(code);
    if (room) {
      room.lastActivity = new Date();
      this.rooms.set(code, room);
    }
    return room || null;
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
    room.lastActivity = new Date();
    
    // Мгновенная очистка пустых комнат
    if (room.players.every(p => !p.isConnected)) {
      this.clearRoom(code);
      return true;
    }
    
    this.rooms.set(code, room);
    return true;
  }

  // Очистка комнаты
  clearRoom(code: string): void {
    // Отменяем таймер отложенной очистки, если есть
    const timer = this.cleanupTimers.get(code);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(code);
    }
    
    this.rooms.delete(code);
    console.log(`Room ${code} cleared`);
  }

  // Установка статуса завершенной игры с отложенной очисткой
  setGameFinished(code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;

    room.status = GamePhase.FINISHED;
    room.lastActivity = new Date();
    this.rooms.set(code, room);

    // Устанавливаем таймер на очистку через 20 минут
    const timer = setTimeout(() => {
      this.clearRoom(code);
    }, 20 * 60 * 1000); // 20 минут

    this.cleanupTimers.set(code, timer);
    console.log(`Room ${code} scheduled for cleanup in 20 minutes`);
  }

  // Глобальная очистка неактивных комнат
  private startGlobalCleanup(): void {
    this.globalCleanupTimer = setInterval(() => {
      this.cleanupInactiveRooms();
    }, 5 * 60 * 1000); // Каждые 5 минут
  }

  private cleanupInactiveRooms(): void {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30 минут неактивности
    let cleanedCount = 0;

    for (const [code, room] of this.rooms.entries()) {
      const timeSinceLastActivity = now.getTime() - room.lastActivity.getTime();
      
      // Очищаем комнаты, которые неактивны 30 минут и не в игре
      if (timeSinceLastActivity > inactiveThreshold && room.status !== GamePhase.PLAYING) {
        this.clearRoom(code);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} inactive rooms`);
    }
  }

  // Остановка всех таймеров (для graceful shutdown)
  destroy(): void {
    // Останавливаем глобальный таймер
    if (this.globalCleanupTimer) {
      clearInterval(this.globalCleanupTimer);
      this.globalCleanupTimer = null;
    }

    // Останавливаем все таймеры очистки комнат
    for (const timer of this.cleanupTimers.values()) {
      clearTimeout(timer);
    }
    this.cleanupTimers.clear();
  }

  // Найти комнату по ID игрока
  findRoomByPlayerId(playerId: string): Room | null {
    for (const room of this.rooms.values()) {
      if (room.players.some(p => p.id === playerId)) {
        return room;
      }
    }
    return null;
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
}

export const roomStore = new RoomStore();
