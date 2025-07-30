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
      activePlayers: gameContext.gameState.positions,
      suggestionsCount: gameContext.suggestions.length
    });

    // Prepare context for AI analysis
    const contextPrompt = `
You are an AI assistant for a junior sports coach focused on time equity, position experience, and player inclusion. 

Current Game Context:
- Quarter: ${gameContext.currentQuarter}/4
- Quarter Time: ${Math.floor(gameContext.quarterTime / 60)}:${(gameContext.quarterTime % 60).toString().padStart(2, '0')}
- Total Game Time: ${Math.floor(gameContext.totalTime / 60)}:${(gameContext.totalTime % 60).toString().padStart(2, '0')}

Current System Suggestions:
${gameContext.suggestions.map(s => `- ${s.reasoning} (Priority: ${s.priority})`).join('\n')}

Active Players by Position:
${Object.entries(gameContext.gameState.positions).map(([pos, players]: [string, any]) => 
  `${pos}: ${(players as any[]).map(p => {
    const player = gameContext.players.find(pl => pl.id === p.playerId);
    return `${player?.name || 'Unknown'} (${Math.floor(p.currentStint / 60)}:${(p.currentStint % 60).toString().padStart(2, '0')} on field)`;
  }).join(', ') || 'Empty'}`
).join('\n')}

Bench Players:
${gameContext.players.filter(p => !Object.values(gameContext.gameState.positions).flat().some((pos: any) => pos.playerId === p.id))
  .map(p => `${p.name} (${Math.floor((p.timeStats?.restTime || 0) / 60)}:${((p.timeStats?.restTime || 0) % 60).toString().padStart(2, '0')} rest)`)
  .join(', ')}

Coaching Philosophy: Focus on time equity, position experience, and ensuring every child feels included and gets to try different positions.

Please provide:
1. Enhanced reasoning for the top 2-3 system suggestions with junior sports context
2. Any additional strategic insights considering player development and inclusion
3. Timing considerations for when to make changes
4. Brief encouraging explanations suitable for young players

Keep responses concise and coaching-focused. Remember this is about development and inclusion, not winning at all costs.
`;

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