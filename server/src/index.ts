import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Socket } from 'socket.io';
import { roomStore } from './room-store';
import { gameEngine } from './game-engine';
import { ClientToServerEvents, ServerToClientEvents, RoomJoinRequest, RoomCreateRequest } from './types/game.types';

const app = express();
const httpServer = createServer(app);

// CORS настройка
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://localhost:3002'],
  methods: ['GET', 'POST']
}));

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://localhost:3002'],
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log(`Player connected: ${socket.id}`);

  // Присоединение к комнате
  socket.on('room:join', (data: RoomJoinRequest) => {
    console.log(`Player ${data.nickname} trying to join room ${data.code}`);
    
    const room = roomStore.joinRoom(data.code, data.nickname);
    
    if (!room) {
      socket.emit('error', 'Комната не найдена или заполнена');
      return;
    }

    socket.join(data.code);
    socket.data.roomCode = data.code;
    socket.data.playerId = socket.id;

    // Обновляем статус подключения в комнате
    roomStore.updatePlayerStatus(data.code, socket.id, true);

    // Отправляем обновление комнаты всем
    io.to(data.code).emit('room:update', room);
    
    console.log(`Player ${data.nickname} joined room ${data.code}`);
  });

  // Создание комнаты
  socket.on('room:create', (data?: RoomCreateRequest) => {
    console.log(`Creating room for player ${socket.handshake.query.nickname}`);
    
    const nickname = socket.handshake.query.nickname as string || 'Host';
    const room = roomStore.createRoom(nickname, data?.settings);
    
    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.playerId = socket.id;

    io.to(room.code).emit('room:update', room);
    
    console.log(`Room ${room.code} created by ${nickname}`);
  });

  // Начало игры
  socket.on('game:start', () => {
    const roomCode = socket.data.roomCode as string;
    console.log(`Starting game in room ${roomCode}`);
    
    if (gameEngine.startGame(roomCode)) {
      const room = roomStore.getRoom(roomCode);
      if (room && room.gameState) {
        io.to(roomCode).emit('game:start', room.gameState);
        io.to(roomCode).emit('round:question', room.gameState.question, room.gameState.timeRemaining);
      }
    } else {
      socket.emit('error', 'Не удалось начать игру');
    }
  });

  // Отправка ответа
  socket.on('round:answer_submit', (data: { answer: string }) => {
    const roomCode = socket.data.roomCode as string;
    console.log(`Answer submitted in room ${roomCode}: ${data.answer}`);
    
    if (gameEngine.submitAnswer(roomCode, socket.data.playerId as string, data.answer)) {
      const room = roomStore.getRoom(roomCode);
      if (room && room.gameState?.phase === 'voting') {
        io.to(roomCode).emit('round:voting_start', room.gameState.answers, room.gameState.timeRemaining);
      }
    } else {
      socket.emit('error', 'Не удалось отправить ответ');
    }
  });

  // Отправка голоса
  socket.on('round:vote_submit', (data: { answerId: string }) => {
    const roomCode = socket.data.roomCode as string;
    console.log(`Vote submitted in room ${roomCode}: ${data.answerId}`);
    
    if (gameEngine.submitVote(roomCode, socket.data.playerId as string, data.answerId)) {
      const room = roomStore.getRoom(roomCode);
      if (room && room.gameState?.phase === 'reveal') {
        const results = gameEngine.calculateRoundResults(room.gameState);
        io.to(roomCode).emit('round:results', results);
      }
    } else {
      socket.emit('error', 'Не удалось отправить голос');
    }
  });

  // Следующий раунд
  socket.on('game:next_round', () => {
    const roomCode = socket.data.roomCode as string;
    console.log(`Next round in room ${roomCode}`);
    
    if (gameEngine.nextRound(roomCode)) {
      const room = roomStore.getRoom(roomCode);
      
      if (room && room.status === 'finished') {
        io.to(roomCode).emit('game:end', room.players.sort((a, b) => b.score - a.score));
      } else if (room && room.gameState) {
        io.to(roomCode).emit('game:start', room.gameState);
        io.to(roomCode).emit('round:question', room.gameState.question, room.gameState.timeRemaining);
      }
    } else {
      socket.emit('error', 'Не перейти к следующему раунду');
    }
  });

  // Отключение игрока
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    const roomCode = socket.data.roomCode as string;
    const playerId = socket.data.playerId as string;
    
    if (roomCode && playerId) {
      roomStore.leaveRoom(roomCode, playerId);
      roomStore.updatePlayerStatus(roomCode, playerId, false);
      
      const room = roomStore.getRoom(roomCode);
      if (room) {
        io.to(roomCode).emit('room:update', room);
        io.to(roomCode).emit('player:disconnect', playerId);
        
        console.log(`Player ${playerId} left room ${roomCode}`);
      }
    }
  });
});

// Запуск сервера
httpServer.listen(PORT, () => {
  console.log(`🎮 Fibbage server running on port ${PORT}`);
  console.log(`🌐 Client should be available at http://localhost:3000`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
