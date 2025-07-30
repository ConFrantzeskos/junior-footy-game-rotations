import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Player } from '@/types/sports';
import { getPlayerSeasonSummary } from '@/utils/seasonManager';
import { Trophy, Clock, Target, TrendingUp } from 'lucide-react';

interface SeasonStatsProps {
  players: Player[];
  currentMatchDay: number;
  currentSeason: number;
}

const SeasonStats = ({ players, currentMatchDay, currentSeason }: SeasonStatsProps) => {
  const playersWithStats = players.filter(p => p.seasonStats.gamesPlayed > 0);
  
  if (playersWithStats.length === 0) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-6 text-center text-muted-foreground">
          <div className="text-sm">No season statistics yet</div>
          <div className="text-xs opacity-75">Complete your first game to see season data</div>
        </CardContent>
      </Card>
    );
  }

  // Calculate season overview
  const totalGamesPlayed = Math.max(...players.map(p => p.seasonStats.gamesCompleted));
  const totalPlayTime = players.reduce((sum, p) => sum + p.seasonStats.totalGameTime, 0);
  const averagePlayTime = totalPlayTime / Math.max(players.length, 1);

  // Find most/least played players
  const sortedByTime = [...playersWithStats].sort((a, b) => b.seasonStats.totalGameTime - a.seasonStats.totalGameTime);
  const mostPlayed = sortedByTime[0];
  const leastPlayed = sortedByTime[sortedByTime.length - 1];

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          Season {currentSeason} Statistics
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Match Day {currentMatchDay} • {totalGamesPlayed} games completed
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Season Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-2 bg-muted/30 rounded">
            <div className="text-xs text-muted-foreground">Games</div>
            <div className="font-bold text-lg">{totalGamesPlayed}</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <div className="text-xs text-muted-foreground">Total Time</div>
            <div className="font-bold text-lg">{Math.floor(totalPlayTime / 60)}m</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <div className="text-xs text-muted-foreground">Avg/Player</div>
            <div className="font-bold text-lg">{Math.floor(averagePlayTime / 60)}m</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <div className="text-xs text-muted-foreground">Players</div>
            <div className="font-bold text-lg">{playersWithStats.length}</div>
          </div>
        </div>

        {/* Top Players */}
        {mostPlayed && leastPlayed && (
          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Season Highlights
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Most Time</Badge>
                  <span className="text-sm font-medium">{mostPlayed.name}</span>
                  {mostPlayed.guernseyNumber && (
                    <div className="w-4 h-4 rounded-full bg-sherrin-red text-white text-xs font-bold flex items-center justify-center">
                      {mostPlayed.guernseyNumber}
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.floor(mostPlayed.seasonStats.totalGameTime / 60)}m
                </div>
              </div>

              {mostPlayed.id !== leastPlayed.id && (
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">Needs Time</Badge>
                    <span className="text-sm font-medium">{leastPlayed.name}</span>
                    {leastPlayed.guernseyNumber && (
                      <div className="w-4 h-4 rounded-full bg-sherrin-red text-white text-xs font-bold flex items-center justify-center">
                        {leastPlayed.guernseyNumber}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Math.floor(leastPlayed.seasonStats.totalGameTime / 60)}m
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats for Active Players */}
        <div className="text-xs text-muted-foreground text-center">
          Season tracking across {players.length} players • 
          Match Day progress: {currentMatchDay}/22
        </div>
      </CardContent>
    </Card>
  );
};

export default SeasonStats;