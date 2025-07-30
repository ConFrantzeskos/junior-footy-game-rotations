import { useState, useEffect, useCallback } from 'react';
import { Player, Position, GameState, PlannedSubstitution } from '@/types/sports';
import { toast } from '@/hooks/use-toast';

const QUARTER_DURATION = 15 * 60; // 15 minutes in seconds
const MAX_PLAYERS_PER_POSITION = 6;

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('gameState');
    if (saved) {
      const parsedState = JSON.parse(saved);
      
      // Data migration: handle old "defense" to new "defence" 
      if (parsedState.activePlayersByPosition && parsedState.activePlayersByPosition.defense) {
        parsedState.activePlayersByPosition.defence = parsedState.activePlayersByPosition.defense;
        delete parsedState.activePlayersByPosition.defense;
      }
      
      // Ensure all players have updated structure
      if (parsedState.players) {
        parsedState.players = parsedState.players.map((player: any) => ({
          ...player,
          timeStats: {
            forward: player.timeStats?.forward || 0,
            midfield: player.timeStats?.midfield || 0,
            defence: player.timeStats?.defence || player.timeStats?.defense || 0,
          },
          quarterStats: player.quarterStats || {},
          guernseyNumber: player.guernseyNumber || player.jerseyNumber,
        }));
      }
      
      return parsedState;
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
        defence: [],
      },
      plannedSubstitutions: [],
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
          
          // Check if quarter time has reached 15 minutes (900 seconds)
          if (newQuarterTime >= QUARTER_DURATION) {
            // Auto-pause at end of quarter
            toast({
              title: "Quarter Complete",
              description: `Quarter ${prev.currentQuarter} finished (15 minutes)`,
            });
            
            return {
              ...prev,
              isPlaying: false,
              quarterTime: QUARTER_DURATION,
              totalTime: newTotalTime,
            };
          }
          
          // Update player time stats
          const updatedPlayers = prev.players.map(player => {
            if (player.isActive && player.currentPosition) {
              const newTimeStats = { ...player.timeStats };
              newTimeStats[player.currentPosition] += 1;
              
              const newQuarterStats = { ...player.quarterStats };
              if (!newQuarterStats[prev.currentQuarter]) {
                newQuarterStats[prev.currentQuarter] = { forward: 0, midfield: 0, defence: 0 };
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
              ? { ...p, isActive: true, currentPosition: position, lastInterchangeTime: prev.totalTime }
              : p
          ),
          activePlayersByPosition: newActivePlayersByPosition,
        };
      }
    });
  }, []);

  const movePlayer = useCallback((playerId: string, targetPosition: Position, sourcePosition?: Position) => {
    setGameState(prev => {
      const player = prev.players.find(p => p.id === playerId);
      if (!player) return prev;

      const targetPositionPlayers = prev.activePlayersByPosition[targetPosition];
      
      // If target position is full, perform hot-swap
      if (targetPositionPlayers.length >= MAX_PLAYERS_PER_POSITION) {
        // Find a player to swap out (prefer the one with most time in that position)
        const playerToSwap = targetPositionPlayers
          .map(id => prev.players.find(p => p.id === id)!)
          .sort((a, b) => b.timeStats[targetPosition] - a.timeStats[targetPosition])[0];

        if (sourcePosition && playerToSwap) {
          // Hot-swap: move the displaced player to source position
          const newActivePlayersByPosition = { ...prev.activePlayersByPosition };
          
          // Remove both players from their current positions
          Object.keys(newActivePlayersByPosition).forEach(pos => {
            newActivePlayersByPosition[pos as Position] = newActivePlayersByPosition[pos as Position]
              .filter(id => id !== playerId && id !== playerToSwap.id);
          });
          
          // Place players in their new positions
          newActivePlayersByPosition[targetPosition].push(playerId);
          newActivePlayersByPosition[sourcePosition].push(playerToSwap.id);

          return {
            ...prev,
            players: prev.players.map(p => {
              if (p.id === playerId) {
                return { ...p, isActive: true, currentPosition: targetPosition, lastInterchangeTime: prev.totalTime };
              }
              if (p.id === playerToSwap.id) {
                return { ...p, isActive: true, currentPosition: sourcePosition, lastInterchangeTime: prev.totalTime };
              }
              return p;
            }),
            activePlayersByPosition: newActivePlayersByPosition,
          };
        } else {
          // Can't swap, target position is full
          toast({
            title: "Position Full",
            description: `Cannot move player - ${targetPosition} is full`,
            variant: "destructive",
          });
          return prev;
        }
      }

      // Normal move - target position has space
      const newActivePlayersByPosition = { ...prev.activePlayersByPosition };
      
      // Remove player from any current position
      Object.keys(newActivePlayersByPosition).forEach(pos => {
        newActivePlayersByPosition[pos as Position] = newActivePlayersByPosition[pos as Position]
          .filter(id => id !== playerId);
      });
      
      // Add to target position
      newActivePlayersByPosition[targetPosition].push(playerId);

      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === playerId
            ? { ...p, isActive: true, currentPosition: targetPosition, lastInterchangeTime: prev.totalTime }
            : p
        ),
        activePlayersByPosition: newActivePlayersByPosition,
      };
    });
  }, []);

  const swapPlayers = useCallback((player1Id: string, player2Id: string) => {
    setGameState(prev => {
      const player1 = prev.players.find(p => p.id === player1Id);
      const player2 = prev.players.find(p => p.id === player2Id);
      
      if (!player1 || !player2) return prev;

      // Create deep copy to avoid mutation issues
      const newActivePlayersByPosition = {
        forward: [...prev.activePlayersByPosition.forward],
        midfield: [...prev.activePlayersByPosition.midfield],
        defence: [...prev.activePlayersByPosition.defence],
      };
      
      // Remove both players from all positions first
      newActivePlayersByPosition.forward = newActivePlayersByPosition.forward.filter(id => id !== player1Id && id !== player2Id);
      newActivePlayersByPosition.midfield = newActivePlayersByPosition.midfield.filter(id => id !== player1Id && id !== player2Id);
      newActivePlayersByPosition.defence = newActivePlayersByPosition.defence.filter(id => id !== player1Id && id !== player2Id);

      // Determine their new positions (swap)
      const player1NewPosition = player2.currentPosition;
      const player2NewPosition = player1.currentPosition;

      // Add players to their swapped positions
      if (player1NewPosition) {
        newActivePlayersByPosition[player1NewPosition].push(player1Id);
      }
      if (player2NewPosition) {
        newActivePlayersByPosition[player2NewPosition].push(player2Id);
      }

      return {
        ...prev,
        players: prev.players.map(p => {
          if (p.id === player1Id) {
            return { 
              ...p, 
              isActive: !!player1NewPosition, 
              currentPosition: player1NewPosition,
              lastInterchangeTime: player1NewPosition ? prev.totalTime : p.lastInterchangeTime
            };
          }
          if (p.id === player2Id) {
            return { 
              ...p, 
              isActive: !!player2NewPosition, 
              currentPosition: player2NewPosition,
              lastInterchangeTime: player2NewPosition ? prev.totalTime : p.lastInterchangeTime
            };
          }
          return p;
        }),
        activePlayersByPosition: newActivePlayersByPosition,
      };
    });
  }, []);

  const removePlayer = useCallback((playerId: string) => {
    setGameState(prev => {
      const newActivePlayersByPosition = { ...prev.activePlayersByPosition };
      
      // Remove player from all positions
      Object.keys(newActivePlayersByPosition).forEach(pos => {
        newActivePlayersByPosition[pos as Position] = newActivePlayersByPosition[pos as Position]
          .filter(id => id !== playerId);
      });

      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === playerId
            ? { ...p, isActive: false, currentPosition: null }
            : p
        ),
        activePlayersByPosition: newActivePlayersByPosition,
      };
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

  const addPlannedSubstitution = useCallback((playerId: string, targetPosition: Position, priority: 'high' | 'medium' | 'low' = 'medium') => {
    setGameState(prev => ({
      ...prev,
      plannedSubstitutions: [...prev.plannedSubstitutions, {
        id: `sub-${Date.now()}`,
        playerId,
        targetPosition,
        priority,
      }],
    }));
    toast({
      title: "Substitution Planned",
      description: "Added to substitution queue",
    });
  }, []);

  const removePlannedSubstitution = useCallback((subId: string) => {
    setGameState(prev => ({
      ...prev,
      plannedSubstitutions: prev.plannedSubstitutions.filter(sub => sub.id !== subId),
    }));
  }, []);

  const executePlannedSubstitution = useCallback((subId: string) => {
    const substitution = gameState.plannedSubstitutions.find(sub => sub.id === subId);
    if (substitution) {
      movePlayer(substitution.playerId, substitution.targetPosition);
      removePlannedSubstitution(subId);
    }
  }, [gameState.plannedSubstitutions, movePlayer]);

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
        lastInterchangeTime: 0,
        timeStats: { forward: 0, midfield: 0, defence: 0 },
        quarterStats: {},
      })),
      activePlayersByPosition: {
        forward: [],
        midfield: [],
        defence: [],
      },
      plannedSubstitutions: [],
    }));
    toast({
      title: "Game Reset",
      description: "All stats cleared and ready for new game",
    });
  }, []);

  return {
    gameState,
    togglePlayer,
    movePlayer,
    removePlayer,
    swapPlayers,
    startGame,
    pauseGame,
    nextQuarter,
    resetGame,
    addPlannedSubstitution,
    removePlannedSubstitution,
    executePlannedSubstitution,
  };
};