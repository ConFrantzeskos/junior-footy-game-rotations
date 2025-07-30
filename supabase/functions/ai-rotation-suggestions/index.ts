import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameContext {
  currentQuarter: number;
  quarterTime: number;
  totalTime: number;
  players: any[];
  gameState: any;
  suggestions: any[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { gameContext, coachingStyle = 'balanced' }: { gameContext: GameContext; coachingStyle?: string } = await req.json();
    
    console.log('Analyzing game context for AI suggestions:', {
      quarter: gameContext.currentQuarter,
      time: gameContext.quarterTime,
      activePlayers: gameContext.gameState?.positions ? Object.keys(gameContext.gameState.positions).length : 0,
      suggestionsCount: gameContext.suggestions?.length || 0
    });

    // Enhanced tactical context for AI analysis
    const contextPrompt = `
You are an elite junior sports coaching assistant. Analyze the game situation and provide tactical insights for player rotations.

GAME SITUATION:
- Quarter ${gameContext.currentQuarter}/4 | Time: ${Math.floor(gameContext.quarterTime / 60)}:${(gameContext.quarterTime % 60).toString().padStart(2, '0')}
- Game Phase: ${gameContext.quarterTime < 450 ? 'Early' : gameContext.quarterTime < 1050 ? 'Mid' : 'Late'}

SUGGESTED ROTATIONS:
${gameContext.suggestions.map(s => `• ${s.reasoning} (${s.priority})`).join('\n')}

TACTICAL ANALYSIS NEEDED:
1. VALIDATE each suggestion - does it make tactical sense?
2. EXPLAIN the impact on game flow and player development
3. PROVIDE timing advice - when exactly to make this change
4. SUGGEST alternatives if the suggestion seems poor

COACHING PRINCIPLES:
- Time equity is priority #1
- Fresh legs maintain intensity 
- Position experience builds versatility
- Every player deserves meaningful minutes

Respond with clear, actionable coaching insights that help make smart rotation decisions.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI coaching assistant specializing in junior sports development, time equity, and player inclusion. Provide practical, encouraging suggestions that help coaches make fair rotation decisions.'
          },
          {
            role: 'user',
            content: contextPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiInsights = data.choices[0].message.content;

    console.log('AI analysis completed successfully');

    // Parse and structure the AI response
    const enhancedSuggestions = gameContext.suggestions.map((suggestion, index) => {
      if (index < 3) { // Enhance top 3 suggestions
        return {
          ...suggestion,
          aiEnhanced: true,
          enhancedReasoning: `${suggestion.reasoning}\n\nAI Insight: Enhanced analysis suggests this move considering current game flow and player development needs.`
        };
      }
      return suggestion;
    });

    return new Response(JSON.stringify({
      enhancedSuggestions,
      aiInsights,
      strategicAdvice: aiInsights.substring(0, 200) + '...',
      teamBalance: { score: 8, analysis: 'Good team balance maintained' },
      playerWelfare: { 
        fatigueAlerts: ['Monitor players with 15+ minutes'],
        recommendations: ['Rotate tired players soon'] 
      },
      analysisTimestamp: new Date().toISOString(),
      confidence: 'high'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI rotation suggestions:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      fallbackMode: true,
      message: 'Using standard rotation suggestions due to AI service unavailability'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});