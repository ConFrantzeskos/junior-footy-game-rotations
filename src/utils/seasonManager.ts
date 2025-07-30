import { Player, SeasonStats, GameRecord } from '@/types/sports';

export const createEmptySeasonStats = (): SeasonStats => ({
  totalGameTime: 0,
  gamesPlayed: 0,
  gamesCompleted: 0,
  positionTotals: {
    forward: 0,
    midfield: 0,
    defence: 0,
  },
  averageGameTime: 0,
  gameHistory: [],
});

export const createNewPlayer = (name: string, id?: string, guernseyNumber?: number): Player => ({
  id: id || `player-${Date.now()}`,
  name: name.trim(),
  guernseyNumber,
  seasonStats: createEmptySeasonStats(),
  isActive: false,
  currentPosition: null,
  lastInterchangeTime: 0,
  timeStats: { forward: 0, midfield: 0, defence: 0 },
  quarterStats: {},
});

export const completeGameForPlayer = (
  player: Player,
  matchDay: number,
  gameDate: string,
  opponent?: string,
  venue?: 'home' | 'away',
  result?: 'win' | 'loss' | 'draw'
): Player => {
  const totalGameTime = player.timeStats.forward + player.timeStats.midfield + player.timeStats.defence;
  
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
  };

  const updatedSeasonStats: SeasonStats = {
    totalGameTime: player.seasonStats.totalGameTime + totalGameTime,
    gamesPlayed: player.seasonStats.gamesPlayed + 1,
    gamesCompleted: player.seasonStats.gamesCompleted + 1,
    positionTotals: {
      forward: player.seasonStats.positionTotals.forward + player.timeStats.forward,
      midfield: player.seasonStats.positionTotals.midfield + player.timeStats.midfield,
      defence: player.seasonStats.positionTotals.defence + player.timeStats.defence,
    },
    averageGameTime: 0, // Will be calculated below
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
  };
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
  // Handle old player data that doesn't have season stats
  if (!oldPlayer.seasonStats) {
    return {
      ...oldPlayer,
      seasonStats: createEmptySeasonStats(),
      // Ensure correct position names
      currentPosition: oldPlayer.currentPosition === 'defense' ? 'defence' : oldPlayer.currentPosition,
      timeStats: {
        forward: oldPlayer.timeStats?.forward || 0,
        midfield: oldPlayer.timeStats?.midfield || 0,
        defence: oldPlayer.timeStats?.defence || oldPlayer.timeStats?.defense || 0,
      },
      guernseyNumber: oldPlayer.guernseyNumber || oldPlayer.jerseyNumber,
    };
  }
  
  return oldPlayer;
};