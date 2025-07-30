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
    <Card className="p-4 mb-6 bg-field-grass border-field-line">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl font-bold text-field-line mb-2">
            Sports Rotation Tracker
          </h1>
          <div className="flex gap-6 text-field-line">
            <div>
              <span className="text-sm opacity-80">Quarter:</span>
              <span className="ml-2 text-xl font-bold">{currentQuarter}/4</span>
            </div>
            <div>
              <span className="text-sm opacity-80">Quarter Time:</span>
              <span className="ml-2 text-xl font-mono">{formatTime(quarterTime)}</span>
            </div>
            <div>
              <span className="text-sm opacity-80">Total Time:</span>
              <span className="ml-2 text-xl font-mono">{formatTime(totalTime)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isPlaying ? (
            <Button onClick={onPause} variant="secondary" size="lg">
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          ) : (
            <Button onClick={onStart} variant="default" size="lg">
              <Play className="w-5 h-5 mr-2" />
              Start
            </Button>
          )}
          
          {currentQuarter < 4 && (
            <Button onClick={onNextQuarter} variant="secondary" size="lg">
              <SkipForward className="w-5 h-5 mr-2" />
              Next Quarter
            </Button>
          )}
          
          <Button onClick={onReset} variant="destructive" size="lg">
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};