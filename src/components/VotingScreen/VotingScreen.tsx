'use client';

import { useState, useEffect } from 'react';
import { Answer, Player } from '@/types/game.types';

interface VotingScreenProps {
  answers: Answer[];
  timeRemaining: number;
  onSubmitVote: (answerId: string) => void;
  currentPlayer: Player | null;
}

export default function VotingScreen({ answers, timeRemaining, onSubmitVote, currentPlayer }: VotingScreenProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(timeRemaining);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    setTimeLeft(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const handleSubmit = () => {
    if (selectedAnswer && !isSubmitted) {
      onSubmitVote(selectedAnswer);
      setIsSubmitted(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 10) return 'text-red-600';
    if (timeLeft <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  // For now, use answers as-is without shuffling to avoid React purity issues
  // In production, the server should handle shuffling
  const displayAnswers = answers;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="w-full max-w-2xl p-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-medium text-gray-600">
              Раунд 1 - Голосование
            </div>
            <div className={`text-2xl font-bold ${getTimeColor()}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Выберите правильный ответ
          </h1>
          <p className="text-gray-600">
            Один из этих вариантов - правдивый, остальные - выдумки игроков
          </p>
        </div>

        {!isSubmitted ? (
          <div className="space-y-3">
            {displayAnswers.map((answer: Answer, index: number) => (
              <button
                key={answer.id}
                onClick={() => setSelectedAnswer(answer.id)}
                disabled={answer.playerId === currentPlayer?.id} // Can't vote for own answer
                className={`w-full p-4 rounded-lg border-2 text-left transition duration-200 ${
                  selectedAnswer === answer.id
                    ? 'border-purple-500 bg-purple-50'
                    : answer.playerId === currentPlayer?.id
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      selectedAnswer === answer.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="font-medium text-gray-800">
                      {answer.text}
                    </span>
                  </div>
                  {answer.playerId === currentPlayer?.id && (
                    <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full">
                      ВАШ ОТВЕТ
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Голос учтён!
            </h3>
            <p className="text-gray-600">
              Ожидание остальных игроков...
            </p>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer || isSubmitted}
            className={`w-full py-3 px-4 font-semibold rounded-lg transition duration-200 ${
              selectedAnswer && !isSubmitted
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitted ? 'Голос отправлен' : 'Проголосовать'}
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Совет: Попробуйте угадать, какой ответ является настоящим!</p>
          <p className="mt-1">+1000 очков за правильный ответ, +500 за каждого обманутого игрока</p>
        </div>
      </div>
    </div>
  );
}
