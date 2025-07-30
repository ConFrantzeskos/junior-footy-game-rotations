import { Player } from '@/types/sports';

export interface PlayerRank {
  id: string;
  totalTime: number;
  rank: 'most-1' | 'most-2' | 'most-3' | 'least-1' | 'least-2' | 'least-3' | null;
}

export const calculatePlayerRankings = (players: Player[]): PlayerRank[] => {
  // Calculate total time for each player
  const playersWithTime = players.map(player => ({
    id: player.id,
    totalTime: player.timeStats.forward + player.timeStats.midfield + player.timeStats.defense,
  })).filter(p => p.totalTime > 0); // Only include players with game time

  if (playersWithTime.length === 0) {
    return players.map(p => ({ 
      id: p.id, 
      totalTime: 0, 
      rank: null 
    }));
  }

  // Sort by total time
  const sorted = [...playersWithTime].sort((a, b) => b.totalTime - a.totalTime);
  
  // Create rankings
  const rankings: PlayerRank[] = players.map(player => {
    const playerTime = playersWithTime.find(p => p.id === player.id);
    if (!playerTime || playerTime.totalTime === 0) {
      return { id: player.id, totalTime: 0, rank: null };
    }

    const sortedIndex = sorted.findIndex(p => p.id === player.id);
    
    let rank: PlayerRank['rank'] = null;
    
    // Assign ranks for highest time (red motifs)
    if (sortedIndex === 0) {
      rank = 'most-1'; // Highest time - deepest red
    } else if (sortedIndex === 1) {
      rank = 'most-2'; // Second highest - medium red
    } else if (sortedIndex === 2) {
      rank = 'most-3'; // Third highest - light red
    }
    
    // Assign ranks for lowest time (blue motifs)
    else if (sortedIndex === sorted.length - 1) {
      rank = 'least-1'; // Lowest time - deepest blue
    } else if (sortedIndex === sorted.length - 2) {
      rank = 'least-2'; // Second lowest - medium blue
    } else if (sortedIndex === sorted.length - 3) {
      rank = 'least-3'; // Third lowest - light blue
    }

    return {
      id: player.id,
      totalTime: playerTime.totalTime,
      rank,
    };
  });

  return rankings;
};