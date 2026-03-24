'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const handleCreateGame = () => {
    if (!nickname.trim()) return;
    
    setIsCreating(true);
    
    // Генерируем временный код и редиректим
    const tempCode = 'TEMP';
    const url = `/room/${tempCode}?nickname=${encodeURIComponent(nickname)}&create=true`;
    router.push(url);
  };

  const handleJoinGame = () => {
    if (!nickname.trim() || !roomCode.trim()) return;
    
    setIsJoining(true);
    router.push(`/room/${roomCode.toUpperCase()}?nickname=${encodeURIComponent(nickname)}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 font-sans">
      <div className="w-90 max-w-md p-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Fibbage</h1>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
              Ваш никнейм
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Введите никнейм"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              maxLength={20}
            />
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCreateGame}
              disabled={!nickname.trim() || isCreating}
              className="w-full py-3 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {isCreating ? 'Создание...' : 'Создать игру'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">или</span>
              </div>
            </div>

            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
                Код комнаты
              </label>
              <input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                maxLength={6}
              />
            </div>

            <button
              onClick={handleJoinGame}
              disabled={!nickname.trim() || !roomCode.trim() || isJoining}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {isJoining ? 'Присоединение...' : 'Присоединиться'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
