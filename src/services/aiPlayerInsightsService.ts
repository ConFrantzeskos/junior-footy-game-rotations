import { supabase } from "@/integrations/supabase/client";
import { Player } from "@/types/sports";

export interface PlayerInsights {
  strengths: string[];
  developmentAreas: string[];
  recommendations: string[];
  positioningAdvice: string;
  progressionPath: string;
}

export interface PlayerMetrics {
  developmentScore: number;
  consistencyScore: number;
  versatilityScore: number;
  impactScore: number;
}

export interface CoachingTip {
  area: string;
  tip: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AIPlayerInsightsResponse {
  playerId: string;
  playerName: string;
  analysisType: 'development' | 'performance' | 'positioning' | 'comprehensive';
  insights: PlayerInsights;
  metrics: PlayerMetrics;
  coachingTips: CoachingTip[];
  nextSteps: string;
  parentFeedback: string;
  timestamp: string;
  error?: string;
}

export class AIPlayerInsightsService {
  static async generatePlayerInsights(
    player: Player,
    teamContext: {
      allPlayers: Player[];
      seasonStats: any;
    },
    analysisType: 'development' | 'performance' | 'positioning' | 'comprehensive' = 'comprehensive'
  ): Promise<AIPlayerInsightsResponse> {
    try {
      console.log('Calling AI player insights service for:', player.name);
      
      const { data, error } = await supabase.functions.invoke('ai-player-insights', {
        body: {
          player,
          teamContext,
          analysisType
        }
      });

      if (error) {
        console.error('AI player insights service error:', error);
        throw new Error(error.message || 'AI player insights service unavailable');
      }

      return data as AIPlayerInsightsResponse;
    } catch (error) {
      console.error('Failed to get AI player insights:', error);
      
      // Fallback to basic insights
      return {
        playerId: player.id,
        playerName: player.name,
        analysisType,
        insights: {
          strengths: ['Shows good team spirit', 'Regular attendance'],
          developmentAreas: ['Continue building skills'],
          recommendations: ['Keep up the great work'],
          positioningAdvice: 'Suitable for multiple positions',
          progressionPath: 'Continue current development path'
        },
        metrics: {
          developmentScore: 75,
          consistencyScore: 80,
          versatilityScore: 70,
          impactScore: 75
        },
        coachingTips: [{
          area: 'General',
          tip: 'Continue encouraging positive participation',
          priority: 'medium'
        }],
        nextSteps: 'AI analysis temporarily unavailable',
        parentFeedback: `${player.name} is making good progress and showing positive development.`,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}