import { supabase } from "@/integrations/supabase/client";
import { Player } from "@/types/sports";

export interface SeasonFinding {
  category: string;
  finding: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface StrategicRecommendation {
  area: string;
  recommendation: string;
  timeframe: 'immediate' | 'short-term' | 'long-term';
  priority: 'high' | 'medium' | 'low';
}

export interface PlayerDevelopmentPriority {
  playerId: string;
  playerName: string;
  priority: string;
  reasoning: string;
}

export interface NextSeasonPreparation {
  trainingFocus: string[];
  recruitmentNeeds: string[];
  teamGoals: string[];
}

export interface AISeasonAnalysisResponse {
  analysisType: 'team_strategy' | 'player_development' | 'season_review' | 'future_planning';
  teamSize: number;
  executiveSummary: string;
  keyFindings: SeasonFinding[];
  teamStrengths: string[];
  improvementAreas: string[];
  strategicRecommendations: StrategicRecommendation[];
  playerDevelopmentPriorities: PlayerDevelopmentPriority[];
  nextSeasonPreparation: NextSeasonPreparation;
  coachingInsights: string;
  timestamp: string;
  error?: string;
}

export class AISeasonAnalysisService {
  static async generateSeasonAnalysis(
    teamData: {
      players: Player[];
      seasonStats: any;
      gameHistory: any[];
    },
    analysisType: 'team_strategy' | 'player_development' | 'season_review' | 'future_planning' = 'season_review',
    focusAreas?: string[]
  ): Promise<AISeasonAnalysisResponse> {
    try {
      console.log('Calling AI season analysis service...');
      
      const { data, error } = await supabase.functions.invoke('ai-season-analysis', {
        body: {
          teamData,
          analysisType,
          focusAreas
        }
      });

      if (error) {
        console.error('AI season analysis service error:', error);
        throw new Error(error.message || 'AI season analysis service unavailable');
      }

      return data as AISeasonAnalysisResponse;
    } catch (error) {
      console.error('Failed to get AI season analysis:', error);
      
      // Fallback to basic analysis
      return {
        analysisType,
        teamSize: teamData.players.length,
        executiveSummary: 'Season analysis temporarily unavailable. Basic summary generated.',
        keyFindings: [{
          category: 'Participation',
          finding: 'Team maintained regular participation',
          impact: 'medium',
          recommendation: 'Continue encouraging attendance'
        }],
        teamStrengths: ['Good team spirit', 'Regular participation'],
        improvementAreas: ['AI analysis needed for detailed insights'],
        strategicRecommendations: [{
          area: 'General',
          recommendation: 'Continue current coaching approach',
          timeframe: 'immediate',
          priority: 'medium'
        }],
        playerDevelopmentPriorities: teamData.players.slice(0, 3).map(player => ({
          playerId: player.id,
          playerName: player.name,
          priority: 'Continue development',
          reasoning: 'Regular participant showing progress'
        })),
        nextSeasonPreparation: {
          trainingFocus: ['Basic skills development'],
          recruitmentNeeds: ['Assess team needs'],
          teamGoals: ['Continue positive development']
        },
        coachingInsights: 'AI analysis temporarily unavailable. Please try again later.',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}