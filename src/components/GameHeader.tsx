import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipForward, RotateCcw, Trophy, CheckCircle, Calendar, Clock, Users } from "lucide-react";

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
    <div className="relative mb-xl">
      {/* Main Dashboard Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-card via-card to-accent/30 border-0">
        {/* Header Band */}
        <div className="h-2 bg-gradient-to-r from-sherrin-red via-position-forward to-position-midfield" />
        
        <div className="p-xl">
          {/* Top Row - Season & Status */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-lg mb-xl">
            <div className="flex items-center gap-lg">
              <div className="flex items-center gap-md">
                <div className="flex items-center gap-sm">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sherrin-red to-position-forward flex items-center justify-center shadow-md">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Season {currentSeason}</h1>
                    <p className="text-sm text-muted-foreground">Australian Rules Football</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-md">
                <Badge variant="secondary" className="px-md py-sm bg-sherrin-red/10 text-sherrin-red border border-sherrin-red/20">
                  <Calendar className="w-3 h-3 mr-sm" />
                  Match Day {matchDay}
                </Badge>
                {gameCompleted && (
                  <Badge className="px-md py-sm bg-status-balanced/10 text-status-balanced border border-status-balanced/20">
                    <CheckCircle className="w-3 h-3 mr-sm" />
                    Game Complete
                  </Badge>
                )}
              </div>
            </div>

            {/* Match Details */}
            <div className="flex items-center gap-lg text-sm">
              <div className="flex items-center gap-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{formatDate(gameDate)}</span>
              </div>
              {opponent && (
                <div className="flex items-center gap-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">vs {opponent}</span>
                  {venue && (
                    <Badge variant="outline" className="ml-sm text-xs">
                      {venue === 'home' ? 'HOME' : 'AWAY'}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Game Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-lg mb-xl">
            {/* Quarter Display */}
            <div className="md:col-span-1 lg:col-span-2">
              <Card className="h-full p-lg bg-gradient-to-br from-position-forward/5 to-position-midfield/5 border border-position-forward/20">
                <div className="flex items-center justify-between h-full">
                  <div>
                    <p className="text-xs font-semibold text-position-forward uppercase tracking-wider mb-sm">Current Quarter</p>
                    <div className="flex items-baseline gap-sm">
                      <span className="text-4xl font-bold text-foreground font-mono">{currentQuarter}</span>
                      <span className="text-lg text-muted-foreground font-medium">of 4</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-position-forward to-position-midfield flex items-center justify-center shadow-md">
                    <span className="text-xl font-bold text-white">{currentQuarter}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quarter Time */}
            <div className="md:col-span-1">
              <Card className="h-full p-lg bg-gradient-to-br from-position-midfield/5 to-position-defence/5 border border-position-midfield/20">
                <div className="text-center h-full flex flex-col justify-center">
                  <div className="flex items-center justify-center gap-sm mb-sm">
                    <Clock className="w-4 h-4 text-position-midfield" />
                    <p className="text-xs font-semibold text-position-midfield uppercase tracking-wider">Quarter Time</p>
                  </div>
                  <span className="text-2xl font-bold text-foreground font-mono">{formatTime(quarterTime)}</span>
                </div>
              </Card>
            </div>

            {/* Total Time */}
            <div className="md:col-span-1">
              <Card className="h-full p-lg bg-gradient-to-br from-position-defence/5 to-sherrin-red/5 border border-position-defence/20">
                <div className="text-center h-full flex flex-col justify-center">
                  <div className="flex items-center justify-center gap-sm mb-sm">
                    <Clock className="w-4 h-4 text-position-defence" />
                    <p className="text-xs font-semibold text-position-defence uppercase tracking-wider">Total Time</p>
                  </div>
                  <span className="text-2xl font-bold text-foreground font-mono">{formatTime(totalTime)}</span>
                </div>
              </Card>
            </div>

            {/* Game Status */}
            <div className="md:col-span-1 lg:col-span-1">
              <Card className="h-full p-lg bg-gradient-to-br from-sherrin-red/5 to-position-forward/5 border border-sherrin-red/20">
                <div className="text-center h-full flex flex-col justify-center">
                  <p className="text-xs font-semibold text-sherrin-red uppercase tracking-wider mb-sm">Game Status</p>
                  <div className="flex items-center justify-center gap-sm">
                    {isPlaying ? (
                      <>
                        <div className="w-2 h-2 bg-status-balanced rounded-full animate-pulse" />
                        <span className="text-sm font-bold text-status-balanced">LIVE</span>
                      </>
                    ) : gameCompleted ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-bold text-muted-foreground">FINISHED</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                        <span className="text-sm font-bold text-muted-foreground">PAUSED</span>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap gap-md justify-center lg:justify-end">
            {!gameCompleted ? (
              <>
                {!isPlaying ? (
                  <Button 
                    onClick={onStart} 
                    size="lg" 
                    className="bg-gradient-to-r from-status-balanced to-position-midfield hover:from-status-balanced/90 hover:to-position-midfield/90 text-white font-semibold px-lg shadow-lg"
                  >
                    <Play className="w-5 h-5 mr-sm" />
                    Start Game
                  </Button>
                ) : (
                  <Button 
                    onClick={onPause} 
                    size="lg" 
                    variant="outline"
                    className="border-2 border-sherrin-red/30 text-sherrin-red hover:bg-sherrin-red/5 font-semibold px-lg"
                  >
                    <Pause className="w-5 h-5 mr-sm" />
                    Pause
                  </Button>
                )}
                
                <Button 
                  onClick={onNextQuarter} 
                  size="lg" 
                  variant="outline"
                  disabled={currentQuarter >= 4}
                  className="border-2 border-position-forward/30 text-position-forward hover:bg-position-forward/5 disabled:opacity-50 font-semibold px-lg"
                >
                  <SkipForward className="w-5 h-5 mr-sm" />
                  Next Quarter
                </Button>

                {onCompleteGame && currentQuarter >= 4 && (
                  <Button 
                    onClick={() => onCompleteGame()}
                    size="lg"
                    className="bg-gradient-to-r from-position-midfield to-position-defence hover:from-position-midfield/90 hover:to-position-defence/90 text-white font-semibold px-lg shadow-lg"
                  >
                    <CheckCircle className="w-5 h-5 mr-sm" />
                    Complete Game
                  </Button>
                )}
              </>
            ) : (
              onStartNewGame && (
                <Button 
                  onClick={() => onStartNewGame()}
                  size="lg"
                  className="bg-gradient-to-r from-status-balanced to-position-midfield hover:from-status-balanced/90 hover:to-position-midfield/90 text-white font-semibold px-lg shadow-lg"
                >
                  <Play className="w-5 h-5 mr-sm" />
                  New Game
                </Button>
              )
            )}
            
            <Button 
              onClick={onReset} 
              size="lg" 
              variant="outline"
              className="border-2 border-muted-foreground/30 text-muted-foreground hover:bg-muted/50 font-semibold px-lg"
            >
              <RotateCcw className="w-5 h-5 mr-sm" />
              Reset
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};