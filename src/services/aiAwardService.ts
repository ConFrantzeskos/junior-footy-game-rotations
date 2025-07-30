import { supabase } from "@/integrations/supabase/client";
import { Player } from "@/types/sports";

export interface AIAward {
  title: string;
  category: 'performance' | 'character' | 'development' | 'team';
  description: string;
  reasoning: string;
  iconName: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AIAwardNomination {
  playerId: string;
  playerName: string;
  awards: AIAward[];
}

export interface AIAwardResponse {
  nominations: AIAwardNomination[];
  seasonSummary: string;
  coachingInsights: string;
  timestamp: string;
  aiGenerated: boolean;
  error?: string;
  fallback?: boolean;
}

export class AIAwardService {
  static async generateAwardNominations(
    players: Player[],
    seasonContext: {
      currentMatchDay: number;
      totalMatchDays: number;
      seasonNumber: number;
    }
  ): Promise<AIAwardResponse> {
    try {
      console.log('Calling AI award nominations service...');
      
      const { data, error } = await supabase.functions.invoke('ai-award-nominations', {
        body: {
          players,
          seasonContext
        }
      });

      if (error) {
        console.error('AI award service error:', error);
        throw new Error(error.message || 'AI award service unavailable');
      }

      return data as AIAwardResponse;
    } catch (error) {
      console.error('Failed to get AI award nominations:', error);
      
      // Fallback to basic award structure
      return {
        nominations: players.slice(0, 3).map(player => ({
          playerId: player.id,
          playerName: player.name,
          awards: [{
            title: 'Participation Award',
            category: 'character',
            description: 'For consistent participation and positive attitude',
            reasoning: 'AI analysis temporarily unavailable',
            iconName: 'trophy',
            confidence: 'low'
          }]
        })),
        seasonSummary: 'AI analysis temporarily unavailable. Awards based on basic criteria.',
        coachingInsights: 'Please try again later for detailed AI insights.',
        timestamp: new Date().toISOString(),
        aiGenerated: false,
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async logAwardDecision(
    playerId: string,
    awardTitle: string,
    action: 'accepted' | 'rejected' | 'modified'
  ): Promise<void> {
    // Store award decisions for future AI learning
    console.log('Award decision logged:', { playerId, awardTitle, action });
  }
}