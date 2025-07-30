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
  // Performance metrics for this game
  performance: {
    interchanges: number; // Number of position changes
    minutesPerInterchange: number; // Average time between interchanges
    longestStint: number; // Longest continuous time in one position
    positionSwitches: number; // Number of times moved between positions
  };
}

export interface PlayerAttributes {
  // Physical attributes
  fitness: number; // 1-10 scale
  speed: number; // 1-10 scale
  endurance: number; // 1-10 scale
  
  // Skill attributes
  positionalVersatility: number; // 1-10 scale (how well they adapt to different positions)
  gameReadiness: number; // 1-10 scale (current form/readiness)
  
  // Development tracking
  dateJoined: string;
  birthDate?: string;
  preferredPosition?: Position;
  
  // Injury/availability tracking
  injuryHistory: {
    date: string;
    type: string;
    daysOut: number;
  }[];
  isAvailable: boolean;
  availabilityNotes?: string;
}

export interface AdvancedSeasonStats {
  // Basic game stats
  totalGameTime: number;
  gamesPlayed: number;
  gamesCompleted: number;
  gamesStarted: number; // Games where player was in starting lineup
  
  // Position analysis
  positionTotals: {
    forward: number;
    midfield: number;
    defence: number;
  };
  positionPerformance: {
    forward: { games: number; averageTime: number; effectiveness: number };
    midfield: { games: number; averageTime: number; effectiveness: number };
    defence: { games: number; averageTime: number; effectiveness: number };
  };
  
  // Time-based analytics
  averageGameTime: number;
  longestGameTime: number;
  shortestGameTime: number;
  consistencyScore: number; // How consistent playing time is
  
  // Performance trends
  monthlyStats: {
    [month: string]: {
      gamesPlayed: number;
      totalTime: number;
      averageTime: number;
    };
  };
  
  // Team contribution
  rotationFrequency: number; // How often player is rotated
  versatilityScore: number; // How many positions player has played effectively
  reliabilityScore: number; // Consistent availability and performance
  
  // Game history with enhanced data
  gameHistory: GameRecord[];
}

export interface SeasonStats extends AdvancedSeasonStats {}

export interface Player {
  id: string;
  name: string;
  guernseyNumber?: number;
  
  // Player attributes and profile
  attributes: PlayerAttributes;
  
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
  
  // Game-specific performance tracking
  currentGamePerformance: {
    interchanges: number;
    positionSwitches: number;
    startingPosition?: Position;
    longestStint: number;
    lastPositionChangeTime: number;
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