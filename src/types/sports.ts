export interface GameRecord {
  matchDay: number;
  date: string;
  opponent?: string;
  venue?: 'home' | 'away';
  result?: 'win' | 'loss' | 'draw';
  timeStats: {
    forward: number;
    midfield: number;
    defence: number;
  };
  quarterStats: {
    [quarter: number]: {
      forward: number;
      midfield: number;
      defence: number;
    };
  };
  totalGameTime: number;
  completed: boolean;
}

export interface SeasonStats {
  totalGameTime: number;
  gamesPlayed: number;
  gamesCompleted: number;
  positionTotals: {
    forward: number;
    midfield: number;
    defence: number;
  };
  averageGameTime: number;
  gameHistory: GameRecord[];
}

export interface Player {
  id: string;
  name: string;
  guernseyNumber?: number;
  
  // Season-level persistent data
  seasonStats: SeasonStats;
  
  // Current game data (resets each game)
  isActive: boolean;
  currentPosition: Position | null;
  lastInterchangeTime: number;
  timeStats: {
    forward: number;
    midfield: number;
    defence: number;
  };
  quarterStats: {
    [quarter: number]: {
      forward: number;
      midfield: number;
      defence: number;
    };
  };
}

export interface PlannedSubstitution {
  id: string;
  playerId: string;
  targetPosition: Position;
  plannedTime?: number; // Optional game time to make the substitution
  priority: 'high' | 'medium' | 'low';
}

export type Position = 'forward' | 'midfield' | 'defence';

export interface GameState {
  // Season context
  currentSeason: number;
  matchDay: number;
  gameDate: string;
  opponent?: string;
  venue?: 'home' | 'away';
  
  // Game flow
  isPlaying: boolean;
  currentQuarter: number;
  quarterTime: number;
  totalTime: number;
  gameCompleted: boolean;
  
  // Players and positions
  players: Player[];
  activePlayersByPosition: {
    forward: string[];
    midfield: string[];
    defence: string[];
  };
  plannedSubstitutions: PlannedSubstitution[];
}