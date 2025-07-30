import { Player } from '@/types/sports';
import { Award, Trophy, Target, Users, TrendingUp, Star, Heart, Zap } from 'lucide-react';
import { createElement } from 'react';

interface AussieRulesAward {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: (player: Player) => boolean;
  reasoning: (player: Player) => string;
  category: 'performance' | 'character' | 'development' | 'team';
}

// Junior-focused Australian Rules Football awards
export const JUNIOR_AWARDS: AussieRulesAward[] = [
  {
    id: 'best-and-fairest',
    name: 'Best & Fairest',
    description: 'Most consistent performer with great sportsmanship',
    icon: 'Trophy',
    criteria: (player) => {
      const totalTime = player.seasonStats.totalGameTime;
      const gamesPlayed = player.seasonStats.gamesCompleted;
      const averageTime = gamesPlayed > 0 ? totalTime / gamesPlayed : 0;
      return gamesPlayed >= 3 && averageTime > 900; // 15+ min average, 3+ games
    },
    reasoning: (player) => `Consistent playing time across ${player.seasonStats.gamesCompleted} games with ${Math.floor(player.seasonStats.averageGameTime / 60)} min average per game.`,
    category: 'performance'
  },
  {
    id: 'most-versatile',
    name: 'Most Versatile Player',
    description: 'Played well in multiple positions',
    icon: 'Target',
    criteria: (player) => {
      const positions = player.seasonStats.positionTotals;
      const playedPositions = Object.values(positions).filter(time => time > 300).length; // 5+ min in position
      return playedPositions >= 2;
    },
    reasoning: (player) => {
      const positions = player.seasonStats.positionTotals;
      const positionsPlayed = Object.entries(positions)
        .filter(([, time]) => time > 300)
        .map(([pos]) => pos)
        .join(', ');
      return `Played effectively in multiple positions: ${positionsPlayed}.`;
    },
    category: 'development'
  },
  {
    id: 'rising-star',
    name: 'Rising Star',
    description: 'Showing great improvement and potential',
    icon: 'Star',
    criteria: (player) => {
      // Players with good game time but newer to the team
      return player.seasonStats.gamesCompleted >= 2 && player.seasonStats.gamesCompleted <= 5;
    },
    reasoning: (player) => `New talent showing great development over ${player.seasonStats.gamesCompleted} games.`,
    category: 'development'
  },
  {
    id: 'team-player',
    name: 'Ultimate Team Player',
    description: 'Always ready to help wherever needed',
    icon: 'Users',
    criteria: (player) => {
      const positions = player.seasonStats.positionTotals;
      const positionChanges = Object.values(positions).filter(time => time > 0).length;
      return positionChanges >= 2 && player.seasonStats.gamesCompleted >= 3;
    },
    reasoning: (player) => `Flexible player who contributes wherever the team needs them most.`,
    category: 'team'
  },
  {
    id: 'enthusiast',
    name: 'Footy Enthusiast',
    description: 'Great attitude and love for the game',
    icon: 'Heart',
    criteria: (player) => player.seasonStats.gamesCompleted >= 4,
    reasoning: (player) => `Consistent attendance and participation across ${player.seasonStats.gamesCompleted} games.`,
    category: 'character'
  },
  {
    id: 'energizer',
    name: 'Team Energizer',
    description: 'Brings positive energy when they take the field',
    icon: 'Zap',
    criteria: (player) => {
      const averageTime = player.seasonStats.averageGameTime;
      return averageTime > 600 && player.seasonStats.gamesCompleted >= 3; // 10+ min average
    },
    reasoning: (player) => `High-energy player who makes the most of their ${Math.floor(player.seasonStats.averageGameTime / 60)} minutes per game.`,
    category: 'character'
  },
  {
    id: 'most-improved',
    name: 'Most Improved',
    description: 'Showing significant development over the season',
    icon: 'TrendingUp',
    criteria: (player) => {
      // Look for increasing game time over recent games
      return player.seasonStats.gamesCompleted >= 3 && player.seasonStats.totalGameTime > 1800; // 30+ min total
    },
    reasoning: (player) => `Demonstrated growth and development with increasing involvement in games.`,
    category: 'development'
  },
  {
    id: 'best-forward',
    name: 'Best Forward',
    description: 'Outstanding in the forward line',
    icon: 'Award',
    criteria: (player) => player.seasonStats.positionTotals.forward > 900, // 15+ min forward
    reasoning: (player) => `Excellent forward play with ${Math.floor(player.seasonStats.positionTotals.forward / 60)} minutes in attack.`,
    category: 'performance'
  },
  {
    id: 'best-midfielder',
    name: 'Best Midfielder',
    description: 'Dominant in the middle of the ground',
    icon: 'Award',
    criteria: (player) => player.seasonStats.positionTotals.midfield > 900,
    reasoning: (player) => `Outstanding midfield work with ${Math.floor(player.seasonStats.positionTotals.midfield / 60)} minutes in the engine room.`,
    category: 'performance'
  },
  {
    id: 'best-defender',
    name: 'Best Defender',
    description: 'Rock solid in defence',
    icon: 'Award',
    criteria: (player) => player.seasonStats.positionTotals.defence > 900,
    reasoning: (player) => `Dependable defender with ${Math.floor(player.seasonStats.positionTotals.defence / 60)} minutes protecting the goals.`,
    category: 'performance'
  }
];

export const generateAwardNominations = (players: Player[]): { player: Player; awards: AussieRulesAward[] }[] => {
  const nominations: { player: Player; awards: AussieRulesAward[] }[] = [];

  players.forEach(player => {
    const eligibleAwards = JUNIOR_AWARDS.filter(award => award.criteria(player));
    if (eligibleAwards.length > 0) {
      nominations.push({ player, awards: eligibleAwards });
    }
  });

  return nominations.sort((a, b) => b.awards.length - a.awards.length);
};

export const getCategoryColor = (category: string) => {
  const colors = {
    performance: 'bg-sherrin-red/10 text-sherrin-red border-sherrin-red/20',
    character: 'bg-position-midfield/10 text-position-midfield border-position-midfield/20',
    development: 'bg-position-forward/10 text-position-forward border-position-forward/20',
    team: 'bg-position-defence/10 text-position-defence border-position-defence/20'
  };
  return colors[category as keyof typeof colors] || colors.performance;
};

export const getIconComponent = (iconName: string) => {
  const iconMap = {
    Trophy,
    Target,
    Star,
    Users,
    Heart,
    Zap,
    TrendingUp,
    Award
  };
  return iconMap[iconName as keyof typeof iconMap] || Award;
};