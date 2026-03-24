'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleSubmit = () => {
    if (!nickname.trim()) return;
    
    setIsProcessing(true);
    
    if (roomCode.trim()) {
      // Присоединяемся к комнате
      router.push(`/room/${roomCode.toUpperCase()}?nickname=${encodeURIComponent(nickname)}`);
    } else {
      // Создаем новую комнату
      const tempCode = 'TEMP';
      const url = `/room/${tempCode}?nickname=${encodeURIComponent(nickname)}&create=true`;
      router.push(url);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral font-sans">
      <div className="w-90 max-w-md p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
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
              onKeyDown={handleKeyDown}
              placeholder="Введите никнейм"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
              maxLength={20}
            />
          </div>

          <div>
            <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
              Код комнаты (необязательно)
            </label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="ABC123"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
              maxLength={6}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!nickname.trim() || isProcessing}
            className="w-full py-3 px-4 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-md"
          >
            {isProcessing ? 'Обработка...' : roomCode.trim() ? 'Присоединиться' : 'Создать игру'}
          </button>
        </div>
      </div>
    </div>
  );
}
