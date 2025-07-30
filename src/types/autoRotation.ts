export interface RotationSuggestion {
  id: string;
  type: 'swap' | 'substitute_on' | 'substitute_off';
  priority: 'urgent' | 'recommended' | 'optional';
  reasoning: string;
  playerIn?: string; // Player coming on
  playerOut?: string; // Player going off
  position: string;
  urgencyScore: number;
  factors: string[]; // Contributing factors
}

export interface RotationAnalysis {
  suggestions: RotationSuggestion[];
  overallAssessment: string;
  nextReviewTime: number; // Seconds until next analysis recommended
}