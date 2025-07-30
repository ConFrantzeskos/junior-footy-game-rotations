import { generateAwardNominations, getCategoryColor, getIconComponent, generateAIAwardNominations } from "@/utils/awardSystem";
import { Player } from "@/types/sports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Target, Heart, TrendingUp, Sparkles, Loader2, RefreshCw, Award } from "lucide-react";
import { useState, useEffect } from "react";

interface AwardNominationsProps {
  players: Player[];
}

export function AwardNominations({ players }: AwardNominationsProps) {
  const [useAI, setUseAI] = useState(true);
  const [aiNominations, setAiNominations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const traditionalNominations = generateAwardNominations(players);

  useEffect(() => {
    if (useAI && players.length > 0) {
      generateAINominations();
    }
  }, [useAI, players]);

  const generateAINominations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateAIAwardNominations(players, {
        currentMatchDay: 10,
        totalMatchDays: 16,
        seasonNumber: 1
      });
      setAiNominations(result);
    } catch (err) {
      setError('Failed to generate AI nominations');
      console.error('AI nominations error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const displayNominations = useAI && aiNominations ? aiNominations.nominations : traditionalNominations;

  if (!useAI && traditionalNominations.length === 0) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex flex-col items-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl mb-2">Season Awards</CardTitle>
          <CardDescription className="mb-4">
            Play a few games to start seeing award nominations for your players based on their performance and development!
          </CardDescription>
          <div className="text-sm text-muted-foreground/80 space-y-1">
            <p>Awards include: Iron Person, Swiss Army Knife, Rising Star, Team Spirit, and more!</p>
            <p>Each award recognizes different aspects of junior Australian Rules Football development.</p>
          </div>
        </div>
      </Card>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Trophy className="w-4 h-4" />;
      case 'character': return <Sparkles className="w-4 h-4" />;
      case 'development': return <Award className="w-4 h-4" />;
      case 'team': return <Award className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Season Award Nominations
            {useAI && <Sparkles className="h-4 w-4 text-purple-500" />}
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>
              {useAI ? 'AI-powered personalized recognition' : 'Traditional award nominations'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant={useAI ? "default" : "outline"}
                size="sm"
                onClick={() => setUseAI(true)}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                AI Awards
              </Button>
              <Button
                variant={!useAI ? "default" : "outline"}
                size="sm"
                onClick={() => setUseAI(false)}
              >
                Traditional
              </Button>
              {useAI && !isLoading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateAINominations}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardDescription>
          {error && (
            <div className="text-sm text-red-500 mt-2">
              {error} - Showing traditional awards instead
            </div>
          )}
        </CardHeader>
      </Card>

      {isLoading ? (
        <Card className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
          <CardTitle className="mb-2">Generating AI Award Nominations</CardTitle>
          <CardDescription>Analyzing player performance and creating personalized awards...</CardDescription>
        </Card>
      ) : displayNominations?.map((nomination: any, index: number) => {
        // Handle both AI and traditional nomination formats
        const player = useAI && aiNominations ? 
          players.find(p => p.id === nomination.playerId) || { 
            id: nomination.playerId, 
            name: nomination.playerName, 
            guernseyNumber: index + 1,
            seasonStats: { gamesPlayed: 0, totalTimeOnField: 0 }
          } : 
          nomination.player;
        
        const awards = useAI && aiNominations ? nomination.awards : nomination.awards;

        return (
          <Card key={player.id || index} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {player.guernseyNumber}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{player.name}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {player.seasonStats?.gamesPlayed || player.seasonStats?.gamesCompleted || 0} games • {Math.round((player.seasonStats?.totalTimeOnField || player.seasonStats?.totalGameTime || 0) / 60)} minutes total
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {awards.length} {awards.length === 1 ? 'Award' : 'Awards'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {awards.map((award: any, awardIndex: number) => {
                const IconComponent = useAI && aiNominations ? 
                  getIconComponent(award.iconName) : 
                  getIconComponent(award.icon);
                return (
                  <div 
                    key={awardIndex}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card/50"
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getCategoryColor(award.category)}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">
                          {useAI && aiNominations ? award.title : award.name}
                        </h4>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {award.category}
                        </Badge>
                        {useAI && aiNominations && award.confidence && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {award.confidence}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{award.description}</p>
                      <p className="text-xs font-medium text-primary">
                        {useAI && aiNominations ? award.reasoning : award.reasoning(player)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            About Our Awards
          </CardTitle>
          <CardDescription>
            {useAI && aiNominations ? 'AI-powered recognition philosophy' : 'Our recognition philosophy'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {useAI && aiNominations && (
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
              <h4 className="font-medium text-sm text-purple-800 mb-2">AI Season Summary</h4>
              <p className="text-xs text-purple-700">{aiNominations.seasonSummary}</p>
              {aiNominations.coachingInsights && (
                <div className="mt-2">
                  <h5 className="font-medium text-xs text-purple-800">Coaching Insights:</h5>
                  <p className="text-xs text-purple-700">{aiNominations.coachingInsights}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Performance</h4>
                <p className="text-xs text-muted-foreground">Recognizing achievement and excellence in gameplay</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Heart className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Character</h4>
                <p className="text-xs text-muted-foreground">Celebrating sportsmanship and positive attitude</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Development</h4>
                <p className="text-xs text-muted-foreground">Honoring growth, learning, and improvement</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Team</h4>
                <p className="text-xs text-muted-foreground">Appreciating collaboration and team spirit</p>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {useAI ? 
                'Our AI analyzes each player\'s unique journey, creating personalized recognition that celebrates individual growth, contribution, and development.' :
                'We believe every player deserves recognition. Our awards focus on effort, improvement, and positive contribution rather than just winning. Every child\'s journey is celebrated.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AwardNominations;