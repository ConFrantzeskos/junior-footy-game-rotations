import { supabase } from "@/integrations/supabase/client";
import { GameState } from "@/types/sports";
import { RotationAnalysis } from "@/types/autoRotation";

export interface AIRotationContext {
  gameState: GameState;
  players: any[];
  currentQuarter: number;
  quarterTime: number;
  totalTime: number;
  suggestions: any[];
}

export interface AIRotationResponse {
  enhancedSuggestions: any[];
  aiInsights: string;
  analysisTimestamp: string;
  confidence: string;
  error?: string;
  fallbackMode?: boolean;
}

export class AIRotationService {
  static async enhanceRotationSuggestions(
    context: AIRotationContext,
    coachingStyle: 'aggressive' | 'balanced' | 'conservative' = 'balanced'
  ): Promise<AIRotationResponse> {
    try {
      console.log('Calling AI rotation enhancement service...');
      
      const { data, error } = await supabase.functions.invoke('ai-rotation-suggestions', {
        body: {
          gameContext: context,
          coachingStyle
        }
      });

      if (error) {
        console.error('AI service error:', error);
        throw new Error(error.message || 'AI service unavailable');
      }

      return data as AIRotationResponse;
    } catch (error) {
      console.error('Failed to get AI rotation suggestions:', error);
      
      // Fallback to original suggestions with basic enhancement
      return {
        enhancedSuggestions: context.suggestions.map(suggestion => ({
          ...suggestion,
          aiEnhanced: false,
          enhancedReasoning: suggestion.reasoning
        })),
        aiInsights: 'AI analysis temporarily unavailable. Using standard rotation logic.',
        analysisTimestamp: new Date().toISOString(),
        confidence: 'medium',
        fallbackMode: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async logCoachDecision(
    suggestionId: string,
    action: 'accepted' | 'rejected' | 'modified',
    actualMove?: any
  ): Promise<void> {
    // Store coach decisions for future AI learning
    // This could be enhanced to feed back into the AI model
    console.log('Coach decision logged:', { suggestionId, action, actualMove });
  }
}