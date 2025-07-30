import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowLeft, Plus, Trash2, Save, TrendingUp, Award, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Player, Position } from '@/types/sports';
import { toast } from '@/hooks/use-toast';
import { createNewPlayer, migratePlayerToSeasonFormat, getPlayerSeasonSummary } from '@/utils/seasonManager';
import { generatePlayerInsights, getTeamAnalytics } from '@/utils/playerAnalytics';

const Settings = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

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

  const updatePlayerAttribute = (playerId: string, attribute: keyof Player['attributes'], value: any) => {
    setPlayers(players.map(p => 
      p.id === playerId ? { 
        ...p, 
        attributes: { ...p.attributes, [attribute]: value } 
      } : p
    ));
  };

  const updatePlayerPreferredPosition = (playerId: string, position: Position) => {
    setPlayers(players.map(p => 
      p.id === playerId ? { 
        ...p, 
        attributes: { ...p.attributes, preferredPosition: position } 
      } : p
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
      currentGamePerformance: {
        interchanges: 0,
        positionSwitches: 0,
        longestStint: 0,
        lastPositionChangeTime: 0,
      },
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

  const teamAnalytics = getTeamAnalytics(players);

  const PlayerCard = ({ player }: { player: Player }) => {
    const summary = getPlayerSeasonSummary(player);
    
    // Prepare pie chart data
    const positionData = [
      { name: 'Forward', value: player.seasonStats.positionTotals.forward, color: '#ef4444' },
      { name: 'Midfield', value: player.seasonStats.positionTotals.midfield, color: '#eab308' },
      { name: 'Defence', value: player.seasonStats.positionTotals.defence, color: '#3b82f6' },
    ].filter(item => item.value > 0); // Only show positions with playing time

    return (
      <Card className="p-4 bg-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">{player.name}</h3>
            <div className="text-sm text-muted-foreground">
              #{player.guernseyNumber || 'N/A'} • {summary.gamesPlayed} games played
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="font-medium text-lg">{summary.totalTime}m</div>
            <div className="text-muted-foreground">total season</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Position breakdown pie chart */}
          <div>
            <h4 className="font-medium mb-2 text-sm">Positions Played</h4>
            {positionData.length > 0 ? (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={positionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={50}
                      dataKey="value"
                    >
                      {positionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${Math.floor(value / 60)}m`, 'Time']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                No game time yet
              </div>
            )}
          </div>

          {/* Player stats */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Average per game:</span>
              <span className="font-medium">{summary.averageTime}m</span>
            </div>
            <div className="flex justify-between">
              <span>Current game:</span>
              <span className="font-medium">
                {Math.floor(Object.values(player.timeStats).reduce((a, b) => a + b, 0) / 60)}m
              </span>
            </div>
            <div className="flex justify-between">
              <span>Preferred position:</span>
              <span className="font-medium capitalize">
                {player.attributes.preferredPosition || 'Not set'}
              </span>
            </div>
            {positionData.length > 0 && (
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-1">Position breakdown:</div>
                {positionData.map((pos) => (
                  <div key={pos.name} className="flex justify-between text-xs">
                    <span style={{ color: pos.color }}>● {pos.name}:</span>
                    <span>{Math.floor(pos.value / 60)}m</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preferred position selector */}
        <div className="mt-4 pt-4 border-t">
          <Label className="text-xs font-medium">Update Preferred Position</Label>
          <Select 
            value={player.attributes.preferredPosition || ''} 
            onValueChange={(value) => updatePlayerPreferredPosition(player.id, value as Position)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select preferred position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="forward">Forward</SelectItem>
              <SelectItem value="midfield">Midfield</SelectItem>
              <SelectItem value="defence">Defence</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-field-grass p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={() => navigate('/')} 
            variant="outline"
            className="bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Game
          </Button>
          
          <h1 className="text-3xl font-bold text-field-line">Team Management</h1>
          
          <div className="flex gap-2">
            <Button onClick={saveSettings} className="bg-white text-field-grass hover:bg-gray-50">
              <Save className="w-4 h-4 mr-2" />
              Save All Changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="roster" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white">
            <TabsTrigger value="roster">Basic Roster</TabsTrigger>
            <TabsTrigger value="attributes">Player Attributes</TabsTrigger>
            <TabsTrigger value="analytics">Team Analytics</TabsTrigger>
            <TabsTrigger value="settings">Advanced Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="roster" className="mt-6">
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

              {/* Basic Player Roster */}
              <Card className="p-6 bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Player Roster</h2>
                  <Button onClick={resetAllStats} variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset Current Game Stats
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
                        <div className="text-sm text-muted-foreground min-w-[120px] text-right">
                          <div>Current: {Math.floor(Object.values(player.timeStats).reduce((a, b) => a + b, 0) / 60)}m</div>
                          <div className="text-xs opacity-75">
                            Season: {Math.floor(player.seasonStats.totalGameTime / 60)}m ({player.seasonStats.gamesCompleted} games)
                          </div>
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
          </TabsContent>

          <TabsContent value="attributes" className="mt-6">
            <div className="grid gap-4">
              <Card className="p-6 bg-white">
                <h2 className="text-xl font-semibold mb-4">Player Attributes & Performance</h2>
                <p className="text-muted-foreground mb-6">
                  Manage individual player attributes, track performance metrics, and get personalized recommendations.
                </p>
              </Card>
              
              <div className="grid gap-4 md:grid-cols-2">
                {players.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid gap-6">
              {/* Team Overview */}
              <Card className="p-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5" />
                  <h2 className="text-xl font-semibold">Team Analytics</h2>
                </div>
                
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {teamAnalytics.averageGameTime}m
                    </div>
                    <div className="text-sm text-muted-foreground">Average Game Time</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">
                      {teamAnalytics.mostVersatilePlayer?.name || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Most Versatile</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded">
                    <div className="text-lg font-bold text-purple-600">
                      {teamAnalytics.mostConsistentPlayer?.name || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Most Consistent</div>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 rounded">
                    <div className="text-lg font-bold text-orange-600">
                      {teamAnalytics.topPerformer?.name || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Top Performer</div>
                  </div>
                </div>
              </Card>

              {/* Position Balance */}
              <Card className="p-6 bg-white">
                <h3 className="text-lg font-semibold mb-4">Team Position Balance</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Forward</span>
                      <span>{teamAnalytics.teamBalance.forward.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${teamAnalytics.teamBalance.forward}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Midfield</span>
                      <span>{teamAnalytics.teamBalance.midfield.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${teamAnalytics.teamBalance.midfield}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Defence</span>
                      <span>{teamAnalytics.teamBalance.defence.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${teamAnalytics.teamBalance.defence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="p-6 bg-white">
              <h2 className="text-xl font-semibold mb-4">Advanced Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <h3 className="font-medium">Reset All Player Statistics</h3>
                    <p className="text-sm text-muted-foreground">
                      Clear all current game data while preserving season history
                    </p>
                  </div>
                  <Button onClick={resetAllStats} variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset Stats
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <h3 className="font-medium">Save All Changes</h3>
                    <p className="text-sm text-muted-foreground">
                      Save player roster, attributes, and settings to local storage
                    </p>
                  </div>
                  <Button onClick={saveSettings}>
                    <Save className="w-4 h-4 mr-2" />
                    Save All
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;