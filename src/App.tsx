import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Game from "./pages/Game";
import Settings from "./pages/Settings";
import Welcome from "./pages/Welcome";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [hasPlayers, setHasPlayers] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if players are configured
    const savedPlayers = localStorage.getItem('players');
    if (savedPlayers) {
      try {
        const players = JSON.parse(savedPlayers);
        // Check if there are any actual players (not just empty array)
        const hasConfiguredPlayers = Array.isArray(players) && players.length > 0 && 
          players.some(p => p.name && p.name.trim() && !p.name.startsWith('Player '));
        setHasPlayers(hasConfiguredPlayers);
      } catch {
        setHasPlayers(false);
      }
    } else {
      setHasPlayers(false);
    }
  }, []);

  // Show loading while checking player configuration
  if (hasPlayers === null) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={hasPlayers ? <Game /> : <Welcome />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/welcome" element={<Welcome />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
