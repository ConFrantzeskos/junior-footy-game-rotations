import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Player } from '@/types/sports';
import { toast } from '@/hooks/use-toast';
import { createNewPlayer, migratePlayerToSeasonFormat } from '@/utils/seasonManager';

const Settings = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');

  // Load players from localStorage on component mount
  useEffect(() => {
    const savedPlayers = localStorage.getItem('players');
    if (savedPlayers) {
      const parsedPlayers = JSON.parse(savedPlayers);
      // Migrate old players to new season format
      const migratedPlayers = parsedPlayers.map(migratePlayerToSeasonFormat);
      setPlayers(migratedPlayers);
    } else {
      // Initialize with some default players using new format
      const defaultPlayers: Player[] = Array.from({ length: 25 }, (_, i) => 
        createNewPlayer(`Player ${i + 1}`, `player-${i + 1}`)
      );
      setPlayers(defaultPlayers);
    }
  }, []);

  const addPlayer = () => {
    if (!newPlayerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a player name",
        variant: "destructive",
      });
      return;
    }

    if (players.length >= 25) {
      toast({
        title: "Maximum Players Reached",
        description: "You can only have 25 players maximum",
        variant: "destructive",
      });
      return;
    }

    const newPlayer: Player = createNewPlayer(newPlayerName);

    setPlayers([...players, newPlayer]);
    setNewPlayerName('');
    
    toast({
      title: "Player Added",
      description: `${newPlayerName} has been added to the roster`,
    });
  };

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId));
    toast({
      title: "Player Removed",
      description: "Player has been removed from the roster",
    });
  };

  const updatePlayerName = (playerId: string, newName: string) => {
    setPlayers(players.map(p => 
      p.id === playerId ? { ...p, name: newName } : p
    ));
  };

  const updatePlayerGuernsey = (playerId: string, guernseyNumber?: number) => {
    setPlayers(players.map(p => 
      p.id === playerId ? { ...p, guernseyNumber } : p
    ));
  };

  const saveSettings = () => {
    localStorage.setItem('players', JSON.stringify(players));
    toast({
      title: "Settings Saved",
      description: "Player roster has been saved successfully",
    });
  };

  const resetAllStats = () => {
    const resetPlayers = players.map(player => ({
      ...player,
      isActive: false,
      currentPosition: null,
      lastInterchangeTime: 0,
      timeStats: { forward: 0, midfield: 0, defence: 0 },
      quarterStats: {},
      // Keep season stats intact - only reset current game
    }));
    setPlayers(resetPlayers);
    localStorage.setItem('players', JSON.stringify(resetPlayers));
    localStorage.removeItem('gameState');
    
    toast({
      title: "Current Game Stats Reset",
      description: "Current game statistics cleared. Season stats preserved.",
    });
  };

  return (
    <div className="min-h-screen bg-field-grass p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={() => navigate('/')} 
            variant="outline"
            className="bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Game
          </Button>
          
          <h1 className="text-3xl font-bold text-field-line">Team Settings</h1>
          
          <div className="flex gap-2">
            <Button onClick={saveSettings} className="bg-white text-field-grass hover:bg-gray-50">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Add New Player */}
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4">Add New Player</h2>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="playerName">Player Name</Label>
                <Input
                  id="playerName"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Enter player name"
                  onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addPlayer} disabled={players.length >= 25}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Player
                </Button>
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center text-sm text-muted-foreground">
              <span>Players: {players.length}/25</span>
              <Badge variant={players.length >= 25 ? "destructive" : "secondary"}>
                {25 - players.length} remaining
              </Badge>
            </div>
          </Card>

          {/* Player Roster */}
          <Card className="p-6 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Player Roster</h2>
              <Button onClick={resetAllStats} variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Reset All Stats
              </Button>
            </div>
            
            {players.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No players added yet. Add your first player above.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-20">
                      <Label className="text-xs">Guernsey #</Label>
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        value={player.guernseyNumber || ''}
                        onChange={(e) => updatePlayerGuernsey(player.id, parseInt(e.target.value) || undefined)}
                        placeholder="#"
                        className="text-center text-sm h-8"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={player.name}
                        onChange={(e) => updatePlayerName(player.id, e.target.value)}
                        className="font-medium h-8"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground min-w-[80px] text-right">
                      {Math.floor(Object.values(player.timeStats).reduce((a, b) => a + b, 0) / 60)}m
                      <br />
                      <span className="text-xs opacity-75">
                        S: {Math.floor(player.seasonStats.totalGameTime / 60)}m
                      </span>
                    </div>
                    <Button
                      onClick={() => removePlayer(player.id)}
                      variant="destructive"
                      size="sm"
                      className="min-h-[32px] min-w-[32px] p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Settings;