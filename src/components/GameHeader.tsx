import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

interface GameHeaderProps {
  isPlaying: boolean;
  currentQuarter: number;
  quarterTime: number;
  totalTime: number;
  onStart: () => void;
  onPause: () => void;
  onNextQuarter: () => void;
  onReset: () => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const GameHeader = ({
  isPlaying,
  currentQuarter,
  quarterTime,
  totalTime,
  onStart,
  onPause,
  onNextQuarter,
  onReset,
}: GameHeaderProps) => {
  return (
    <Card className="p-2xl mb-2xl card-elevated border-t-4 border-t-afl-sherrin">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-xl">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-bold font-system mb-lg tracking-tight">
            Sports Rotation Tracker
          </h1>
          <div className="flex flex-col sm:flex-row gap-2xl text-foreground">
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">Quarter</span>
              <span className="text-3xl font-bold font-system">{currentQuarter}/4</span>
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">Quarter Time</span>
              <span className="text-3xl font-mono font-bold">{formatTime(quarterTime)}</span>
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">Total Time</span>
              <span className="text-3xl font-mono font-bold">{formatTime(totalTime)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-md">
          {isPlaying ? (
            <Button onClick={onPause} variant="secondary" size="lg" className="font-semibold">
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          ) : (
            <Button onClick={onStart} variant="default" size="lg" className="font-semibold">
              <Play className="w-5 h-5 mr-2" />
              Start
            </Button>
          )}
          
          {currentQuarter < 4 && (
            <Button onClick={onNextQuarter} variant="secondary" size="lg" className="font-semibold">
              <SkipForward className="w-5 h-5 mr-2" />
              Next Quarter
            </Button>
          )}
          
          <Button onClick={onReset} variant="destructive" size="lg" className="font-semibold">
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};