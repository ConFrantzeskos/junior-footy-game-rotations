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
    <Card className="p-8 mb-8 card-elevated">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl font-bold font-system mb-4">
            Sports Rotation Tracker
          </h1>
          <div className="flex flex-col sm:flex-row gap-6 text-foreground">
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-sm text-muted-foreground font-medium">Quarter</span>
              <span className="text-2xl font-bold font-system">{currentQuarter}/4</span>
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-sm text-muted-foreground font-medium">Quarter Time</span>
              <span className="text-2xl font-mono font-bold">{formatTime(quarterTime)}</span>
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-sm text-muted-foreground font-medium">Total Time</span>
              <span className="text-2xl font-mono font-bold">{formatTime(totalTime)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {isPlaying ? (
            <Button onClick={onPause} variant="secondary" size="lg" className="card-elevated">
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          ) : (
            <Button onClick={onStart} variant="default" size="lg" className="card-elevated">
              <Play className="w-5 h-5 mr-2" />
              Start
            </Button>
          )}
          
          {currentQuarter < 4 && (
            <Button onClick={onNextQuarter} variant="secondary" size="lg" className="card-elevated">
              <SkipForward className="w-5 h-5 mr-2" />
              Next Quarter
            </Button>
          )}
          
          <Button onClick={onReset} variant="destructive" size="lg" className="card-elevated">
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};