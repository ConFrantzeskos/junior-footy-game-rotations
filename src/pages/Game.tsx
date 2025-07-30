import { useGameState } from '@/hooks/useGameState';
import { GameHeader } from '@/components/GameHeader';
import { PositionSection } from '@/components/PositionSection';
import { DraggablePlayer } from '@/components/DraggablePlayer';
import PlannedSubstitutions from '@/components/PlannedSubstitutions';
import PlayerContextMenu from '@/components/PlayerContextMenu';
import AutoRotationSuggestions from '@/components/AutoRotationSuggestions';
import SeasonStats from '@/components/SeasonStats';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Position, Player } from '@/types/sports';
import { calculatePlayerRankings } from '@/utils/playerRanking';
import { generateRotationSuggestions } from '@/utils/autoRotationEngine';
import { RotationAnalysis } from '@/types/autoRotation';

const Game = () => {
  const navigate = useNavigate();
  const [draggedPlayer, setDraggedPlayer] = useState<{ id: string; sourcePosition?: Position } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    player: Player;
    position: { x: number; y: number };
  } | null>(null);
  const [rotationAnalysis, setRotationAnalysis] = useState<RotationAnalysis | null>(null);
  
  const {
    gameState,
    togglePlayer,
    movePlayer,
    removePlayer,
    swapPlayers,
    startGame,
    pauseGame,
    nextQuarter,
    resetGame,
    addPlannedSubstitution,
    removePlannedSubstitution,
    executePlannedSubstitution,
    completeGame,
    startNewGame,
  } = useGameState();

  const { players, activePlayersByPosition, isPlaying, currentQuarter, quarterTime, totalTime, 
          plannedSubstitutions, currentSeason, matchDay, gameDate, opponent, venue, gameCompleted } = gameState;
  
  // Calculate player rankings based on total game time
  const playerRankings = calculatePlayerRankings(players);

  // Generate rotation suggestions when game state changes
  useEffect(() => {
    if (isPlaying && players.length > 0) {
      const analysis = generateRotationSuggestions(gameState);
      setRotationAnalysis(analysis);
    } else {
      setRotationAnalysis(null);
    }
  }, [gameState, isPlaying, players.length]);

  const refreshRotationSuggestions = () => {
    if (isPlaying && players.length > 0) {
      const analysis = generateRotationSuggestions(gameState);
      setRotationAnalysis(analysis);
    }
  };

  const handleDragStart = (playerId: string, sourcePosition?: Position) => {
    setDraggedPlayer({ id: playerId, sourcePosition });
  };

  const handleDragEnd = () => {
    setDraggedPlayer(null);
  };

  const handleLongPress = (player: Player, position: { x: number; y: number }) => {
    setContextMenu({ player, position });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleExecuteRotationSwap = (playerInId: string, playerOutId: string) => {
    swapPlayers(playerInId, playerOutId);
    // Refresh suggestions after execution
    setTimeout(refreshRotationSuggestions, 100);
  };

  const availablePlayers = players.filter(p => !p.isActive);

  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center bg-card rounded-lg p-8 card-elevated">
          <h2 className="text-2xl font-bold mb-4 font-system">No Players Configured</h2>
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
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div></div>
          <Button 
            onClick={() => navigate('/settings')} 
            variant="outline"
            className="card-elevated"
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
          gameCompleted={gameCompleted}
          currentSeason={currentSeason}
          matchDay={matchDay}
          gameDate={gameDate}
          opponent={opponent}
          venue={venue}
          onStart={startGame}
          onPause={pauseGame}
          onNextQuarter={nextQuarter}
          onReset={resetGame}
          onCompleteGame={completeGame}
          onStartNewGame={startNewGame}
        />

        {/* Season Statistics */}
        <div className="mb-6">
          <SeasonStats 
            players={players}
            currentMatchDay={matchDay}
            currentSeason={currentSeason}
          />
        </div>

        {/* Planned Substitutions Queue */}
        <div className="mb-6">
          <PlannedSubstitutions
            plannedSubstitutions={plannedSubstitutions}
            players={players}
            onExecuteSubstitution={executePlannedSubstitution}
            onRemoveSubstitution={removePlannedSubstitution}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <PositionSection
            title="FORWARDS"
            position="forward"
            players={players}
            activePlayers={activePlayersByPosition.forward}
            onTogglePlayer={togglePlayer}
            onMovePlayer={movePlayer}
            onRemovePlayer={removePlayer}
            onDragStart={handleDragStart}
            onPlayerSwap={swapPlayers}
            maxPlayers={6}
            playerRankings={playerRankings}
            currentGameTime={totalTime}
          />
          
          <PositionSection
            title="MIDFIELDERS"
            position="midfield"
            players={players}
            activePlayers={activePlayersByPosition.midfield}
            onTogglePlayer={togglePlayer}
            onMovePlayer={movePlayer}
            onRemovePlayer={removePlayer}
            onDragStart={handleDragStart}
            onPlayerSwap={swapPlayers}
            maxPlayers={6}
            playerRankings={playerRankings}
            currentGameTime={totalTime}
          />
          
          <PositionSection
            title="DEFENDERS"
            position="defence"
            players={players}
            activePlayers={activePlayersByPosition.defence}
            onTogglePlayer={togglePlayer}
            onMovePlayer={movePlayer}
            onRemovePlayer={removePlayer}
            onDragStart={handleDragStart}
            onPlayerSwap={swapPlayers}
            maxPlayers={6}
            playerRankings={playerRankings}
            currentGameTime={totalTime}
          />
        </div>

        {/* Interchange Section */}
        <Card className="mt-2xl p-lg card-elevated">
          <div className="flex items-center justify-between mb-lg">
            <h3 className="text-xl font-bold font-system tracking-tight">Interchange</h3>
            <div className="text-sm text-muted-foreground font-semibold">
              On Ground: {activePlayersByPosition.forward.length + activePlayersByPosition.midfield.length + activePlayersByPosition.defence.length}/18
            </div>
          </div>
          
          {availablePlayers.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-md auto-rows-min">
              {availablePlayers
                .sort((a, b) => {
                  // Sort by time on bench: longest first (left), shortest last (right)
                  const timeOnBenchA = totalTime - a.lastInterchangeTime;
                  const timeOnBenchB = totalTime - b.lastInterchangeTime;
                  return timeOnBenchB - timeOnBenchA;
                })
                .map((player) => {
                const ranking = playerRankings.find(r => r.id === player.id);
                return (
                  <div key={player.id} className="flex">
                    <DraggablePlayer
                      player={player}
                      onDragStart={handleDragStart}
                      onPlayerSwap={swapPlayers}
                      onLongPress={handleLongPress}
                      className="w-full min-h-[70px] flex-1"
                      showTime={true}
                      ranking={ranking}
                      currentGameTime={totalTime}
                    />
                  </div>
                );
              })}
            </div>
          )}
          
          {availablePlayers.length === 0 && (
            <div className="text-center py-xl text-muted-foreground border-2 border-dashed border-border/40 rounded-lg bg-muted/30">
              <div className="font-semibold text-lg mb-sm">All players are on the field</div>
              <div className="text-sm opacity-70">Drag players here to substitute them</div>
            </div>
          )}
        </Card>

        {/* Auto-Rotation Suggestions at Bottom */}
        <div className="mt-6">
          <AutoRotationSuggestions
            rotationAnalysis={rotationAnalysis}
            players={players}
            onExecuteSwap={handleExecuteRotationSwap}
            onRefresh={refreshRotationSuggestions}
            isGameActive={isPlaying}
            currentGameTime={totalTime}
            gameState={gameState}
            currentQuarter={currentQuarter}
            quarterTime={quarterTime}
          />
        </div>

        {/* Context Menu */}
        <PlayerContextMenu
          player={contextMenu?.player}
          onAddPlannedSubstitution={addPlannedSubstitution}
          isOpen={!!contextMenu}
          onClose={handleCloseContextMenu}
          position={contextMenu?.position || { x: 0, y: 0 }}
        />
      </div>
    </div>
  );
};

export default Game;