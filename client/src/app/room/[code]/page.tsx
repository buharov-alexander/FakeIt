'use client';

import { useRoom } from '@/hooks/useRoom';
import Lobby from '@/components/Lobby';
import GameScreen from '@/components/GameScreen';
import VotingScreen from '@/components/VotingScreen';
import ResultsScreen from '@/components/ResultsScreen';
import { GamePhase, TIMER_CONSTANTS } from '@/types/game.types';

export default function RoomPage() {
  const {
    room,
    gameState,
    currentQuestion,
    votingAnswers,
    roundResults,
    finalScores,
    error,
    loading,
    currentPlayer,
    isCurrentPlayerHost,
    handleStartGame,
    handleSubmitAnswer,
    handleSubmitVote,
    handleNextRound,
  } = useRoom();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Ошибка</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
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
      <div className="flex min-h-screen items-center justify-center bg-neutral">
        <div className="text-white text-xl">Комната не найдена</div>
      </div>
    );
  }

  if (gameState) {
    if (gameState.phase === GamePhase.ANSWERING && currentQuestion) {
      return (
        <GameScreen
          question={currentQuestion}
          timeRemaining={gameState.timeRemaining || TIMER_CONSTANTS.DEFAULT_ANSWER_TIME}
          currentRound={gameState.currentRound}
          onSubmitAnswer={handleSubmitAnswer}
        />
      );
    }

    if (gameState.phase === GamePhase.VOTING && votingAnswers.length > 0) {
      return (
        <VotingScreen
          answers={votingAnswers}
          timeRemaining={gameState.timeRemaining || TIMER_CONSTANTS.DEFAULT_VOTE_TIME}
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
            onNextRound={handleNextRound}
            isGameEnd={false}
            isHost={isCurrentPlayerHost}
          />
        );
      }

      if (finalScores.length > 0) {
        return (
          <ResultsScreen
            results={{ answers: [], votes: [], scores: finalScores }}
            currentRound={gameState?.currentRound || 0}
            onNextRound={() => {}}
            isGameEnd={true}
            isHost={isCurrentPlayerHost}
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
