import { supabase } from "@/integrations/supabase/client";
import { GameState, Player } from "@/types/sports";

export interface ConversationEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AICoachingAssistantResponse {
  response: string;
  queryType: 'question' | 'decision_help' | 'analysis_request' | 'general' | 'error';
  actionableItems: string[];
  conversationEntry: ConversationEntry | null;
  timestamp: string;
  error?: string;
}

export class AICoachingAssistantService {
  private static conversationHistory: ConversationEntry[] = [];

  static async askCoachingQuestion(
    query: string,
    context: {
      gameState?: GameState;
      players?: Player[];
      seasonData?: any;
    },
    queryType: 'question' | 'decision_help' | 'analysis_request' | 'general' = 'question'
  ): Promise<AICoachingAssistantResponse> {
    try {
      console.log('Calling AI coaching assistant...');
      
      // Add user query to conversation history
      const userEntry: ConversationEntry = {
        role: 'user',
        content: query,
        timestamp: new Date().toISOString()
      };
      
      this.conversationHistory.push(userEntry);

      const { data, error } = await supabase.functions.invoke('ai-coaching-assistant', {
        body: {
          query,
          context: {
            ...context,
            conversationHistory: this.conversationHistory.slice(-10) // Keep last 10 exchanges
          },
          queryType
        }
      });

      if (error) {
        console.error('AI coaching assistant service error:', error);
        throw new Error(error.message || 'AI coaching assistant service unavailable');
      }

      const response = data as AICoachingAssistantResponse;
      
      // Add assistant response to conversation history
      if (response.conversationEntry) {
        this.conversationHistory.push(response.conversationEntry);
      }

      return response;
    } catch (error) {
      console.error('Failed to get AI coaching assistance:', error);
      
      return {
        response: "I'm sorry, I'm temporarily unable to assist. Please try your question again in a moment.",
        queryType: 'error',
        actionableItems: [],
        conversationEntry: null,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static clearConversationHistory(): void {
    this.conversationHistory = [];
  }

  static getConversationHistory(): ConversationEntry[] {
    return [...this.conversationHistory];
  }

  static async provideFeedback(
    responseId: string,
    feedback: 'helpful' | 'not_helpful' | 'incorrect',
    comments?: string
  ): Promise<void> {
    // Store feedback for AI learning
    console.log('AI coaching feedback logged:', { responseId, feedback, comments });
  }
}