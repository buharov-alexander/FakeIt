'use client';

import { Room, Player } from '@/types/game.types';

interface LobbyProps {
  room: Room;
  currentPlayer: Player | null;
  onStartGame: () => void;
}

export default function Lobby({ room, currentPlayer, onStartGame }: LobbyProps) {
  const isHost = currentPlayer?.id === room.hostId;
  const canStartGame = room.players.length >= 2 && isHost;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral">
      <div className="w-90 max-w-2xl p-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Лобби</h1>
          <div className="flex items-center justify-center gap-2 text-lg">
            <span className="text-gray-600">Код комнаты:</span>
            <span className="font-mono font-bold text-purple-600 text-2xl bg-purple-100 px-3 py-1 rounded">
              {room.code}
            </span>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Игроки ({room.players.length}/{room.settings.maxPlayers})
          </h2>
          <div className="space-y-2">
            {room.players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.id === room.hostId
                    ? 'bg-purple-50 border-2 border-purple-200'
                    : 'bg-gray-50 border-2 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    player.isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium text-gray-800">
                    {player.nickname}
                  </span>
                  {player.id === room.hostId && (
                    <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                      ХОСТ
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {player.score} очков
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Настройки игры</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Раунды:</span>
              <span className="ml-2 font-medium text-gray-800">{room.settings.roundCount}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Время на ответ:</span>
              <span className="ml-2 font-medium text-gray-800">{room.settings.answerTimerSec}с</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Время на голосование:</span>
              <span className="ml-2 font-medium text-gray-800">{room.settings.voteTimerSec}с</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Макс. игроков:</span>
              <span className="ml-2 font-medium text-gray-800">{room.settings.maxPlayers}</span>
            </div>
          </div>
        </div>

        {room.players.length < 2 && (
          <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-center">
              Нужно минимум 2 игрока для начала игры
            </p>
          </div>
        )}

        {isHost && (
          <button
            onClick={onStartGame}
            disabled={!canStartGame}
            className="w-full py-3 px-4 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-md"
          >
            {room.players.length < 2
              ? `Ожидание игроков (${room.players.length}/2)`
              : 'Начать игру'
            }
          </button>
        )}

        {!isHost && (
          <div className="text-center text-gray-500">
            <p>Ожидание начала игры от хоста...</p>
          </div>
        )}
      </div>
    </div>
  );
}
