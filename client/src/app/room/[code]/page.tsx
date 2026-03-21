'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { socketClient } from '@/lib/socket-client';
import { Room, GameState, Question, Answer, Player, Vote, GamePhase } from '@/types/game.types';
import Lobby from '@/components/Lobby';
import GameScreen from '@/components/GameScreen';
import VotingScreen from '@/components/VotingScreen';
import ResultsScreen from '@/components/ResultsScreen';

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [votingAnswers, setVotingAnswers] = useState<Answer[]>([]);
  const [roundResults, setRoundResults] = useState<{ answers: Answer[], votes: Vote[], scores: Player[] } | null>(null);
  const [finalScores, setFinalScores] = useState<Player[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');

  const roomCode = params.code as string;
  const nickname = searchParams.get('nickname');
  const isCreateMode = searchParams.get('create') === 'true';

  useEffect(() => {
    if (!roomCode || !nickname) {
      router.push('/');
      return;
    }

    // Connect to socket immediately
    socketClient.connect(nickname);
    
    // Set current nickname for socket client
    if (nickname) {
      (socketClient as any).currentNickname = nickname;
    }
    
    // Get current player ID from socket after connection
    const checkSocketId = () => {
      const socketId = socketClient.getSocketId();
      if (socketId) {
        setCurrentPlayerId(socketId);
      } else {
        setTimeout(checkSocketId, 100);
      }
    };
    checkSocketId();

    if (isCreateMode) {
      // Создаем комнату
      socketClient.createRoom((room) => {
        setRoom(room);
        setLoading(false);
      });
    } else {
      // Присоединяем к комнате
      socketClient.joinRoom(
        { code: roomCode, nickname },
        (roomData: Room) => {
          setRoom(roomData);
          setLoading(false);
        }
      );
    }

    // Set up event listeners
    socketClient.onRoomUpdate(setRoom);
    socketClient.onGameStart((gameStateData) => {
      setGameState(gameStateData);
      setCurrentQuestion(gameStateData.question);
    });
    socketClient.onRoundQuestion((question, timeRemaining) => {
      setCurrentQuestion(question);
      setGameState(prev => prev ? { ...prev, question, phase: GamePhase.ANSWERING, timeRemaining } : null);
    });
    socketClient.onVotingStart((answers, timeRemaining) => {
      setVotingAnswers(answers);
      setGameState(prev => prev ? { ...prev, phase: GamePhase.VOTING, timeRemaining } : null);
    });
    socketClient.onRoundResults((results) => {
      setRoundResults(results);
      setGameState(prev => prev ? { ...prev, phase: GamePhase.REVEAL } : null);
    });
    socketClient.onGameEnd((scores) => {
      setFinalScores(scores);
      setGameState(prev => prev ? { ...prev, phase: GamePhase.REVEAL } : null);
    });
    socketClient.onPlayerDisconnect((playerId) => {
      // Handle player disconnect
    });
    socketClient.onError((message) => {
      setError(message);
      setLoading(false);
    });

    return () => {
      socketClient.off('room:update', setRoom);
      socketClient.off('game:start');
      socketClient.off('round:question');
      socketClient.off('round:voting_start');
      socketClient.off('round:results');
      socketClient.off('game:end');
      socketClient.off('error');
      socketClient.disconnect();
    };
  }, [roomCode, nickname, router, isCreateMode]);

  const handleStartGame = () => {
    if (room && room.players.length >= 2) {
      socketClient.startGame();
    }
  };

  const handleSubmitAnswer = (answer: string) => {
    socketClient.submitAnswer({ answer });
  };

  const handleSubmitVote = (answerId: string) => {
    socketClient.submitVote({ answerId });
  };

  const handleNextRound = () => {
    socketClient.nextRound();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Ошибка</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-white text-xl">Комната не найдена</div>
      </div>
    );
  }

  // Render different screens based on game state
  const currentPlayer = room.players.find(p => p.id === currentPlayerId) || room.players.find(p => p.nickname === nickname) || null;
  
  if (gameState) {
    if (gameState.phase === GamePhase.ANSWERING && currentQuestion) {
      return (
        <GameScreen
          question={currentQuestion}
          timeRemaining={gameState.timeRemaining || 90}
          currentRound={gameState.currentRound}
          onSubmitAnswer={handleSubmitAnswer}
          currentPlayer={currentPlayer}
        />
      );
    }

    if (gameState.phase === GamePhase.VOTING && votingAnswers.length > 0) {
      return (
        <VotingScreen
          answers={votingAnswers}
          timeRemaining={gameState.timeRemaining || 60}
          currentRound={gameState.currentRound}
          onSubmitVote={handleSubmitVote}
          currentPlayer={currentPlayer}
        />
      );
    }

    if (gameState.phase === GamePhase.REVEAL) {
      if (roundResults) {
        return (
          <ResultsScreen
            results={roundResults}
            currentRound={gameState.currentRound}
            totalRounds={room.settings.roundCount}
            onNextRound={handleNextRound}
            isGameEnd={false}
          />
        );
      }

      if (finalScores.length > 0) {
        return (
          <ResultsScreen
            results={{ answers: [], votes: [], scores: finalScores }}
            currentRound={room.settings.roundCount}
            totalRounds={room.settings.roundCount}
            onNextRound={() => router.push('/')}
            isGameEnd={true}
          />
        );
      }
    }
  }

  // Default to lobby
  return (
    <Lobby
      room={room}
      currentPlayer={currentPlayer}
      onStartGame={handleStartGame}
    />
  );
}
