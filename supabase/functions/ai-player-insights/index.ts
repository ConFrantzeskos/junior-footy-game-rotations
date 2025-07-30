import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlayerInsightRequest {
  player: {
    id: string;
    name: string;
    guernseyNumber: number;
    seasonStats: any;
    attributes: any;
  };
  teamContext: {
    allPlayers: any[];
    seasonStats: any;
  };
  analysisType: 'development' | 'performance' | 'positioning' | 'comprehensive';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { player, teamContext, analysisType }: PlayerInsightRequest = await req.json();

    console.log('Generating AI insights for player:', player.name, 'Analysis type:', analysisType);

    const prompt = `
You are an expert junior sports development coach analyzing individual player progress and providing personalized development recommendations.

PLAYER PROFILE:
Name: ${player.name} (#${player.guernseyNumber})
Age: ${player.attributes.age}
Preferred Positions: ${player.attributes.preferredPositions?.join(', ') || 'Not specified'}

CURRENT SEASON PERFORMANCE:
- Games Played: ${player.seasonStats.gamesPlayed}
- Total Time: ${Math.round(player.seasonStats.totalTimeOnField / 60)} minutes
- Average per Game: ${Math.round(player.seasonStats.averageTimePerGame / 60)} minutes
- Position Breakdown: ${JSON.stringify(player.seasonStats.positionBreakdown)}

TEAM CONTEXT:
- Team Size: ${teamContext.allPlayers.length} players
- Season Progress: Multiple games analyzed
- Position Demands: Forward, Midfield, Defence

ANALYSIS TYPE: ${analysisType}

Based on this data, provide comprehensive insights:

For DEVELOPMENT analysis, focus on:
- Growth opportunities and skill development areas
- Position-specific training recommendations
- Progression path suggestions

For PERFORMANCE analysis, focus on:
- Current performance evaluation relative to peers
- Strengths and areas for improvement
- Game impact assessment

For POSITIONING analysis, focus on:
- Optimal position recommendations
- Versatility assessment
- Strategic deployment suggestions

For COMPREHENSIVE analysis, include all above aspects.

Respond with a JSON object:
{
  "insights": {
    "strengths": ["List of key strengths"],
    "developmentAreas": ["Areas for improvement"],
    "recommendations": ["Specific actionable recommendations"],
    "positioningAdvice": "Best positions and strategic usage",
    "progressionPath": "Long-term development plan"
  },
  "metrics": {
    "developmentScore": 0-100,
    "consistencyScore": 0-100,
    "versatilityScore": 0-100,
    "impactScore": 0-100
  },
  "coachingTips": [
    {
      "area": "specific area",
      "tip": "actionable coaching advice",
      "priority": "high|medium|low"
    }
  ],
  "nextSteps": "Immediate action items for next games",
  "parentFeedback": "Positive feedback suitable for sharing with parents"
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are an expert junior sports development coach specializing in individual player analysis and development planning. You provide constructive, encouraging feedback focused on growth and improvement.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Invalid AI response format');
    }

    return new Response(JSON.stringify({
      playerId: player.id,
      playerName: player.name,
      analysisType,
      timestamp: new Date().toISOString(),
      ...parsedResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-player-insights:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      playerId: null,
      insights: {
        strengths: ['Analysis temporarily unavailable'],
        developmentAreas: [],
        recommendations: [],
        positioningAdvice: '',
        progressionPath: ''
      },
      metrics: {
        developmentScore: 0,
        consistencyScore: 0,
        versatilityScore: 0,
        impactScore: 0
      },
      coachingTips: [],
      nextSteps: '',
      parentFeedback: ''
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});