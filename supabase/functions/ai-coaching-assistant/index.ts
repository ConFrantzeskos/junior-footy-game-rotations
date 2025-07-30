import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CoachingAssistantRequest {
  query: string;
  context: {
    gameState?: any;
    players?: any[];
    seasonData?: any;
    conversationHistory?: Array<{role: string; content: string}>;
  };
  queryType?: 'question' | 'decision_help' | 'analysis_request' | 'general';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { query, context, queryType }: CoachingAssistantRequest = await req.json();

    console.log('AI Coaching Assistant query:', queryType, 'Query:', query.substring(0, 100));

    // Build context information for the AI
    let contextInfo = '';
    
    if (context.gameState) {
      contextInfo += `
CURRENT GAME STATE:
- Quarter: ${context.gameState.currentQuarter}
- Time: ${Math.round(context.gameState.quarterTime / 60)} minutes
- Active Players: ${Object.keys(context.gameState.activePositions).length}
`;
    }

    if (context.players) {
      contextInfo += `
TEAM ROSTER (${context.players.length} players):
${context.players.map(player => `
- ${player.name} (#${player.guernseyNumber}): ${player.seasonStats.gamesPlayed} games, ${Math.round(player.seasonStats.totalTimeOnField / 60)}min total
  Positions: ${Object.keys(player.seasonStats.positionBreakdown).join(', ')}
  Current status: ${context.gameState?.playersOnField?.includes(player.id) ? 'On field' : 'On bench'}
`).join('')}
`;
    }

    if (context.seasonData) {
      contextInfo += `
SEASON CONTEXT:
- Match Day: ${context.seasonData.currentMatchDay}
- Season: ${context.seasonData.seasonNumber}
`;
    }

    const systemMessage = `You are an AI Coaching Assistant for junior Australian Rules Football. You help coaches make informed decisions about player rotations, development, and team strategy.

Your capabilities include:
- Answering questions about player performance and development
- Providing rotation and substitution recommendations
- Analyzing team dynamics and strategy
- Offering coaching advice based on data
- Supporting player development planning

Key principles:
- Focus on player development and equal opportunity
- Consider player safety and fatigue
- Promote teamwork and positive experiences
- Use data-driven insights while considering the human element
- Provide constructive, actionable advice

Respond in a conversational, helpful manner as if you're an experienced assistant coach.`;

    const messages = [
      { role: 'system', content: systemMessage },
      ...(context.conversationHistory || []),
      { 
        role: 'user', 
        content: `${contextInfo}\n\nCOACH QUESTION: ${query}` 
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Try to extract actionable items if present
    const actionableItems = aiResponse.match(/(?:Action|Next step|Recommendation):[^\n]+/gi) || [];

    return new Response(JSON.stringify({
      response: aiResponse,
      queryType,
      timestamp: new Date().toISOString(),
      actionableItems,
      conversationEntry: {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-coaching-assistant:', error);
    return new Response(JSON.stringify({ 
      response: "I'm sorry, I'm temporarily unable to assist. Please try your question again in a moment.",
      error: error.message,
      queryType: 'error',
      timestamp: new Date().toISOString(),
      actionableItems: [],
      conversationEntry: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});