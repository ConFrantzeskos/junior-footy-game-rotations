import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipForward, RotateCcw, Trophy, CheckCircle, Calendar, Clock, Users, Settings } from "lucide-react";

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
  onNavigateToSettings: () => void;
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
  onNavigateToSettings,
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
      {/* Apple-style Aussie Rules Header */}
      <div className="flex items-center justify-between mb-lg">
        <div className="flex-1" />
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sherrin-red via-position-forward to-position-midfield bg-clip-text text-transparent mb-sm">
            Junior Footy Manager
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Smart rotation management for Australian Rules Football
          </p>
        </div>
        <div className="flex-1 flex justify-end">
          <Button 
            onClick={onNavigateToSettings} 
            variant="outline"
            className="card-elevated"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Dashboard Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-card via-card to-accent/30 border-0">
        {/* Header Band */}
        <div className="h-2 bg-gradient-to-r from-sherrin-red via-position-forward to-position-midfield" />
        
        <div className="p-xl">
          {/* Season Context - Clean Header */}
          <div className="flex items-center justify-between mb-xl">
            <div className="flex items-center gap-lg">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sherrin-red to-position-forward flex items-center justify-center shadow-md">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Season {currentSeason}</h2>
                  <div className="flex items-center gap-md text-sm text-muted-foreground">
                    <span>Match Day {matchDay}</span>
                    <span>•</span>
                    <span>{formatDate(gameDate)}</span>
                    {opponent && (
                      <>
                        <span>•</span>
                        <span>vs {opponent}</span>
                        {venue && (
                          <Badge variant="outline" className="ml-sm text-xs">
                            {venue.toUpperCase()}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Status Indicator */}
            <div className="flex items-center gap-md">
              {gameCompleted && (
                <Badge className="px-md py-sm bg-status-balanced/10 text-status-balanced border border-status-balanced/20">
                  <CheckCircle className="w-3 h-3 mr-sm" />
                  Complete
                </Badge>
              )}
              
              {!gameCompleted && (
                <div className="flex items-center gap-sm">
                  {isPlaying ? (
                    <>
                      <div className="w-2 h-2 bg-sherrin-red rounded-full animate-pulse" />
                      <span className="text-sm font-bold text-sherrin-red">LIVE</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                      <span className="text-sm font-bold text-muted-foreground">PAUSED</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Game Progress - Simplified */}
          <div className="grid grid-cols-3 gap-xl mb-xl">
            {/* Quarter Progress */}
            <Card className="p-lg bg-gradient-to-br from-position-forward/5 to-position-midfield/5 border border-position-forward/20">
              <div className="text-center">
                <div className="flex items-center justify-center gap-sm mb-md">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-position-forward to-position-midfield flex items-center justify-center shadow-sm">
                    <span className="text-sm font-bold text-white">{currentQuarter}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">of 4</div>
                </div>
                <div className="text-2xl font-bold text-foreground font-mono">{formatTime(quarterTime)}</div>
                <div className="text-xs text-muted-foreground mt-sm">Quarter Time</div>
              </div>
            </Card>

            {/* Total Game Time */}
            <Card className="p-lg bg-gradient-to-br from-position-midfield/5 to-position-defence/5 border border-position-midfield/20">
              <div className="text-center">
                <Clock className="w-6 h-6 text-position-midfield mx-auto mb-md" />
                <div className="text-2xl font-bold text-foreground font-mono">{formatTime(totalTime)}</div>
                <div className="text-xs text-muted-foreground mt-sm">Total Time</div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-lg bg-gradient-to-br from-position-defence/5 to-sherrin-red/5 border border-position-defence/20">
              <div className="flex flex-col gap-sm h-full justify-center">
                {!gameCompleted ? (
                  <>
                    {!isPlaying ? (
                      <Button 
                        onClick={onStart} 
                        size="sm" 
                        className="bg-gradient-to-r from-status-balanced to-position-midfield hover:from-status-balanced/90 hover:to-position-midfield/90 text-white font-semibold"
                      >
                        <Play className="w-4 h-4 mr-sm" />
                        Start
                      </Button>
                    ) : (
                      <Button 
                        onClick={onPause} 
                        size="sm" 
                        variant="outline"
                        className="border border-sherrin-red/30 text-sherrin-red hover:bg-sherrin-red/5"
                      >
                        <Pause className="w-4 h-4 mr-sm" />
                        Pause
                      </Button>
                    )}
                    
                    <Button 
                      onClick={onNextQuarter} 
                      size="sm" 
                      variant="outline"
                      disabled={currentQuarter >= 4}
                      className="border border-position-forward/30 text-position-forward hover:bg-position-forward/5 disabled:opacity-50"
                    >
                      <SkipForward className="w-4 h-4 mr-sm" />
                      Next
                    </Button>
                  </>
                ) : (
                  onStartNewGame && (
                    <Button 
                      onClick={() => onStartNewGame()}
                      size="sm"
                      className="bg-gradient-to-r from-status-balanced to-position-midfield hover:from-status-balanced/90 hover:to-position-midfield/90 text-white font-semibold"
                    >
                      <Play className="w-4 h-4 mr-sm" />
                      New Game
                    </Button>
                  )
                )}
              </div>
            </Card>
          </div>

          {/* Secondary Actions */}
          <div className="flex justify-center gap-md">
            {onCompleteGame && currentQuarter >= 4 && !gameCompleted && (
              <Button 
                onClick={() => onCompleteGame()}
                variant="outline"
                className="border-2 border-position-midfield/30 text-position-midfield hover:bg-position-midfield/5 font-semibold px-lg"
              >
                <CheckCircle className="w-4 h-4 mr-sm" />
                Complete Game
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Danger Zone - Reset at Bottom */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={onReset} 
          variant="outline"
          size="sm"
          className="border-2 border-destructive/30 text-destructive hover:bg-destructive/5 bg-background/90 backdrop-blur-sm shadow-lg"
        >
          <RotateCcw className="w-4 h-4 mr-sm" />
          Reset Game
        </Button>
      </div>
    </div>
  );
};