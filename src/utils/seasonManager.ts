import { Player, SeasonStats, GameRecord, PlayerAttributes } from '@/types/sports';

export const createEmptySeasonStats = (): SeasonStats => ({
  totalGameTime: 0,
  gamesPlayed: 0,
  gamesCompleted: 0,
  gamesStarted: 0,
  positionTotals: {
    forward: 0,
    midfield: 0,
    defence: 0,
  },
  positionPerformance: {
    forward: { games: 0, averageTime: 0, effectiveness: 5 },
    midfield: { games: 0, averageTime: 0, effectiveness: 5 },
    defence: { games: 0, averageTime: 0, effectiveness: 5 },
  },
  averageGameTime: 0,
  longestGameTime: 0,
  shortestGameTime: 0,
  consistencyScore: 5,
  monthlyStats: {},
  rotationFrequency: 0,
  versatilityScore: 0,
  reliabilityScore: 5,
  gameHistory: [],
});

export const createDefaultPlayerAttributes = (): PlayerAttributes => ({
  fitness: 5,
  speed: 5,
  endurance: 5,
  positionalVersatility: 5,
  gameReadiness: 5,
  dateJoined: new Date().toISOString().split('T')[0],
  injuryHistory: [],
  isAvailable: true,
});

export const createNewPlayer = (name: string, id?: string, guernseyNumber?: number): Player => ({
  id: id || `player-${Date.now()}`,
  name: name.trim(),
  guernseyNumber,
  attributes: createDefaultPlayerAttributes(),
  seasonStats: createEmptySeasonStats(),
  isActive: false,
  currentPosition: null,
  lastInterchangeTime: 0,
  timeStats: { forward: 0, midfield: 0, defence: 0 },
  quarterStats: {},
  currentGamePerformance: {
    interchanges: 0,
    positionSwitches: 0,
    longestStint: 0,
    lastPositionChangeTime: 0,
  },
});

export const calculateGamePerformance = (player: Player) => {
  const totalGameTime = player.timeStats.forward + player.timeStats.midfield + player.timeStats.defence;
  const interchanges = player.currentGamePerformance.interchanges;
  
  return {
    interchanges,
    minutesPerInterchange: interchanges > 0 ? totalGameTime / interchanges : totalGameTime,
    longestStint: player.currentGamePerformance.longestStint,
    positionSwitches: player.currentGamePerformance.positionSwitches,
  };
};

export const completeGameForPlayer = (
  player: Player,
  matchDay: number,
  gameDate: string,
  opponent?: string,
  venue?: 'home' | 'away',
  result?: 'win' | 'loss' | 'draw'
): Player => {
  const totalGameTime = player.timeStats.forward + player.timeStats.midfield + player.timeStats.defence;
  const performance = calculateGamePerformance(player);
  
  const gameRecord: GameRecord = {
    matchDay,
    date: gameDate,
    opponent,
    venue,
    result,
    timeStats: { ...player.timeStats },
    quarterStats: { ...player.quarterStats },
    totalGameTime,
    completed: true,
    performance,
  };

  const currentMonth = new Date(gameDate).toISOString().slice(0, 7); // YYYY-MM format
  const prevMonthlyStats = player.seasonStats.monthlyStats[currentMonth] || { gamesPlayed: 0, totalTime: 0, averageTime: 0 };
  
  // Update position performance
  const updatedPositionPerformance = { ...player.seasonStats.positionPerformance };
  Object.entries(player.timeStats).forEach(([position, time]) => {
    if (time > 0) {
      const pos = position as keyof typeof updatedPositionPerformance;
      const current = updatedPositionPerformance[pos];
      updatedPositionPerformance[pos] = {
        games: current.games + 1,
        averageTime: (current.averageTime * current.games + time) / (current.games + 1),
        effectiveness: Math.min(10, current.effectiveness + 0.1), // Gradual improvement
      };
    }
  });

  const updatedSeasonStats: SeasonStats = {
    totalGameTime: player.seasonStats.totalGameTime + totalGameTime,
    gamesPlayed: player.seasonStats.gamesPlayed + 1,
    gamesCompleted: player.seasonStats.gamesCompleted + 1,
    gamesStarted: player.seasonStats.gamesStarted + (player.currentGamePerformance.startingPosition ? 1 : 0),
    positionTotals: {
      forward: player.seasonStats.positionTotals.forward + player.timeStats.forward,
      midfield: player.seasonStats.positionTotals.midfield + player.timeStats.midfield,
      defence: player.seasonStats.positionTotals.defence + player.timeStats.defence,
    },
    positionPerformance: updatedPositionPerformance,
    averageGameTime: 0, // Will be calculated below
    longestGameTime: Math.max(player.seasonStats.longestGameTime, totalGameTime),
    shortestGameTime: player.seasonStats.gamesCompleted === 0 ? totalGameTime : Math.min(player.seasonStats.shortestGameTime, totalGameTime),
    consistencyScore: calculateConsistencyScore([...player.seasonStats.gameHistory, gameRecord]),
    monthlyStats: {
      ...player.seasonStats.monthlyStats,
      [currentMonth]: {
        gamesPlayed: prevMonthlyStats.gamesPlayed + 1,
        totalTime: prevMonthlyStats.totalTime + totalGameTime,
        averageTime: (prevMonthlyStats.totalTime + totalGameTime) / (prevMonthlyStats.gamesPlayed + 1),
      },
    },
    rotationFrequency: calculateRotationFrequency([...player.seasonStats.gameHistory, gameRecord]),
    versatilityScore: calculateVersatilityScore(updatedPositionPerformance),
    reliabilityScore: calculateReliabilityScore(player.attributes, [...player.seasonStats.gameHistory, gameRecord]),
    gameHistory: [...player.seasonStats.gameHistory, gameRecord],
  };

  // Calculate average game time
  updatedSeasonStats.averageGameTime = updatedSeasonStats.gamesCompleted > 0 
    ? updatedSeasonStats.totalGameTime / updatedSeasonStats.gamesCompleted 
    : 0;

  return {
    ...player,
    seasonStats: updatedSeasonStats,
    // Reset current game stats
    isActive: false,
    currentPosition: null,
    lastInterchangeTime: 0,
    timeStats: { forward: 0, midfield: 0, defence: 0 },
    quarterStats: {},
    currentGamePerformance: {
      interchanges: 0,
      positionSwitches: 0,
      longestStint: 0,
      lastPositionChangeTime: 0,
    },
  };
};

// Helper functions for advanced calculations
const calculateConsistencyScore = (gameHistory: GameRecord[]): number => {
  if (gameHistory.length < 2) return 5;
  
  const times = gameHistory.map(game => game.totalGameTime);
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / times.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Lower standard deviation = higher consistency (scale 1-10)
  const maxStdDev = mean * 0.5; // Assume 50% variation is maximum inconsistency
  return Math.max(1, Math.min(10, 10 - (standardDeviation / maxStdDev) * 9));
};

const calculateRotationFrequency = (gameHistory: GameRecord[]): number => {
  if (gameHistory.length === 0) return 0;
  
  const totalInterchanges = gameHistory.reduce((sum, game) => sum + game.performance.interchanges, 0);
  return totalInterchanges / gameHistory.length;
};

const calculateVersatilityScore = (positionPerformance: SeasonStats['positionPerformance']): number => {
  const positionsPlayed = Object.values(positionPerformance).filter(pos => pos.games > 0).length;
  const effectivenessSum = Object.values(positionPerformance).reduce((sum, pos) => sum + pos.effectiveness, 0);
  const averageEffectiveness = effectivenessSum / 3; // Always 3 positions
  
  return Math.min(10, (positionsPlayed / 3) * 5 + (averageEffectiveness / 10) * 5);
};

const calculateReliabilityScore = (attributes: PlayerAttributes, gameHistory: GameRecord[]): number => {
  const availabilityScore = attributes.isAvailable ? 5 : 0;
  const fitnessScore = attributes.fitness / 2;
  const injuryPenalty = Math.max(0, 5 - attributes.injuryHistory.length);
  
  return Math.min(10, availabilityScore + fitnessScore + injuryPenalty);
};

export const getPlayerSeasonSummary = (player: Player) => {
  const stats = player.seasonStats;
  const gamesPlayed = stats.gamesCompleted;
  const totalTime = stats.totalGameTime;
  const avgTime = stats.averageGameTime;

  return {
    gamesPlayed,
    totalTime: Math.floor(totalTime / 60), // Convert to minutes
    averageTime: Math.floor(avgTime / 60), // Convert to minutes
    mostPlayedPosition: getMostPlayedPosition(stats.positionTotals),
    recentForm: getRecentForm(stats.gameHistory),
    consistencyScore: stats.consistencyScore,
    versatilityScore: stats.versatilityScore,
    reliabilityScore: stats.reliabilityScore,
  };
};

const getMostPlayedPosition = (positionTotals: { forward: number; midfield: number; defence: number }) => {
  const positions = Object.entries(positionTotals);
  const sorted = positions.sort(([,a], [,b]) => b - a);
  return sorted[0]?.[0] || 'none';
};

const getRecentForm = (gameHistory: GameRecord[]) => {
  const recentGames = gameHistory.slice(-5); // Last 5 games
  const avgTimeRecent = recentGames.length > 0 
    ? recentGames.reduce((sum, game) => sum + game.totalGameTime, 0) / recentGames.length
    : 0;
  
  return {
    games: recentGames.length,
    averageTime: Math.floor(avgTimeRecent / 60),
  };
};

export const migratePlayerToSeasonFormat = (oldPlayer: any): Player => {
  // Handle old player data that doesn't have season stats or attributes
  const basePlayer = {
    ...oldPlayer,
    // Ensure correct position names
    currentPosition: oldPlayer.currentPosition === 'defense' ? 'defence' : oldPlayer.currentPosition,
    timeStats: {
      forward: oldPlayer.timeStats?.forward || 0,
      midfield: oldPlayer.timeStats?.midfield || 0,
      defence: oldPlayer.timeStats?.defence || oldPlayer.timeStats?.defense || 0,
    },
    guernseyNumber: oldPlayer.guernseyNumber || oldPlayer.jerseyNumber,
  };

  // Add missing attributes
  if (!basePlayer.attributes) {
    basePlayer.attributes = createDefaultPlayerAttributes();
  }

  // Add missing season stats
  if (!basePlayer.seasonStats) {
    basePlayer.seasonStats = createEmptySeasonStats();
  }

  // Add missing current game performance
  if (!basePlayer.currentGamePerformance) {
    basePlayer.currentGamePerformance = {
      interchanges: 0,
      positionSwitches: 0,
      longestStint: 0,
      lastPositionChangeTime: 0,
    };
  }

  return basePlayer;
};