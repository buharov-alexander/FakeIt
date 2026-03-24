'use client';

import { useState, useEffect } from 'react';
import { Question } from '@/types/game.types';

interface GameScreenProps {
  question: Question;
  timeRemaining: number;
  currentRound: number;
  onSubmitAnswer: (answer: string) => void;
}

export default function GameScreen({ question, timeRemaining, currentRound, onSubmitAnswer }: GameScreenProps) {
  const [answer, setAnswer] = useState('');
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
    if (answer.trim() && !isSubmitted) {
      onSubmitAnswer(answer.trim());
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral">
      <div className="w-90 max-w-2xl p-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-medium text-gray-600">
              Раунд {currentRound}
            </div>
            <div className={`text-2xl font-bold ${getTimeColor()}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Придумайте ложный ответ
          </h1>
        </div>

        <div className="mb-8">
          <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
            <div className="text-xl leading-relaxed text-gray-800">
              {question.text.split('_____').map((part, index, array) => (
                <span key={index}>
                  {part}
                  {index < array.length - 1 && (
                    <span className="inline-block min-w-[120px] h-8 bg-purple-200 rounded mx-2 animate-pulse" />
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        {!isSubmitted ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                Ваш ответ (ложь):
              </label>
              <textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Введите ваш выдуманный ответ..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none"
                rows={3}
                maxLength={200}
                disabled={isSubmitted}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {answer.length}/200
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!answer.trim() || isSubmitted}
              className={`w-full py-3 px-4 font-semibold rounded-lg transition duration-200 ${
                answer.trim() && !isSubmitted
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitted ? 'Ответ отправлен' : 'Отправить ответ'}
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Ответ отправлен!
            </h3>
            <p className="text-gray-600">
              Ожидание остальных игроков...
            </p>
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Ваш ответ:</p>
              <p className="font-medium text-gray-800">{answer}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
