export interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  isActive: boolean;
  currentPosition: Position | null;
  lastInterchangeTime: number; // Total game time when player was last put on field
  timeStats: {
    forward: number;
    midfield: number;
    defense: number;
  };
  quarterStats: {
    [quarter: number]: {
      forward: number;
      midfield: number;
      defense: number;
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

export type Position = 'forward' | 'midfield' | 'defense';

export interface GameState {
  isPlaying: boolean;
  currentQuarter: number;
  quarterTime: number;
  totalTime: number;
  players: Player[];
  activePlayersByPosition: {
    forward: string[];
    midfield: string[];
    defense: string[];
  };
  plannedSubstitutions: PlannedSubstitution[];
}