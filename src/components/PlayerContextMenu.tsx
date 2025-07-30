import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Player, Position } from '@/types/sports';
import { Plus, Clock } from 'lucide-react';

interface PlayerContextMenuProps {
  player: Player;
  onAddPlannedSubstitution: (playerId: string, targetPosition: Position, priority: 'high' | 'medium' | 'low') => void;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

const PlayerContextMenu = ({
  player,
  onAddPlannedSubstitution,
  isOpen,
  onClose,
  position,
}: PlayerContextMenuProps) => {
  const [selectedPosition, setSelectedPosition] = useState<Position>('forward');
  const [selectedPriority, setSelectedPriority] = useState<'high' | 'medium' | 'low'>('medium');

  if (!isOpen) return null;

  const handleAddSubstitution = () => {
    onAddPlannedSubstitution(player.id, selectedPosition, selectedPriority);
    onClose();
  };

  const positions: Position[] = ['forward', 'midfield', 'defense'];
  const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
    }
  };

  const getPositionColor = (position: Position) => {
    const colors = {
      forward: 'bg-position-forward/10 text-position-forward border-position-forward/20',
      midfield: 'bg-position-midfield/10 text-position-midfield border-position-midfield/20',
      defense: 'bg-position-defense/10 text-position-defense border-position-defense/20',
    };
    return colors[position];
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Menu */}
      <div
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[280px]"
        style={{
          left: Math.min(position.x, window.innerWidth - 300),
          top: Math.min(position.y, window.innerHeight - 200),
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-orange-600" />
          <span className="font-medium text-sm">Plan Substitution</span>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Player
            </label>
            <div className="flex items-center gap-2">
              {player.jerseyNumber && (
                <div className="w-4 h-4 rounded-full bg-sherrin-red text-white text-xs font-bold flex items-center justify-center">
                  {player.jerseyNumber}
                </div>
              )}
              <span className="text-sm font-medium">{player.name}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Target Position
            </label>
            <div className="flex gap-1">
              {positions.map((pos) => (
                <Badge
                  key={pos}
                  variant={selectedPosition === pos ? "default" : "outline"}
                  className={`cursor-pointer text-xs px-2 py-1 ${
                    selectedPosition === pos ? getPositionColor(pos) : ''
                  }`}
                  onClick={() => setSelectedPosition(pos)}
                >
                  {pos}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Priority
            </label>
            <div className="flex gap-1">
              {priorities.map((priority) => (
                <Badge
                  key={priority}
                  variant={selectedPriority === priority ? getPriorityColor(priority) : "outline"}
                  className="cursor-pointer text-xs px-2 py-1"
                  onClick={() => setSelectedPriority(priority)}
                >
                  {priority}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAddSubstitution}
              size="sm"
              className="flex-1"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add to Queue
            </Button>
            <Button
              onClick={onClose}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlayerContextMenu;