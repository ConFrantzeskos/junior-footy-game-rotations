import { Player, Position } from '@/types/sports';

export interface PlayerInsights {
  // Performance insights
  strengthPosition: Position | null;
  improvementArea: Position | null;
  formTrend: 'improving' | 'declining' | 'stable';
  
  // Playing time insights
  playingTimeCategory: 'high' | 'medium' | 'low';
  rotationPattern: 'starter' | 'rotational' | 'bench';
  
  // Development recommendations
  recommendations: string[];
  
  // Comparative stats
  rankInTeam: {
    totalTime: number;
    consistency: number;
    versatility: number;
  };
}

export const generatePlayerInsights = (player: Player, teamPlayers: Player[]): PlayerInsights => {
  const stats = player.seasonStats;
  
  // Determine strength position
  const strengthPosition = getStrongestPosition(stats.positionPerformance);
  
  // Determine improvement area
  const improvementArea = getWeakestPosition(stats.positionPerformance);
  
  // Analyze form trend
  const formTrend = analyzeFormTrend(stats.gameHistory);
  
  // Categorize playing time
  const playingTimeCategory = categorizePlayingTime(player, teamPlayers);
  
  // Determine rotation pattern
  const rotationPattern = determineRotationPattern(stats);
  
  // Generate recommendations
  const recommendations = generateRecommendations(player, {
    strengthPosition,
    improvementArea,
    formTrend,
    playingTimeCategory,
  });
  
  // Calculate team rankings
  const rankInTeam = calculateTeamRankings(player, teamPlayers);
  
  return {
    strengthPosition,
    improvementArea,
    formTrend,
    playingTimeCategory,
    rotationPattern,
    recommendations,
    rankInTeam,
  };
};

const getStrongestPosition = (positionPerformance: Player['seasonStats']['positionPerformance']): Position | null => {
  const positions = Object.entries(positionPerformance)
    .filter(([, perf]) => perf.games > 0)
    .sort(([, a], [, b]) => b.effectiveness - a.effectiveness);
  
  return positions.length > 0 ? positions[0][0] as Position : null;
};

const getWeakestPosition = (positionPerformance: Player['seasonStats']['positionPerformance']): Position | null => {
  const positions = Object.entries(positionPerformance)
    .filter(([, perf]) => perf.games > 0)
    .sort(([, a], [, b]) => a.effectiveness - b.effectiveness);
  
  return positions.length > 0 ? positions[0][0] as Position : null;
};

const analyzeFormTrend = (gameHistory: Player['seasonStats']['gameHistory']): 'improving' | 'declining' | 'stable' => {
  if (gameHistory.length < 3) return 'stable';
  
  const recentGames = gameHistory.slice(-5);
  const earlierGames = gameHistory.slice(-10, -5);
  
  if (recentGames.length === 0 || earlierGames.length === 0) return 'stable';
  
  const recentAvg = recentGames.reduce((sum, game) => sum + game.totalGameTime, 0) / recentGames.length;
  const earlierAvg = earlierGames.reduce((sum, game) => sum + game.totalGameTime, 0) / earlierGames.length;
  
  const improvement = (recentAvg - earlierAvg) / earlierAvg;
  
  if (improvement > 0.1) return 'improving';
  if (improvement < -0.1) return 'declining';
  return 'stable';
};

const categorizePlayingTime = (player: Player, teamPlayers: Player[]): 'high' | 'medium' | 'low' => {
  const playerAvgTime = player.seasonStats.averageGameTime;
  const teamAvgTime = teamPlayers.reduce((sum, p) => sum + p.seasonStats.averageGameTime, 0) / teamPlayers.length;
  
  if (playerAvgTime > teamAvgTime * 1.2) return 'high';
  if (playerAvgTime > teamAvgTime * 0.8) return 'medium';
  return 'low';
};

const determineRotationPattern = (stats: Player['seasonStats']): 'starter' | 'rotational' | 'bench' => {
  const startingPercentage = stats.gamesCompleted > 0 ? stats.gamesStarted / stats.gamesCompleted : 0;
  
  if (startingPercentage > 0.7) return 'starter';
  if (startingPercentage > 0.3) return 'rotational';
  return 'bench';
};

const generateRecommendations = (
  player: Player,
  insights: {
    strengthPosition: Position | null;
    improvementArea: Position | null;
    formTrend: 'improving' | 'declining' | 'stable';
    playingTimeCategory: 'high' | 'medium' | 'low';
  }
): string[] => {
  const recommendations: string[] = [];
  
  // Position-based recommendations
  if (insights.strengthPosition) {
    recommendations.push(`Maximize time in ${insights.strengthPosition} position where they excel`);
  }
  
  if (insights.improvementArea && insights.improvementArea !== insights.strengthPosition) {
    recommendations.push(`Focus training on ${insights.improvementArea} position skills`);
  }
  
  // Form-based recommendations
  if (insights.formTrend === 'improving') {
    recommendations.push('Player is in good form - consider increasing playing time');
  } else if (insights.formTrend === 'declining') {
    recommendations.push('Monitor closely - may need rest or position change');
  }
  
  // Playing time recommendations
  if (insights.playingTimeCategory === 'low') {
    recommendations.push('Consider increasing involvement in games');
  } else if (insights.playingTimeCategory === 'high') {
    recommendations.push('Monitor for fatigue - ensure adequate rest');
  }
  
  // Fitness-based recommendations
  if (player.attributes.fitness < 5) {
    recommendations.push('Focus on fitness improvement in training');
  }
  
  if (player.attributes.positionalVersatility < 5) {
    recommendations.push('Work on adaptability across different positions');
  }
  
  return recommendations;
};

const calculateTeamRankings = (player: Player, teamPlayers: Player[]): PlayerInsights['rankInTeam'] => {
  const totalTimeRanking = teamPlayers
    .sort((a, b) => b.seasonStats.totalGameTime - a.seasonStats.totalGameTime)
    .findIndex(p => p.id === player.id) + 1;
  
  const consistencyRanking = teamPlayers
    .sort((a, b) => b.seasonStats.consistencyScore - a.seasonStats.consistencyScore)
    .findIndex(p => p.id === player.id) + 1;
  
  const versatilityRanking = teamPlayers
    .sort((a, b) => b.seasonStats.versatilityScore - a.seasonStats.versatilityScore)
    .findIndex(p => p.id === player.id) + 1;
  
  return {
    totalTime: totalTimeRanking,
    consistency: consistencyRanking,
    versatility: versatilityRanking,
  };
};

export const getTeamAnalytics = (players: Player[]) => {
  const playersWithGames = players.filter(p => p.seasonStats.gamesCompleted > 0);
  
  if (playersWithGames.length === 0) {
    return {
      averageGameTime: 0,
      mostVersatilePlayer: null,
      mostConsistentPlayer: null,
      topPerformer: null,
      teamBalance: { forward: 0, midfield: 0, defence: 0 },
    };
  }
  
  const totalGameTime = playersWithGames.reduce((sum, p) => sum + p.seasonStats.totalGameTime, 0);
  const averageGameTime = totalGameTime / playersWithGames.length;
  
  const mostVersatilePlayer = playersWithGames.sort((a, b) => 
    b.seasonStats.versatilityScore - a.seasonStats.versatilityScore
  )[0];
  
  const mostConsistentPlayer = playersWithGames.sort((a, b) => 
    b.seasonStats.consistencyScore - a.seasonStats.consistencyScore
  )[0];
  
  const topPerformer = playersWithGames.sort((a, b) => 
    b.seasonStats.totalGameTime - a.seasonStats.totalGameTime
  )[0];
  
  // Calculate team position balance
  const totalPositionTime = {
    forward: playersWithGames.reduce((sum, p) => sum + p.seasonStats.positionTotals.forward, 0),
    midfield: playersWithGames.reduce((sum, p) => sum + p.seasonStats.positionTotals.midfield, 0),
    defence: playersWithGames.reduce((sum, p) => sum + p.seasonStats.positionTotals.defence, 0),
  };
  
  const totalTime = Object.values(totalPositionTime).reduce((a, b) => a + b, 0);
  const teamBalance = {
    forward: totalTime > 0 ? (totalPositionTime.forward / totalTime) * 100 : 0,
    midfield: totalTime > 0 ? (totalPositionTime.midfield / totalTime) * 100 : 0,
    defence: totalTime > 0 ? (totalPositionTime.defence / totalTime) * 100 : 0,
  };
  
  return {
    averageGameTime: Math.floor(averageGameTime / 60),
    mostVersatilePlayer,
    mostConsistentPlayer,
    topPerformer,
    teamBalance,
  };
};