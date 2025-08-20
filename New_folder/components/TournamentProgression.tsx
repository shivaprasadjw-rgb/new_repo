"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Info } from "lucide-react";

interface TournamentProgressionProps {
  tournamentId: string;
  onClose: () => void;
}

interface Match {
  id: string;
  round: string;
  players: string[];
  winner?: string;
  isCompleted: boolean;
}

interface ProgressionData {
  rounds: string[];
  matches: Match[];
  currentRound: string;
  status: string;
}

export default function TournamentProgression({ tournamentId, onClose }: TournamentProgressionProps) {
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [progression, setProgression] = useState<ProgressionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>("");

  // Generate CSRF token on component mount
  useEffect(() => {
    setCsrfToken(crypto.randomUUID());
  }, []);

  // Get session ID from localStorage
  const getSessionId = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminSessionId');
    }
    return null;
  };

  const fetchProgression = async () => {
    try {
      const sessionId = localStorage.getItem("adminSessionId");
      if (!sessionId) {
        setMessage({ type: 'error', text: 'No active session found. Please log in again.' });
        return;
      }

      const response = await fetch(`/api/admin/tournament-progression?tournamentId=${tournamentId}`, {
        headers: {
          'x-session-id': sessionId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProgression(data.progression);
        setMatches(data.matches);
        setMessage(null); // Clear previous messages
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to fetch progression data' });
      }
    } catch (error: any) {
      console.error('Error fetching progression:', error);
      setMessage({ type: 'error', text: 'Failed to fetch progression data' });
    }
  };

  const getAvailableRounds = (): string[] => {
    if (progression?.rounds && progression.rounds.length > 0) {
      return progression.rounds;
    }
    // Fallback to standard tournament rounds
    return ["Round of 32", "Round of 16", "Quarterfinals", "Semifinals", "Final", "3rd Place Match"];
  };

  const handleRoundChange = (round: string) => {
    setSelectedRound(round);
    if (progression) {
      const roundMatches = progression.matches.filter(m => m.round === round);
      setMatches(roundMatches);
    }
  };

  const populateRound32Matches = async () => {
    setLoading(true);
    try {
      const sessionId = localStorage.getItem("adminSessionId");
      if (!sessionId) {
        setMessage({ type: 'error', text: 'No active session found. Please log in again.' });
        return;
      }

      const response = await fetch('/api/admin/tournament-progression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          tournamentId,
          action: 'populateRound32'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message || 'Round of 32 matches populated successfully!' });
        
        // Refresh progression data after a short delay
        setTimeout(() => {
          fetchProgression();
        }, 500);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to populate matches' });
      }
    } catch (error: any) {
      console.error('Error populating matches:', error);
      setMessage({ type: 'error', text: 'Failed to populate matches' });
    } finally {
      setLoading(false);
    }
  };

  const populateRound16Matches = async () => {
    setLoading(true);
    try {
      const sessionId = localStorage.getItem("adminSessionId");
      if (!sessionId) {
        setMessage({ type: 'error', text: 'No active session found. Please log in again.' });
        return;
      }

      const response = await fetch('/api/admin/tournament-progression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          tournamentId,
          action: 'populateRound16'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message || 'Round of 16 matches populated successfully!' });
        
        setTimeout(() => {
          fetchProgression();
        }, 500);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to populate matches' });
      }
    } catch (error: any) {
      console.error('Error populating matches:', error);
      setMessage({ type: 'error', text: 'Failed to populate matches' });
    } finally {
      setLoading(false);
    }
  };

  const fixProgression = async () => {
    setLoading(true);
    try {
      const sessionId = localStorage.getItem("adminSessionId");
      if (!sessionId) {
        setMessage({ type: 'error', text: 'No active session found. Please log in again.' });
        return;
      }

      const response = await fetch('/api/admin/tournament-progression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          tournamentId,
          action: 'fixProgression'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message || 'Tournament progression fixed successfully!' });
        
        setTimeout(() => {
          fetchProgression();
        }, 500);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to fix progression' });
      }
    } catch (error: any) {
      console.error('Error fixing progression:', error);
      setMessage({ type: 'error', text: 'Failed to fix progression' });
    } finally {
      setLoading(false);
    }
  };

  const validateIntegrity = async () => {
    setLoading(true);
    try {
      const sessionId = localStorage.getItem("adminSessionId");
      if (!sessionId) {
        setMessage({ type: 'error', text: 'No active session found. Please log in again.' });
        return;
      }

      const response = await fetch('/api/admin/tournament-progression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          tournamentId,
          action: 'validateIntegrity'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'info', text: data.message || 'Data integrity check completed' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to validate integrity' });
      }
    } catch (error: any) {
      console.error('Error validating integrity:', error);
      setMessage({ type: 'error', text: 'Failed to validate integrity' });
    } finally {
      setLoading(false);
    }
  };

  const regenerateProgression = async () => {
    setLoading(true);
    try {
      const sessionId = localStorage.getItem("adminSessionId");
      if (!sessionId) {
        setMessage({ type: 'error', text: 'No active session found. Please log in again.' });
        return;
      }

      const response = await fetch('/api/admin/tournament-progression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          tournamentId,
          action: 'regenerateProgression'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message || 'Tournament progression regenerated successfully!' });
        
        setTimeout(() => {
          fetchProgression();
        }, 500);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to regenerate progression' });
      }
    } catch (error: any) {
      console.error('Error regenerating progression:', error);
      setMessage({ type: 'error', text: 'Failed to regenerate progression' });
    } finally {
      setLoading(false);
    }
  };

  const clearSchedule = async () => {
    setLoading(true);
    try {
      const sessionId = localStorage.getItem("adminSessionId");
      if (!sessionId) {
        setMessage({ type: 'error', text: 'No active session found. Please log in again.' });
        return;
      }

      const response = await fetch('/api/admin/tournament-progression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          tournamentId,
          action: 'clearSchedule'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message || 'Tournament schedule cleared successfully!' });
        
        setTimeout(() => {
          fetchProgression();
        }, 500);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to clear schedule' });
      }
    } catch (error: any) {
      console.error('Error clearing schedule:', error);
      setMessage({ type: 'error', text: 'Failed to clear schedule' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgression();
  }, [tournamentId]);

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50 text-green-800';
      case 'error': return 'border-red-200 bg-red-50 text-red-800';
      case 'info': return 'border-blue-200 bg-blue-50 text-blue-800';
      default: return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Tournament Progression Management</h2>
          <Button onClick={onClose} variant="outline">✕</Button>
        </div>

        {message && (
          <Alert className={`mb-4 ${getMessageColor(message.type)}`}>
            {getMessageIcon(message.type)}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Progression Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Round:</label>
                  <Select value={selectedRound} onValueChange={handleRoundChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a round..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRounds().map((round) => (
                        <SelectItem key={round} value={round}>
                          {round}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={populateRound32Matches} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Populate Round of 32
                  </Button>
                  
                  <Button 
                    onClick={populateRound16Matches} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Populate Round of 16
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={fixProgression} 
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Fix Progression
                  </Button>
                  
                  <Button 
                    onClick={validateIntegrity} 
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Validate Data
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={regenerateProgression} 
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Regenerate
                  </Button>
                  
                  <Button 
                    onClick={clearSchedule} 
                    disabled={loading}
                    variant="destructive"
                    className="w-full"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Clear Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progression Status */}
            {progression && (
              <Card>
                <CardHeader>
                  <CardTitle>Progression Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current Round:</span>
                    <Badge variant="secondary">{progression.currentRound || 'Not Started'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant={progression.status === 'active' ? 'default' : 'secondary'}>
                      {progression.status || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Rounds:</span>
                    <Badge variant="outline">{progression.rounds?.length || 0}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Matches Table */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  Matches for {selectedRound || 'Select a Round'}
                  {matches.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {matches.length} matches
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRound ? (
                  matches.length > 0 ? (
                    <div className="space-y-3">
                      {matches.map((match) => (
                        <div key={match.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-600">
                              Match {match.id}
                            </span>
                            <Badge variant={match.isCompleted ? 'default' : 'secondary'}>
                              {match.isCompleted ? 'Completed' : 'Pending'}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">Players:</span> {match.players.join(' vs ')}
                            </div>
                            {match.winner && (
                              <div className="text-sm">
                                <span className="font-medium">Winner:</span> {match.winner}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No matches found for this round
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Please select a round to view matches
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Debug Info */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Tournament ID: {tournamentId}</div>
                  <div>Selected Round: {selectedRound || 'None'}</div>
                  <div>Matches Count: {matches.length}</div>
                  <div>Progression Status: {progression?.status || 'Unknown'}</div>
                  <div>CSRF Token: {csrfToken.substring(0, 8)}...</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
