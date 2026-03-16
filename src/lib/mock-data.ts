import { Room, GameState, Question, Answer, Player, Vote } from '@/types/game.types';

export const mockQuestions: Question[] = [
  {
    id: 'q1',
    text: 'Самая высокая гора в мире — это _____',
    answer: 'Эверест'
  },
  {
    id: 'q2', 
    text: 'Столица Франции — это _____',
    answer: 'Париж'
  },
  {
    id: 'q3',
    text: 'Самый большой океан на Земле — это _____',
    answer: 'Тихий океан'
  },
  {
    id: 'q4',
    text: 'Автор романа "Война и мир" — это _____',
    answer: 'Лев Толстой'
  },
  {
    id: 'q5',
    text: 'Химическая формула воды — это _____',
    answer: 'H2O'
  }
];

export const generateMockRoom = (roomCode: string, hostNickname: string, playerNickname: string): Room => {
  const hostPlayer: Player = {
    id: 'host-123',
    nickname: hostNickname,
    score: 0,
    isConnected: true
  };

  const player: Player = {
    id: 'player-123', 
    nickname: playerNickname,
    score: 0,
    isConnected: true
  };

  return {
    code: roomCode,
    hostId: hostPlayer.id,
    players: [hostPlayer, player],
    status: 'lobby',
    settings: {
      maxPlayers: 8,
      roundCount: 5,
      answerTimerSec: 90,
      voteTimerSec: 60
    }
  };
};

export const generateMockGameState = (roundNumber: number): GameState => {
  const question = mockQuestions[(roundNumber - 1) % mockQuestions.length];
  
  return {
    currentRound: roundNumber,
    question,
    phase: 'answering',
    answers: [],
    votes: [],
    timeRemaining: 90
  };
};

export const generateMockVotingAnswers = (): Answer[] => {
  return [
    { id: 'a1', text: 'Эверест', playerId: 'system', isCorrect: true },
    { id: 'a2', text: 'Килиманджаро', playerId: 'player-123', isCorrect: false },
    { id: 'a3', text: 'Монблан', playerId: 'host-123', isCorrect: false }
  ];
};

export const generateMockRoundResults = (players: Player[]) => {
  const updatedPlayers = players.map((player, index) => ({
    ...player,
    score: index === 0 ? 1000 : 500 // First player gets more points
  }));

  return {
    answers: [
      { id: 'a1', text: 'Эверест', playerId: 'system', isCorrect: true },
      { id: 'a2', text: 'Килиманджаро', playerId: 'player-123', isCorrect: false },
      { id: 'a3', text: 'Монблан', playerId: 'host-123', isCorrect: false }
    ],
    votes: [
      { playerId: 'player-123', answerId: 'a1' },
      { playerId: 'host-123', answerId: 'a2' }
    ],
    scores: updatedPlayers
  };
};

export const generateMockFinalScores = (players: Player[]): Player[] => {
  return players.map((player, index) => ({
    ...player,
    score: Math.floor(Math.random() * 3000) + (3 - index) * 500
  })).sort((a, b) => b.score - a.score);
};
