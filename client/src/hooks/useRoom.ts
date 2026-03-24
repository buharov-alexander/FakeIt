import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { socketClient } from '@/lib/socket-client';
import { Room, GameState, Question, Answer, Player, Vote, GamePhase, TIMER_CONSTANTS } from '@/types/game.types';

export function useRoom() {
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

    // Если уже подключены к сокету, ничего не делаем
    if (socketClient.getSocketId()) {
      return;
    }

    // Connect to socket
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
    socketClient.onPlayerDisconnect(() => {
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

  // Render different screens based on game state
  const currentPlayer = room?.players.find(p => p.id === currentPlayerId) || room?.players.find(p => p.nickname === nickname) || null;
  const isCurrentPlayerHost = currentPlayer ? currentPlayer.id === room?.hostId : false;

  return {
    // State
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
    
    // Actions
    handleStartGame,
    handleSubmitAnswer,
    handleSubmitVote,
    handleNextRound,
  };
}
