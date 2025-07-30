import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SeasonAnalysisRequest {
  teamData: {
    players: any[];
    seasonStats: any;
    gameHistory: any[];
  };
  analysisType: 'team_strategy' | 'player_development' | 'season_review' | 'future_planning';
  focusAreas?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { teamData, analysisType, focusAreas }: SeasonAnalysisRequest = await req.json();

    console.log('Generating AI season analysis:', analysisType, 'for', teamData.players.length, 'players');

    const totalPlayTime = teamData.players.reduce((sum, p) => sum + p.seasonStats.totalTimeOnField, 0);
    const totalGames = teamData.players.reduce((sum, p) => sum + p.seasonStats.gamesPlayed, 0);
    const averagePlayTime = totalPlayTime / teamData.players.length;

    const prompt = `
You are an expert junior sports coach conducting comprehensive season analysis and strategic planning.

TEAM OVERVIEW:
- Squad Size: ${teamData.players.length} players
- Total Season Play Time: ${Math.round(totalPlayTime / 60)} minutes
- Average Player Time: ${Math.round(averagePlayTime / 60)} minutes per player
- Games Analyzed: ${teamData.gameHistory?.length || 'Multiple'}

PLAYER SUMMARY:
${teamData.players.map(player => `
${player.name} (#${player.guernseyNumber}): ${player.seasonStats.gamesPlayed} games, ${Math.round(player.seasonStats.totalTimeOnField / 60)}min total
Position breakdown: ${JSON.stringify(player.seasonStats.positionBreakdown)}
`).join('')}

ANALYSIS TYPE: ${analysisType}
${focusAreas ? `FOCUS AREAS: ${focusAreas.join(', ')}` : ''}

Provide strategic insights based on the analysis type:

TEAM_STRATEGY: Focus on optimal team composition, position strategies, rotation patterns
PLAYER_DEVELOPMENT: Focus on individual growth paths, skill development priorities
SEASON_REVIEW: Focus on achievements, challenges, lessons learned
FUTURE_PLANNING: Focus on next season preparation, recruitment needs, training focus

Respond with a JSON object:
{
  "executiveSummary": "High-level overview of findings",
  "keyFindings": [
    {
      "category": "category name",
      "finding": "specific insight",
      "impact": "high|medium|low",
      "recommendation": "actionable advice"
    }
  ],
  "teamStrengths": ["List of team strengths"],
  "improvementAreas": ["Areas needing attention"],
  "strategicRecommendations": [
    {
      "area": "focus area",
      "recommendation": "specific action",
      "timeframe": "immediate|short-term|long-term",
      "priority": "high|medium|low"
    }
  ],
  "playerDevelopmentPriorities": [
    {
      "playerId": "id",
      "playerName": "name",
      "priority": "development focus",
      "reasoning": "why this is important"
    }
  ],
  "nextSeasonPreparation": {
    "trainingFocus": ["key training areas"],
    "recruitmentNeeds": ["position or skill gaps"],
    "teamGoals": ["objectives for next season"]
  },
  "coachingInsights": "Strategic advice for the coaching staff"
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
            content: 'You are an expert junior sports coach and team strategist specializing in comprehensive season analysis, player development planning, and strategic team management.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3500,
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
      analysisType,
      teamSize: teamData.players.length,
      timestamp: new Date().toISOString(),
      ...parsedResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-season-analysis:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      executiveSummary: 'Season analysis temporarily unavailable',
      keyFindings: [],
      teamStrengths: [],
      improvementAreas: [],
      strategicRecommendations: [],
      playerDevelopmentPriorities: [],
      nextSeasonPreparation: {
        trainingFocus: [],
        recruitmentNeeds: [],
        teamGoals: []
      },
      coachingInsights: 'Please try again later'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});