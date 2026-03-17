'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { socketClient } from '@/lib/socket-client';
import { PhaseManager } from '@/lib/phase-manager';
import { GAME_PHASES } from '@/lib/game-phases';
import { Room, GameState, Question, Answer, Player } from '@/types/game.types';
import { generateMockGameState, generateMockFinalScores } from '@/lib/mock-data';
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
  const [roundResults, setRoundResults] = useState<any>(null);
  const [finalScores, setFinalScores] = useState<Player[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [phaseManager, setPhaseManager] = useState<PhaseManager | null>(null);

  const roomCode = params.code as string;
  const nickname = searchParams.get('nickname');

  useEffect(() => {
    if (!roomCode || !nickname) {
      router.push('/');
      return;
    }

    // Connect to socket
    socketClient.connect();

    // Join room
    socketClient.joinRoom(
      { code: roomCode, nickname },
      (roomData: Room) => {
        setRoom(roomData);
        const manager = new PhaseManager(roomData.players);
        setPhaseManager(manager);
        setLoading(false);
      }
    );

    // Set up event listeners
    socketClient.onRoomUpdate(setRoom);
    socketClient.onGameStart((gameStateData) => {
      setGameState(gameStateData);
      setCurrentQuestion(gameStateData.question);
    });

    socketClient.onRoundQuestion((question, timeRemaining) => {
      setCurrentQuestion(question);
      setGameState(prev => prev ? { ...prev, question, phase: 'answering', timeRemaining } : null);
    });

    socketClient.onVotingStart((answers, timeRemaining) => {
      setVotingAnswers(answers);
      setGameState(prev => prev ? { ...prev, phase: 'voting', timeRemaining } : null);
    });

    socketClient.onRoundResults((_results) => {
      if (phaseManager) {
        const mockResults = phaseManager.finishVoting();
        setRoundResults(mockResults);
        setGameState(prev => prev ? { ...prev, phase: GAME_PHASES.REVEAL } : null);
      }
    });

    socketClient.onGameEnd((_scores) => {
      if (phaseManager) {
        const finalScores = generateMockFinalScores(room?.players || []);
        setFinalScores(finalScores);
        setGameState(prev => prev ? { ...prev, phase: GAME_PHASES.REVEAL } : null);
      }
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
  }, [roomCode, nickname, router, room?.players, phaseManager]);

  const handleStartGame = () => {
    if (room && room.players.length >= 2 && phaseManager) {
      const gameState = phaseManager.startGame();
      setGameState(gameState);
      setCurrentQuestion(gameState.question);
      setRoom(prev => prev ? { ...prev, status: GAME_PHASES.PLAYING } : null);
    }
  };

  const handleSubmitAnswer = (answer: string) => {
    socketClient.submitAnswer({ answer });
    // В mock режиме симулируем переход к голосованию
    if (phaseManager) {
      setTimeout(() => {
        const votingData = phaseManager.finishAnswering();
        setVotingAnswers(votingData.answers);
        setGameState(prev => prev ? { ...prev, phase: GAME_PHASES.VOTING, timeRemaining: votingData.timeRemaining } : null);
      }, 2000);
    }
  };

  const handleSubmitVote = (answerId: string) => {
    socketClient.submitVote({ answerId });
    // В mock режиме симулируем переход к результатам
    if (phaseManager) {
      setTimeout(() => {
        const resultsData = phaseManager.finishVoting();
        setRoundResults(resultsData);
        setGameState(prev => prev ? { ...prev, phase: GAME_PHASES.REVEAL } : null);
      }, 2000);
    }
  };

  const handleNextRound = () => {
    if (phaseManager) {
      const nextRoundData = phaseManager.nextRound();
      
      if (nextRoundData.isGameEnd && nextRoundData.finalScores) {
        // Игра завершена
        setFinalScores(nextRoundData.finalScores);
        setRoom(prev => prev ? { ...prev, status: GAME_PHASES.FINISHED } : null);
      } else if (nextRoundData.gameState) {
        // Следующий раунд
        setGameState(nextRoundData.gameState);
        setCurrentQuestion(nextRoundData.gameState.question);
        setRoundResults(null);
        setVotingAnswers([]);
      }
    }
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
  if (gameState) {
    if (gameState.phase === GAME_PHASES.ANSWERING && currentQuestion) {
      return (
        <GameScreen
          question={currentQuestion}
          timeRemaining={gameState.timeRemaining || 90}
          onSubmitAnswer={handleSubmitAnswer}
          currentPlayer={room.players.find(p => p.nickname === nickname) || null}
        />
      );
    }

    if (gameState.phase === GAME_PHASES.VOTING && votingAnswers.length > 0) {
      return (
        <VotingScreen
          answers={votingAnswers}
          timeRemaining={gameState.timeRemaining || 60}
          onSubmitVote={handleSubmitVote}
          currentPlayer={room.players.find(p => p.nickname === nickname) || null}
        />
      );
    }

    if (gameState.phase === GAME_PHASES.REVEAL) {
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
      currentPlayer={room.players.find(p => p.nickname === nickname) || null}
      onStartGame={handleStartGame}
    />
  );
}
