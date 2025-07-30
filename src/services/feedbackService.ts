import { supabase } from "@/integrations/supabase/client";
import { GameState } from "@/types/sports";
import { RotationSuggestion } from "@/types/autoRotation";

export interface FeedbackData {
  suggestionId: string;
  feedbackType: 'thumbs_up' | 'thumbs_down';
  suggestionData: RotationSuggestion;
  gameContext: {
    quarter: number;
    quarterTime: number;
    totalTime: number;
    gamePhase: string;
    activePlayers: number;
  };
}

export class FeedbackService {
  static async submitFeedback(
    suggestion: RotationSuggestion, 
    feedbackType: 'thumbs_up' | 'thumbs_down',
    gameState: GameState
  ): Promise<void> {
    try {
      const feedbackData: FeedbackData = {
        suggestionId: suggestion.id,
        feedbackType,
        suggestionData: suggestion,
        gameContext: {
          quarter: gameState.currentQuarter,
          quarterTime: gameState.quarterTime,
          totalTime: gameState.totalTime,
          gamePhase: this.determineGamePhase(gameState.quarterTime),
          activePlayers: Object.values(gameState.activePlayersByPosition).flat().length
        }
      };

      const { error } = await supabase
        .from('rotation_feedback')
        .insert({
          suggestion_id: feedbackData.suggestionId,
          feedback_type: feedbackData.feedbackType,
          suggestion_data: feedbackData.suggestionData as any,
          game_context: feedbackData.gameContext as any
        });

      if (error) {
        console.error('Failed to submit feedback:', error);
        throw error;
      }

      console.log('Feedback submitted successfully:', feedbackData.feedbackType);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  static async getFeedbackAnalytics(): Promise<{
    totalFeedback: number;
    positiveRate: number;
    suggestionTypeAnalysis: Record<string, { positive: number; negative: number }>;
    recentTrends: Array<{ date: string; positive: number; negative: number }>;
  }> {
    try {
      const { data, error } = await supabase
        .from('rotation_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const totalFeedback = data?.length || 0;
      const positiveCount = data?.filter(f => f.feedback_type === 'thumbs_up').length || 0;
      const positiveRate = totalFeedback > 0 ? (positiveCount / totalFeedback) * 100 : 0;

      // Analyze by suggestion type
      const suggestionTypeAnalysis: Record<string, { positive: number; negative: number }> = {};
      data?.forEach(feedback => {
        const suggestionType = (feedback.suggestion_data as any)?.type || 'unknown';
        if (!suggestionTypeAnalysis[suggestionType]) {
          suggestionTypeAnalysis[suggestionType] = { positive: 0, negative: 0 };
        }
        if (feedback.feedback_type === 'thumbs_up') {
          suggestionTypeAnalysis[suggestionType].positive++;
        } else {
          suggestionTypeAnalysis[suggestionType].negative++;
        }
      });

      // Recent trends (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentData = data?.filter(f => new Date(f.created_at) >= sevenDaysAgo) || [];
      
      const recentTrends = this.groupFeedbackByDay(recentData);

      return {
        totalFeedback,
        positiveRate,
        suggestionTypeAnalysis,
        recentTrends
      };
    } catch (error) {
      console.error('Failed to get feedback analytics:', error);
      return {
        totalFeedback: 0,
        positiveRate: 0,
        suggestionTypeAnalysis: {},
        recentTrends: []
      };
    }
  }

  static async getCoachPreferences(): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('coach_preferences')
        .select('*');

      if (error) throw error;

      const preferences: Record<string, any> = {};
      data?.forEach(pref => {
        preferences[pref.preference_key] = pref.preference_value;
      });

      return preferences;
    } catch (error) {
      console.error('Failed to get coach preferences:', error);
      return {};
    }
  }

  static async updateCoachPreference(key: string, value: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('coach_preferences')
        .upsert({
          preference_key: key,
          preference_value: value
        }, { 
          onConflict: 'preference_key' 
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update coach preference:', error);
      throw error;
    }
  }

  private static determineGamePhase(quarterTime: number): string {
    const progress = quarterTime / (15 * 60); // Assuming 15-minute quarters
    if (progress < 0.3) return 'early';
    if (progress < 0.7) return 'mid';
    return 'late';
  }

  private static groupFeedbackByDay(feedbackData: any[]): Array<{ date: string; positive: number; negative: number }> {
    const grouped: Record<string, { positive: number; negative: number }> = {};
    
    feedbackData.forEach(feedback => {
      const date = new Date(feedback.created_at).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { positive: 0, negative: 0 };
      }
      if (feedback.feedback_type === 'thumbs_up') {
        grouped[date].positive++;
      } else {
        grouped[date].negative++;
      }
    });

    return Object.entries(grouped)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}