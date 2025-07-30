import { Player } from '@/types/sports';

export interface PlayerRank {
  id: string;
  totalTime: number;
  rank: 'most-1' | 'most-2' | 'most-3' | 'least-1' | 'least-2' | 'least-3' | null;
}

export const calculatePlayerRankings = (players: Player[]): PlayerRank[] => {
  // Calculate total time for each player (include all players, not just those with time)
  const allPlayersWithTime = players.map(player => ({
    id: player.id,
    totalTime: player.timeStats.forward + player.timeStats.midfield + player.timeStats.defence,
  }));

  // Sort by total time (highest first) - include players with 0 time
  const sorted = [...allPlayersWithTime].sort((a, b) => b.totalTime - a.totalTime);
  
  // Only assign ranks if we have at least 3 players with some game time
  const playersWithGameTime = sorted.filter(p => p.totalTime > 0);
  
  // Create rankings
  const rankings: PlayerRank[] = players.map(player => {
    const playerData = allPlayersWithTime.find(p => p.id === player.id);
    if (!playerData) {
      return { id: player.id, totalTime: 0, rank: null };
    }

    // Only assign ranks if there are enough players with game time
    if (playersWithGameTime.length < 3) {
      return { id: player.id, totalTime: playerData.totalTime, rank: null };
    }

    const sortedIndex = sorted.findIndex(p => p.id === player.id);
    let rank: PlayerRank['rank'] = null;
    
    // Assign ranks for highest time (red motifs) - only for players with game time
    if (playerData.totalTime > 0) {
      const gameTimeIndex = playersWithGameTime.findIndex(p => p.id === player.id);
      
      if (gameTimeIndex === 0) {
        rank = 'most-1'; // Highest time - deepest red
      } else if (gameTimeIndex === 1) {
        rank = 'most-2'; // Second highest - medium red
      } else if (gameTimeIndex === 2) {
        rank = 'most-3'; // Third highest - light red
      }
      
      // Assign ranks for lowest time (blue motifs) - only if we have enough players
      else if (gameTimeIndex === playersWithGameTime.length - 1 && playersWithGameTime.length >= 3) {
        rank = 'least-1'; // Lowest time - deepest blue
      } else if (gameTimeIndex === playersWithGameTime.length - 2 && playersWithGameTime.length >= 4) {
        rank = 'least-2'; // Second lowest - medium blue
      } else if (gameTimeIndex === playersWithGameTime.length - 3 && playersWithGameTime.length >= 5) {
        rank = 'least-3'; // Third lowest - light blue
      }
    }

    return {
      id: player.id,
      totalTime: playerData.totalTime,
      rank,
    };
  });

  return rankings;
};