import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AppHeaderProps {
  showSettingsButton?: boolean;
}

export const AppHeader = ({ showSettingsButton = true }: AppHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="bg-gradient-to-br from-card via-card to-accent/30 border-b">
      <div className="h-2 bg-gradient-to-r from-sherrin-red via-position-forward to-position-midfield" />
      <div className="container mx-auto max-w-7xl px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-sherrin-red via-position-forward to-position-midfield bg-clip-text text-transparent mb-2">
              Junior Footy Manager
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Smart rotation management for Australian Rules Football
            </p>
          </div>
          <div className="flex-1 flex justify-end">
            {showSettingsButton && location.pathname !== '/settings' && (
              <Button 
                onClick={() => navigate('/settings')} 
                variant="outline"
                className="card-elevated"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};