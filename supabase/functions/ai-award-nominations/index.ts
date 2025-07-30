import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Player {
  id: string;
  name: string;
  guernseyNumber: number;
  seasonStats: {
    totalTimeOnField: number;
    gamesPlayed: number;
    averageTimePerGame: number;
    positionBreakdown: Record<string, number>;
    gameRecords: Array<{
      timeInPositions: Record<string, number>;
      interchanges: number;
      longestStint: number;
    }>;
  };
  attributes: {
    age: number;
    preferredPositions: string[];
  };
}

interface AwardNominationRequest {
  players: Player[];
  seasonContext: {
    currentMatchDay: number;
    totalMatchDays: number;
    seasonNumber: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { players, seasonContext }: AwardNominationRequest = await req.json();

    console.log('Generating AI award nominations for', players.length, 'players');

    const prompt = `
You are an expert junior sports coach analyzing player performances for end-of-season awards. 

SEASON CONTEXT:
- Match Day: ${seasonContext.currentMatchDay} of ${seasonContext.totalMatchDays}
- Season: ${seasonContext.seasonNumber}
- Players: ${players.length}

PLAYER DATA:
${players.map(player => `
Player: ${player.name} (#${player.guernseyNumber})
- Age: ${player.attributes.age}
- Games Played: ${player.seasonStats.gamesPlayed}
- Total Time: ${Math.round(player.seasonStats.totalTimeOnField / 60)} minutes
- Average per Game: ${Math.round(player.seasonStats.averageTimePerGame / 60)} minutes
- Position Distribution: ${JSON.stringify(player.seasonStats.positionBreakdown)}
- Preferred Positions: ${player.attributes.preferredPositions?.join(', ') || 'Not specified'}
- Total Interchanges: ${player.seasonStats.gameRecords.reduce((sum, record) => sum + record.interchanges, 0)}
- Longest Stint: ${Math.round(Math.max(...player.seasonStats.gameRecords.map(r => r.longestStint)) / 60)} minutes
`).join('\n')}

INSTRUCTIONS:
Analyze these players and create meaningful, data-driven award nominations. Consider:
- Participation and dedication (attendance, total time)
- Development and improvement over the season
- Versatility and team spirit (position flexibility)
- Consistency and reliability
- Special achievements or standout qualities

Create personalized award categories that celebrate each player's unique contributions. Be creative but realistic based on the data.

Respond with a JSON object:
{
  "nominations": [
    {
      "playerId": "player_id",
      "playerName": "Player Name",
      "awards": [
        {
          "title": "Award Title",
          "category": "performance|character|development|team",
          "description": "Why this player deserves this award",
          "reasoning": "Data-backed explanation",
          "iconName": "trophy|clock|zap|heart|users|target|repeat|star|shield|award",
          "confidence": "high|medium|low"
        }
      ]
    }
  ],
  "seasonSummary": "Overall assessment of the season and player development",
  "coachingInsights": "Key insights for coach consideration"
}
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
            content: 'You are an expert junior sports coach with deep understanding of player development, team dynamics, and meaningful recognition. You create thoughtful, data-driven award nominations that celebrate each child\'s unique contributions and growth.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
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
      ...parsedResponse,
      timestamp: new Date().toISOString(),
      aiGenerated: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-award-nominations:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      fallback: true,
      nominations: [],
      seasonSummary: 'AI analysis temporarily unavailable',
      coachingInsights: 'Please try again later'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});