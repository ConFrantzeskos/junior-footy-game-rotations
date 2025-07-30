import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipForward, RotateCcw, Trophy, CheckCircle } from "lucide-react";

interface GameHeaderProps {
  // Game state
  isPlaying: boolean;
  currentQuarter: number;
  quarterTime: number;
  totalTime: number;
  gameCompleted: boolean;
  
  // Season context
  currentSeason: number;
  matchDay: number;
  gameDate: string;
  opponent?: string;
  venue?: 'home' | 'away';
  
  // Actions
  onStart: () => void;
  onPause: () => void;
  onNextQuarter: () => void;
  onReset: () => void;
  onCompleteGame?: (result?: 'win' | 'loss' | 'draw') => void;
  onStartNewGame?: (matchDay?: number, opponent?: string, venue?: 'home' | 'away') => void;
}

export const GameHeader = ({
  isPlaying,
  currentQuarter,
  quarterTime,
  totalTime,
  gameCompleted,
  currentSeason,
  matchDay,
  gameDate,
  opponent,
  venue,
  onStart,
  onPause,
  onNextQuarter,
  onReset,
  onCompleteGame,
  onStartNewGame,
}: GameHeaderProps) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <Card className="mb-xl p-xl bg-white card-elevated border-l-4 border-l-sherrin-red">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-xl">
        
        {/* Season & Match Info */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <span className="font-bold text-lg">Season {currentSeason}</span>
            </div>
            <Badge variant="outline" className="bg-sherrin-red/10 text-sherrin-red border-sherrin-red/20">
              Match Day {matchDay}
            </Badge>
            {gameCompleted && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{formatDate(gameDate)}</span>
            {opponent && (
              <>
                <span>vs {opponent}</span>
                {venue && (
                  <Badge variant="secondary" className="text-xs">
                    {venue === 'home' ? 'Home' : 'Away'}
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>

        {/* Game Stats */}
        <div className="flex flex-col sm:flex-row gap-2xl text-foreground">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">Quarter</span>
            <span className="text-2xl font-bold font-mono">{currentQuarter}</span>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">Quarter Time</span>
            <span className="text-2xl font-bold font-mono">{formatTime(quarterTime)}</span>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">Total Time</span>
            <span className="text-2xl font-bold font-mono">{formatTime(totalTime)}</span>
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex flex-wrap gap-md">
          {!gameCompleted ? (
            <>
              {!isPlaying ? (
                <Button onClick={onStart} size="lg" className="bg-green-600 hover:bg-green-700">
                  <Play className="w-5 h-5 mr-2" />
                  Start
                </Button>
              ) : (
                <Button onClick={onPause} size="lg" variant="outline">
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
              )}
              
              <Button 
                onClick={onNextQuarter} 
                size="lg" 
                variant="outline"
                disabled={currentQuarter >= 4}
              >
                <SkipForward className="w-5 h-5 mr-2" />
                Next Quarter
              </Button>

              {onCompleteGame && currentQuarter >= 4 && (
                <Button 
                  onClick={() => onCompleteGame()}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Complete Game
                </Button>
              )}
            </>
          ) : (
            onStartNewGame && (
              <Button 
                onClick={() => onStartNewGame()}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-5 h-5 mr-2" />
                New Game
              </Button>
            )
          )}
          
          <Button onClick={onReset} size="lg" variant="outline">
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};