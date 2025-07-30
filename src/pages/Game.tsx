import { useGameState } from '@/hooks/useGameState';
import { GameHeader } from '@/components/GameHeader';
import { PositionSection } from '@/components/PositionSection';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Game = () => {
  const navigate = useNavigate();
  const {
    gameState,
    togglePlayer,
    startGame,
    pauseGame,
    nextQuarter,
    resetGame,
  } = useGameState();

  const { players, activePlayersByPosition, isPlaying, currentQuarter, quarterTime, totalTime } = gameState;

  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-field-grass p-4 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">No Players Configured</h2>
          <p className="text-muted-foreground mb-6">
            Please set up your team roster before starting a game.
          </p>
          <Button onClick={() => navigate('/settings')} size="lg">
            <Settings className="w-5 h-5 mr-2" />
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-field-grass p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div></div>
          <Button 
            onClick={() => navigate('/settings')} 
            variant="outline"
            className="bg-white hover:bg-gray-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>

        <GameHeader
          isPlaying={isPlaying}
          currentQuarter={currentQuarter}
          quarterTime={quarterTime}
          totalTime={totalTime}
          onStart={startGame}
          onPause={pauseGame}
          onNextQuarter={nextQuarter}
          onReset={resetGame}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PositionSection
            title="FORWARD"
            position="forward"
            players={players}
            activePlayers={activePlayersByPosition.forward}
            onTogglePlayer={togglePlayer}
            maxPlayers={6}
          />
          
          <PositionSection
            title="MIDFIELD"
            position="midfield"
            players={players}
            activePlayers={activePlayersByPosition.midfield}
            onTogglePlayer={togglePlayer}
            maxPlayers={6}
          />
          
          <PositionSection
            title="DEFENSE"
            position="defense"
            players={players}
            activePlayers={activePlayersByPosition.defense}
            onTogglePlayer={togglePlayer}
            maxPlayers={6}
          />
        </div>

        <div className="mt-6 text-center">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-field-line font-semibold">
              Players on Field: {activePlayersByPosition.forward.length + activePlayersByPosition.midfield.length + activePlayersByPosition.defense.length}/18
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;