import { useState, useEffect, useCallback } from 'react';
import { Player, Position, GameState, PlannedInterchange } from '@/types/sports';
import { toast } from '@/hooks/use-toast';
import { migratePlayerToSeasonFormat, completeGameForPlayer } from '@/utils/seasonManager';

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
        parsedState.players = parsedState.players.map(migratePlayerToSeasonFormat);
      }
      
      // Add missing season fields if they don't exist
      if (!parsedState.currentSeason) {
        parsedState.currentSeason = new Date().getFullYear();
      }
      if (!parsedState.matchDay) {
        parsedState.matchDay = 1;
      }
      if (!parsedState.gameDate) {
        parsedState.gameDate = new Date().toISOString().split('T')[0];
      }
      if (parsedState.gameCompleted === undefined) {
        parsedState.gameCompleted = false;
      }
      
      return parsedState;
    }
    return {
      currentSeason: new Date().getFullYear(),
      matchDay: 1,
      gameDate: new Date().toISOString().split('T')[0],
      isPlaying: false,
      currentQuarter: 1,
      quarterTime: 0,
      totalTime: 0,
      gameCompleted: false,
      players: [],
      activePlayersByPosition: {
        forward: [],
        midfield: [],
        defence: [],
      },
      plannedInterchanges: [],
    };
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('gameState', JSON.stringify(gameState));
  }, [gameState]);

  // Load players from localStorage and sync updates
  useEffect(() => {
    const syncPlayers = () => {
      const savedPlayers = localStorage.getItem('sport-rotation-players');
      if (savedPlayers) {
        const players = JSON.parse(savedPlayers);
        const migratedPlayers = players.map(migratePlayerToSeasonFormat);
        setGameState(prev => {
          // Preserve current game state for existing players, but update names and other persistent data
          const updatedPlayers = migratedPlayers.map(savedPlayer => {
            const existingPlayer = prev.players.find(p => p.id === savedPlayer.id);
            if (existingPlayer) {
              return {
                ...existingPlayer,
                name: savedPlayer.name,
                guernseyNumber: savedPlayer.guernseyNumber,
                seasonStats: savedPlayer.seasonStats,
              };
            }
            return savedPlayer;
          });
          return { ...prev, players: updatedPlayers };
        });
      }
    };

    // Initial load
    if (gameState.players.length === 0) {
      syncPlayers();
    }

    // Listen for storage changes (when Settings updates players)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sport-rotation-players') {
        syncPlayers();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
        // Remove player from field (goes to bench)
        return {
          ...prev,
          players: prev.players.map(p =>
            p.id === playerId
              ? { ...p, isActive: false, currentPosition: null, lastInterchangeTime: prev.totalTime }
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
              ? { ...p, isActive: true, currentPosition: position, lastInterchangeTime: !p.isActive ? prev.totalTime : p.lastInterchangeTime }
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
                return { ...p, isActive: true, currentPosition: targetPosition, lastInterchangeTime: !p.isActive ? prev.totalTime : p.lastInterchangeTime };
              }
              if (p.id === playerToSwap.id) {
                return { ...p, isActive: true, currentPosition: sourcePosition, lastInterchangeTime: !p.isActive ? prev.totalTime : p.lastInterchangeTime };
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
            ? { ...p, isActive: true, currentPosition: targetPosition, lastInterchangeTime: !p.isActive ? prev.totalTime : p.lastInterchangeTime }
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

      // Migration helper: convert old "defense" to new "defence"
      const migratePosition = (position: string | null): Position | null => {
        if (!position) return null;
        return position === 'defense' ? 'defence' : position as Position;
      };

      // Get migrated current positions
      const player1CurrentPos = migratePosition(player1.currentPosition);
      const player2CurrentPos = migratePosition(player2.currentPosition);

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

      // Determine their new positions (swap) - using migrated positions
      const player1NewPosition = player2CurrentPos;
      const player2NewPosition = player1CurrentPos;

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
              // Update lastInterchangeTime: 
              // - If coming from bench to field (was inactive, now active): set to current time
              // - If going from field to bench (was active, now inactive): set to current time
              // - If staying on field (was active, still active): keep existing time
              lastInterchangeTime: (player1NewPosition && !player1.isActive) || (!player1NewPosition && player1.isActive) 
                ? prev.totalTime 
                : p.lastInterchangeTime
            };
          }
          if (p.id === player2Id) {
            return { 
              ...p, 
              isActive: !!player2NewPosition, 
              currentPosition: player2NewPosition,
              // Update lastInterchangeTime: 
              // - If coming from bench to field (was inactive, now active): set to current time
              // - If going from field to bench (was active, now inactive): set to current time
              // - If staying on field (was active, still active): keep existing time
              lastInterchangeTime: (player2NewPosition && !player2.isActive) || (!player2NewPosition && player2.isActive) 
                ? prev.totalTime 
                : p.lastInterchangeTime
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
            ? { ...p, isActive: false, currentPosition: null, lastInterchangeTime: prev.totalTime }
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

  const addPlannedInterchange = useCallback((playerId: string, targetPosition: Position, priority: 'high' | 'medium' | 'low' = 'medium') => {
    setGameState(prev => ({
      ...prev,
      plannedInterchanges: [...prev.plannedInterchanges, {
        id: `sub-${Date.now()}`,
        playerId,
        targetPosition,
        priority,
      }],
    }));
    toast({
      title: "Interchange Planned",
      description: "Added to interchange queue",
    });
  }, []);

  const removePlannedInterchange = useCallback((subId: string) => {
    setGameState(prev => ({
      ...prev,
      plannedInterchanges: prev.plannedInterchanges.filter(sub => sub.id !== subId),
    }));
  }, []);

  const executePlannedInterchange = useCallback((subId: string) => {
    const interchange = gameState.plannedInterchanges.find(sub => sub.id === subId);
    if (interchange) {
      movePlayer(interchange.playerId, interchange.targetPosition);
      removePlannedInterchange(subId);
    }
  }, [gameState.plannedInterchanges, movePlayer, removePlannedInterchange]);


  const completeGame = useCallback((result?: 'win' | 'loss' | 'draw', opponent?: string) => {
    setGameState(prev => {
      // Complete the game for all players and save to season history
      const completedPlayers = prev.players.map(player => 
        completeGameForPlayer(
          player, 
          prev.matchDay, 
          prev.gameDate,
          opponent,
          prev.venue,
          result
        )
      );

      // Save updated players to localStorage
      localStorage.setItem('sport-rotation-players', JSON.stringify(completedPlayers));

      toast({
        title: "Game Completed",
        description: `Match Day ${prev.matchDay} stats saved to season history`,
      });

      return {
        ...prev,
        players: completedPlayers,
        gameCompleted: true,
        isPlaying: false,
      };
    });
  }, []);

  const startNewGame = useCallback((matchDay?: number, opponent?: string, venue?: 'home' | 'away') => {
    setGameState(prev => ({
      ...prev,
      matchDay: matchDay || prev.matchDay + 1,
      gameDate: new Date().toISOString().split('T')[0],
      opponent,
      venue,
      isPlaying: false,
      currentQuarter: 1,
      quarterTime: 0,
      totalTime: 0,
      gameCompleted: false,
      // Reset all current game stats but keep season data
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
      plannedInterchanges: [],
    }));
    
    toast({
      title: "New Game Started",
      description: `Match Day ${matchDay || gameState.matchDay + 1} is ready`,
    });
  }, [gameState.matchDay]);

  return {
    gameState,
    togglePlayer,
    movePlayer,
    removePlayer,
    swapPlayers,
    startGame,
    pauseGame,
    nextQuarter,
    
    addPlannedInterchange,
    removePlannedInterchange,
    executePlannedInterchange,
    completeGame,
    startNewGame,
  };
};