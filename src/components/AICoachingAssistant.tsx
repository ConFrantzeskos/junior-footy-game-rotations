import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Brain, MessageSquare, Send, Loader2, User, Bot, Sparkles } from 'lucide-react';
import { Player, GameState } from '@/types/sports';
import { AICoachingAssistantService, ConversationEntry } from '@/services/aiCoachingAssistantService';

interface AICoachingAssistantProps {
  players: Player[];
  gameState?: GameState;
  seasonData?: any;
}

export function AICoachingAssistant({ players, gameState, seasonData }: AICoachingAssistantProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [currentResponse, setCurrentResponse] = useState<string>('');

  const quickQuestions = [
    "Who should I start next game?",
    "How is the team performing this season?",
    "Which players need more development time?",
    "Should I make any interchanges right now?",
    "Who are my most versatile players?",
    "What's the best rotation strategy for today?"
  ];

  const handleSubmit = async (question?: string) => {
    const actualQuery = question || query;
    if (!actualQuery.trim() || isLoading) return;

    setIsLoading(true);
    setQuery('');
    setCurrentResponse('');

    // Add user message to conversation
    const userMessage: ConversationEntry = {
      role: 'user',
      content: actualQuery,
      timestamp: new Date().toISOString()
    };
    setConversation(prev => [...prev, userMessage]);

    try {
      const response = await AICoachingAssistantService.askCoachingQuestion(
        actualQuery,
        {
          gameState,
          players,
          seasonData
        },
        'question'
      );

      setCurrentResponse(response.response);
      
      if (response.conversationEntry) {
        setConversation(prev => [...prev, response.conversationEntry]);
      }
    } catch (error) {
      console.error('Coaching assistant error:', error);
      const errorMessage: ConversationEntry = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble right now. Please try again in a moment.",
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Coaching Assistant
            <Sparkles className="h-4 w-4 text-purple-400" />
          </CardTitle>
          <CardDescription>
            Ask questions about your team, players, or get coaching advice powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Questions */}
          <div>
            <h4 className="text-sm font-medium mb-2">Quick Questions:</h4>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSubmit(question)}
                  disabled={isLoading}
                  className="text-xs"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>

          {/* Conversation History */}
          {conversation.length > 0 && (
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-4">
              {conversation.map((entry, index) => (
                <div key={index} className={`flex gap-3 ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[80%] ${entry.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      entry.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {entry.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`p-3 rounded-lg ${
                      entry.role === 'user' ? 'bg-blue-50 text-blue-900' : 'bg-gray-50 text-gray-900'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Current AI Response */}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask me anything about your team, players, or coaching strategy..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1 min-h-[80px]"
            />
            <Button
              onClick={() => handleSubmit()}
              disabled={!query.trim() || isLoading}
              className="px-3"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Context Info */}
          <div className="flex gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{players.length} players</Badge>
            {gameState && <Badge variant="secondary">Live game data</Badge>}
            {seasonData && <Badge variant="secondary">Season context</Badge>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}