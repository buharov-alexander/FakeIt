'use client';

import { useState, useEffect } from 'react';
import { Answer, Vote, Player } from '@/types/game.types';

interface ResultsScreenProps {
  results: {
    answers: Answer[];
    votes: Vote[];
    scores: {
      id: string;
      nickname: string;
      score: number;
      isConnected: boolean;
      roundScoreChange?: number;
    }[];
  };
  currentRound: number;
  onNextRound: () => void;
  isGameEnd: boolean;
  isHost: boolean;
}

export default function ResultsScreen({ results, currentRound, onNextRound, isGameEnd, isHost }: ResultsScreenProps) {
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());

  const revealAnswers = () => {
    results.answers.forEach((answer, index) => {
      setTimeout(() => {
        setRevealedAnswers(prev => new Set(prev).add(answer.id));
      }, index * 500);
    });
  };

  useEffect(() => {
    // Auto-reveal answers after a delay
    const timer = setTimeout(() => {
      revealAnswers();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const getVoteCount = (answerId: string) => {
    return results.votes.filter(vote => vote.answerId === answerId).length;
  };

  const getScoreChange = (answer: Answer) => {
    const voteCount = getVoteCount(answer.id);
    if (answer.isCorrect) {
      return voteCount * 1000; // 1000 points for each correct vote
    } else {
      return voteCount * 500; // 500 points for each fooled player
    }
  };

  const sortedScores = [...results.scores].sort((a, b) => b.score - a.score);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="w-full max-w-3xl p-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isGameEnd ? 'Игра окончена!' : `Результаты раунда ${currentRound}`}
          </h1>
          <p className="text-gray-600">
            {isGameEnd ? 'Поздравляем победителя!' : 'Посмотрим, кто кого обманул'}
          </p>
        </div>

        {!isGameEnd && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Раскрытие ответов</h2>
            <div className="space-y-3">
              {results.answers.map((answer) => (
                <div
                  key={answer.id}
                  className={`p-4 rounded-lg border-2 transition-all duration-500 ${
                    revealedAnswers.has(answer.id)
                      ? answer.isCorrect
                        ? 'border-green-500 bg-green-50'
                        : 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {revealedAnswers.has(answer.id) && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          answer.isCorrect ? 'bg-green-600' : 'bg-blue-600'
                        }`}>
                          <span className="text-white font-bold text-sm">
                            {answer.isCorrect ? '✓' : 'L'}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-800">
                          {revealedAnswers.has(answer.id) ? answer.text : '???'}
                        </div>
                        {revealedAnswers.has(answer.id) && (
                          <div className="text-sm text-gray-600">
                            Автор: {answer.isCorrect ? 'Правильный ответ' : `Игрок`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {revealedAnswers.has(answer.id) && (
                        <>
                          <div className="text-sm text-gray-600">
                            Голосов: {getVoteCount(answer.id)}
                          </div>
                          <div className={`font-semibold ${
                            answer.isCorrect ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            +{getScoreChange(answer)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Таблица очков</h2>
          <div className="space-y-2">
            {sortedScores.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-gray-50 border-2 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800">
                      {player.nickname}
                    </span>
                    {player.roundScoreChange !== undefined && (
                      <span className={`text-sm font-medium ${
                        player.roundScoreChange > 0 ? 'text-green-600' : 
                        player.roundScoreChange < 0 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {player.roundScoreChange > 0 ? '+' : ''}{player.roundScoreChange}
                      </span>
                    )}
                  </div>
                  {index === 0 && (
                    <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full">
                      🏆 ЛИДЕР
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-800">
                    {player.score}
                  </div>
                  {player.roundScoreChange !== undefined && player.roundScoreChange > 0 && (
                    <div className="text-sm text-green-600 font-medium">
                      +{player.roundScoreChange}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onNextRound}
            disabled={!isHost}
            className={`py-3 px-8 font-semibold rounded-lg transition duration-200 ${
              isHost 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isGameEnd ? 'Новая игра' : 'Следующий раунд'}
          </button>
        </div>

        {isGameEnd && sortedScores.length > 0 && (
          <div className="mt-8 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Победитель: {sortedScores[0].nickname}
            </h3>
            <p className="text-xl text-gray-600">
              {sortedScores[0].score} очков
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
