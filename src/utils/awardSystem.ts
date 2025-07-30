import { Player } from '@/types/sports';
import { Award, Trophy, Target, Users, TrendingUp, Star, Heart, Zap, Clock, Shield, Repeat, Activity, Timer, RotateCcw, Gauge, Flame, Crown, Sparkles } from 'lucide-react';
import { createElement } from 'react';
import { AIAwardService } from '@/services/aiAwardService';

interface AussieRulesAward {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: (player: Player) => boolean;
  reasoning: (player: Player) => string;
  category: 'performance' | 'character' | 'development' | 'team';
}

// Realistic data-driven awards based on measurable statistics
export const JUNIOR_AWARDS: AussieRulesAward[] = [
  // PARTICIPATION & ENDURANCE AWARDS
  {
    id: 'iron-person',
    name: 'Iron Person',
    description: 'Player with the most total minutes on field',
    icon: 'Crown',
    criteria: (player) => {
      // Award goes to top 10% by total time (minimum 2 games)
      return player.seasonStats.gamesCompleted >= 2 && player.seasonStats.totalGameTime > 1800; // 30+ min total
    },
    reasoning: (player) => `Accumulated ${Math.floor(player.seasonStats.totalGameTime / 60)} total minutes on field across ${player.seasonStats.gamesCompleted} games.`,
    category: 'performance'
  },
  {
    id: 'mr-ms-reliable',
    name: 'Mr/Ms Reliable',
    description: 'Player who appeared in the most games',
    icon: 'Shield',
    criteria: (player) => player.seasonStats.gamesCompleted >= 5,
    reasoning: (player) => `Consistent team member with ${player.seasonStats.gamesCompleted} games played this season.`,
    category: 'character'
  },
  {
    id: 'stamina-champion',
    name: 'Stamina Champion',
    description: 'Highest average playing time per game',
    icon: 'Activity',
    criteria: (player) => {
      const averageTime = player.seasonStats.averageGameTime;
      return player.seasonStats.gamesCompleted >= 3 && averageTime > 1200; // 20+ min average
    },
    reasoning: (player) => `Maintains high energy with ${Math.floor(player.seasonStats.averageGameTime / 60)} minutes average per game.`,
    category: 'performance'
  },

  // TACTICAL & VERSATILITY AWARDS
  {
    id: 'swiss-army-knife',
    name: 'Swiss Army Knife',
    description: 'Most balanced time across all positions',
    icon: 'Target',
    criteria: (player) => {
      const positions = player.seasonStats.positionTotals;
      const positionTimes = Object.values(positions);
      const maxTime = Math.max(...positionTimes);
      const minTime = Math.min(...positionTimes.filter(t => t > 0));
      const balance = minTime / maxTime;
      return Object.values(positions).filter(time => time > 300).length >= 3 && balance > 0.3; // Played all 3 positions with good balance
    },
    reasoning: (player) => {
      const positions = player.seasonStats.positionTotals;
      const positionsText = Object.entries(positions)
        .filter(([, time]) => time > 300)
        .map(([pos, time]) => `${pos}: ${Math.floor(time / 60)}min`)
        .join(', ');
      return `Evenly distributed across positions - ${positionsText}.`;
    },
    category: 'team'
  },
  {
    id: 'tactical-mastermind',
    name: 'Tactical Mastermind',
    description: 'Player with the most position switches',
    icon: 'Repeat',
    criteria: (player) => {
      // This would require tracking interchanges - for now use position diversity
      const positions = player.seasonStats.positionTotals;
      const activePositions = Object.values(positions).filter(time => time > 180).length; // 3+ min in position
      return activePositions >= 3 && player.seasonStats.gamesCompleted >= 3;
    },
    reasoning: (player) => `Tactically flexible player who adapts to multiple roles during games.`,
    category: 'team'
  },
  {
    id: 'forward-specialist',
    name: 'Forward Specialist',
    description: 'Spent most time in forward position',
    icon: 'Flame',
    criteria: (player) => {
      const forwardTime = player.seasonStats.positionTotals.forward;
      const totalTime = player.seasonStats.totalGameTime;
      return forwardTime > 600 && forwardTime / totalTime > 0.6; // 60%+ forward time, 10+ min total
    },
    reasoning: (player) => `Dedicated forward with ${Math.floor(player.seasonStats.positionTotals.forward / 60)} minutes attacking the goals.`,
    category: 'performance'
  },
  {
    id: 'midfield-specialist',
    name: 'Midfield Specialist',
    description: 'Spent most time in midfield position',
    icon: 'Gauge',
    criteria: (player) => {
      const midfieldTime = player.seasonStats.positionTotals.midfield;
      const totalTime = player.seasonStats.totalGameTime;
      return midfieldTime > 600 && midfieldTime / totalTime > 0.6; // 60%+ midfield time
    },
    reasoning: (player) => `Engine room expert with ${Math.floor(player.seasonStats.positionTotals.midfield / 60)} minutes controlling the game.`,
    category: 'performance'
  },
  {
    id: 'defence-specialist',
    name: 'Defence Specialist',
    description: 'Spent most time in defensive position',
    icon: 'Shield',
    criteria: (player) => {
      const defenceTime = player.seasonStats.positionTotals.defence;
      const totalTime = player.seasonStats.totalGameTime;
      return defenceTime > 600 && defenceTime / totalTime > 0.6; // 60%+ defence time
    },
    reasoning: (player) => `Defensive rock with ${Math.floor(player.seasonStats.positionTotals.defence / 60)} minutes protecting the backline.`,
    category: 'performance'
  },

  // DEVELOPMENT & IMPROVEMENT AWARDS
  {
    id: 'rising-star',
    name: 'Rising Star',
    description: 'New player showing excellent development',
    icon: 'Star',
    criteria: (player) => {
      return player.seasonStats.gamesCompleted >= 2 && player.seasonStats.gamesCompleted <= 4 && player.seasonStats.averageGameTime > 600; // New player with good time
    },
    reasoning: (player) => `Emerging talent with ${player.seasonStats.gamesCompleted} games and strong ${Math.floor(player.seasonStats.averageGameTime / 60)} min average.`,
    category: 'development'
  },
  {
    id: 'consistency-champion',
    name: 'Consistency Champion',
    description: 'Most consistent playing time across games',
    icon: 'Timer',
    criteria: (player) => {
      // This would require game-by-game variance calculation - simplified for now
      return player.seasonStats.gamesCompleted >= 4 && player.seasonStats.averageGameTime > 900 && player.seasonStats.totalGameTime > 3600; // 60+ min total, 15+ avg
    },
    reasoning: (player) => `Reliable performer with consistent ${Math.floor(player.seasonStats.averageGameTime / 60)} minutes per game.`,
    category: 'character'
  },
  {
    id: 'late-bloomer',
    name: 'Late Bloomer',
    description: 'Player showing increasing involvement',
    icon: 'TrendingUp',
    criteria: (player) => {
      // This would ideally track improvement over time - simplified
      return player.seasonStats.gamesCompleted >= 3 && player.seasonStats.totalGameTime > 1500 && player.seasonStats.averageGameTime > 450; // Growing involvement
    },
    reasoning: (player) => `Developing player with growing involvement and ${Math.floor(player.seasonStats.totalGameTime / 60)} total minutes.`,
    category: 'development'
  },

  // CHARACTER & TEAM SPIRIT AWARDS
  {
    id: 'team-spirit',
    name: 'Team Spirit Award',
    description: 'Willing to play any position for the team',
    icon: 'Users',
    criteria: (player) => {
      const positions = player.seasonStats.positionTotals;
      const playedPositions = Object.values(positions).filter(time => time > 300).length; // 5+ min in position
      return playedPositions >= 2 && player.seasonStats.gamesCompleted >= 3;
    },
    reasoning: (player) => {
      const positions = player.seasonStats.positionTotals;
      const positionsPlayed = Object.entries(positions)
        .filter(([, time]) => time > 300)
        .map(([pos]) => pos)
        .join(', ');
      return `Team-first player contributing in ${positionsPlayed}.`;
    },
    category: 'team'
  },
  {
    id: 'utility-player',
    name: 'Utility Player',
    description: 'Valuable contributor in multiple roles',
    icon: 'RotateCcw',
    criteria: (player) => {
      const positions = player.seasonStats.positionTotals;
      const activePositions = Object.values(positions).filter(time => time > 450).length; // 7.5+ min in position
      return activePositions >= 2 && player.seasonStats.totalGameTime > 1200; // 20+ min total
    },
    reasoning: (player) => `Versatile contributor with meaningful time in multiple positions.`,
    category: 'team'
  },
  {
    id: 'energizer',
    name: 'Team Energizer',
    description: 'High-impact player who maximizes their time',
    icon: 'Zap',
    criteria: (player) => {
      const averageTime = player.seasonStats.averageGameTime;
      return averageTime > 600 && player.seasonStats.gamesCompleted >= 3; // 10+ min average, engaged player
    },
    reasoning: (player) => `High-energy contributor making the most of ${Math.floor(player.seasonStats.averageGameTime / 60)} minutes per game.`,
    category: 'character'
  },
  {
    id: 'heart-of-gold',
    name: 'Heart of Gold',
    description: 'Player who brings positivity to every game',
    icon: 'Heart',
    criteria: (player) => player.seasonStats.gamesCompleted >= 4, // Simple attendance-based character award
    reasoning: (player) => `Positive team presence across ${player.seasonStats.gamesCompleted} games this season.`,
    category: 'character'
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

export async function generateAIAwardNominations(
  players: Player[],
  seasonContext: {
    currentMatchDay: number;
    totalMatchDays: number;
    seasonNumber: number;
  }
) {
  return await AIAwardService.generateAwardNominations(players, seasonContext);
}

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
    Award,
    Clock,
    Shield,
    Repeat,
    Activity,
    Timer,
    RotateCcw,
    Gauge,
    Flame,
    Crown,
    Sparkles
  };
  return iconMap[iconName as keyof typeof iconMap] || Award;
};