import { useState, useEffect, useCallback } from 'react';
import { Player, Position, GameState } from '@/types/sports';
import { toast } from '@/hooks/use-toast';

const QUARTER_DURATION = 15 * 60; // 15 minutes in seconds
const MAX_PLAYERS_PER_POSITION = 6;

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('gameState');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      isPlaying: false,
      currentQuarter: 1,
      quarterTime: 0,
      totalTime: 0,
      players: [],
      activePlayersByPosition: {
        forward: [],
        midfield: [],
        defense: [],
      },
    };
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('gameState', JSON.stringify(gameState));
  }, [gameState]);

  // Load players from localStorage
  useEffect(() => {
    const savedPlayers = localStorage.getItem('players');
    if (savedPlayers && gameState.players.length === 0) {
      const players = JSON.parse(savedPlayers);
      setGameState(prev => ({ ...prev, players }));
    }
  }, [gameState.players.length]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameState.isPlaying) {
      interval = setInterval(() => {
        setGameState(prev => {
          const newQuarterTime = prev.quarterTime + 1;
          const newTotalTime = prev.totalTime + 1;
          
          // Update player time stats
          const updatedPlayers = prev.players.map(player => {
            if (player.isActive && player.currentPosition) {
              const newTimeStats = { ...player.timeStats };
              newTimeStats[player.currentPosition] += 1;
              
              const newQuarterStats = { ...player.quarterStats };
              if (!newQuarterStats[prev.currentQuarter]) {
                newQuarterStats[prev.currentQuarter] = { forward: 0, midfield: 0, defense: 0 };
              }
              newQuarterStats[prev.currentQuarter][player.currentPosition] += 1;
              
              return {
                ...player,
                timeStats: newTimeStats,
                quarterStats: newQuarterStats,
              };
            }
            return player;
          });

          return {
            ...prev,
            quarterTime: newQuarterTime,
            totalTime: newTotalTime,
            players: updatedPlayers,
          };
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [gameState.isPlaying]);

  const togglePlayer = useCallback((playerId: string, position: Position) => {
    setGameState(prev => {
      const player = prev.players.find(p => p.id === playerId);
      if (!player) return prev;

      const currentPositionPlayers = prev.activePlayersByPosition[position];
      const isPlayerActiveInPosition = currentPositionPlayers.includes(playerId);

      if (isPlayerActiveInPosition) {
        // Remove player from field
        return {
          ...prev,
          players: prev.players.map(p =>
            p.id === playerId
              ? { ...p, isActive: false, currentPosition: null }
              : p
          ),
          activePlayersByPosition: {
            ...prev.activePlayersByPosition,
            [position]: currentPositionPlayers.filter(id => id !== playerId),
          },
        };
      } else {
        // Add player to field
        if (currentPositionPlayers.length >= MAX_PLAYERS_PER_POSITION) {
          toast({
            title: "Position Full",
            description: `Maximum ${MAX_PLAYERS_PER_POSITION} players allowed in ${position}`,
            variant: "destructive",
          });
          return prev;
        }

        // Remove player from any other position first
        const newActivePlayersByPosition = { ...prev.activePlayersByPosition };
        Object.keys(newActivePlayersByPosition).forEach(pos => {
          newActivePlayersByPosition[pos as Position] = newActivePlayersByPosition[pos as Position].filter(id => id !== playerId);
        });
        newActivePlayersByPosition[position].push(playerId);

        return {
          ...prev,
          players: prev.players.map(p =>
            p.id === playerId
              ? { ...p, isActive: true, currentPosition: position }
              : p
          ),
          activePlayersByPosition: newActivePlayersByPosition,
        };
      }
    });
  }, []);

  const startGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isPlaying: true }));
    toast({
      title: "Game Started",
      description: `Quarter ${gameState.currentQuarter} is now in progress`,
    });
  }, [gameState.currentQuarter]);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isPlaying: false }));
    toast({
      title: "Game Paused",
      description: "Timer stopped",
    });
  }, []);

  const nextQuarter = useCallback(() => {
    if (gameState.currentQuarter < 4) {
      setGameState(prev => ({
        ...prev,
        currentQuarter: prev.currentQuarter + 1,
        quarterTime: 0,
        isPlaying: false,
      }));
      toast({
        title: "Next Quarter",
        description: `Starting Quarter ${gameState.currentQuarter + 1}`,
      });
    }
  }, [gameState.currentQuarter]);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      currentQuarter: 1,
      quarterTime: 0,
      totalTime: 0,
      players: prev.players.map(player => ({
        ...player,
        isActive: false,
        currentPosition: null,
        timeStats: { forward: 0, midfield: 0, defense: 0 },
        quarterStats: {},
      })),
      activePlayersByPosition: {
        forward: [],
        midfield: [],
        defense: [],
      },
    }));
    toast({
      title: "Game Reset",
      description: "All stats cleared and ready for new game",
    });
  }, []);

  return {
    gameState,
    togglePlayer,
    startGame,
    pauseGame,
    nextQuarter,
    resetGame,
  };
};