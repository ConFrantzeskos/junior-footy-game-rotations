import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, TrendingUp, Target, BarChart3, Lightbulb, BookOpen, Loader2 } from 'lucide-react';
import { Player } from '@/types/sports';
import { AIPlayerInsightsService, AIPlayerInsightsResponse } from '@/services/aiPlayerInsightsService';

interface AIPlayerInsightsProps {
  players: Player[];
  selectedPlayerId?: string;
  onPlayerSelect?: (playerId: string) => void;
}

export function AIPlayerInsights({ players, selectedPlayerId, onPlayerSelect }: AIPlayerInsightsProps) {
  const [insights, setInsights] = useState<AIPlayerInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState<'development' | 'performance' | 'positioning' | 'comprehensive'>('comprehensive');
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  useEffect(() => {
    if (selectedPlayerId) {
      const player = players.find(p => p.id === selectedPlayerId);
      if (player) {
        setCurrentPlayer(player);
        generateInsights(player);
      }
    }
  }, [selectedPlayerId, players, analysisType]);

  const generateInsights = async (player: Player) => {
    setIsLoading(true);
    try {
      const result = await AIPlayerInsightsService.generatePlayerInsights(
        player,
        {
          allPlayers: players,
          seasonStats: {}
        },
        analysisType
      );
      setInsights(result);
    } catch (error) {
      console.error('Failed to generate player insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayerSelect = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      setCurrentPlayer(player);
      generateInsights(player);
      onPlayerSelect?.(playerId);
    }
  };

  const getMetricColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            AI Player Development Insights
          </CardTitle>
          <CardDescription>
            AI-powered individual player analysis and development recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedPlayerId || ''} onValueChange={handlePlayerSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a player to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {players.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      #{player.guernseyNumber} {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                  <SelectItem value="development">Development Focus</SelectItem>
                  <SelectItem value="performance">Performance Analysis</SelectItem>
                  <SelectItem value="positioning">Position Strategy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {currentPlayer && (
            <Button 
              onClick={() => generateInsights(currentPlayer)} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating AI Insights...
                </>
              ) : (
                'Refresh Analysis'
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <CardTitle className="mb-2">Analyzing Player Performance</CardTitle>
            <CardDescription>AI is evaluating development patterns and generating personalized insights...</CardDescription>
          </CardContent>
        </Card>
      )}

      {insights && !isLoading && (
        <div className="space-y-6">
          {/* Player Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                #{currentPlayer?.guernseyNumber} {insights.playerName}
                <Badge variant="outline">{insights.analysisType}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(insights.metrics).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className={`text-2xl font-bold ${getMetricColor(value)}`}>
                      {value}%
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <Progress value={value} className="h-2 mt-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.insights.strengths.map((strength, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Development Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Target className="h-4 w-4" />
                  Development Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.insights.developmentAreas.map((area, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      {area}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Coaching Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Coaching Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.coachingTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                    <Badge className={getPriorityColor(tip.priority)}>
                      {tip.priority}
                    </Badge>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{tip.area}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{tip.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations & Next Steps */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.insights.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm p-2 bg-blue-50 rounded border-l-2 border-blue-500">
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  Positioning Advice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm p-3 bg-purple-50 rounded border">
                    {insights.insights.positioningAdvice}
                  </p>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Development Path:</h4>
                    <p className="text-sm text-muted-foreground">
                      {insights.insights.progressionPath}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps & Parent Feedback */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm p-3 bg-gray-50 rounded">{insights.nextSteps}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Parent Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm p-3 bg-green-50 rounded border-l-2 border-green-500">
                  {insights.parentFeedback}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!currentPlayer && !isLoading && (
        <Card className="text-center p-8">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <CardTitle className="mb-2">Select a Player</CardTitle>
          <CardDescription>
            Choose a player from the dropdown above to see AI-powered development insights and recommendations.
          </CardDescription>
        </Card>
      )}
    </div>
  );
}