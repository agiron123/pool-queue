import React, { useState, useEffect } from 'react';
import { UserPlus, X, Trophy, Clock } from 'lucide-react';
import type { Player, GameState } from './types';

function App() {
  const [gameState, setGameState] = useState<GameState>({
    activePlayers: [null, null],
    queue: [],
    averageGameDuration: 15 // default 15 minutes per game
  });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPin, setNewPlayerPin] = useState('');
  const [registeredPlayers, setRegisteredPlayers] = useState<Map<string, string>>(new Map());
  const [removingPlayerId, setRemovingPlayerId] = useState<string | null>(null);
  const [verifyPin, setVerifyPin] = useState('');

  // Load registered players from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('registeredPlayers');
    if (stored) {
      const data = JSON.parse(stored);
      setRegisteredPlayers(new Map(Object.entries(data)));
    }
  }, []);

  // Save registered players to localStorage when it changes
  useEffect(() => {
    const data = Object.fromEntries(registeredPlayers);
    localStorage.setItem('registeredPlayers', JSON.stringify(data));
  }, [registeredPlayers]);

  const addPlayer = (name: string, pin: string) => {
    if (gameState.queue.length >= 10) {
      alert('Queue is full! Maximum 10 players allowed.');
      return;
    }

    // Check if username is already registered with a different PIN
    if (registeredPlayers.has(name)) {
      const storedPin = registeredPlayers.get(name);
      if (storedPin !== pin) {
        alert('This username is already registered with a different PIN. Please use your registered PIN or choose a different username.');
        return;
      }
    } else {
      // Register new player
      setRegisteredPlayers(prev => new Map(prev).set(name, pin));
    }

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: name,
      pin: pin,
      joinedAt: new Date()
    };

    setGameState(prev => {
      // If no active players, add to active players
      if (!prev.activePlayers[0]) {
        return {
          ...prev,
          activePlayers: [newPlayer, prev.activePlayers[1]]
        };
      }
      if (!prev.activePlayers[1]) {
        return {
          ...prev,
          activePlayers: [prev.activePlayers[0], newPlayer]
        };
      }
      // Otherwise add to queue
      return {
        ...prev,
        queue: [...prev.queue, newPlayer]
      };
    });
    setNewPlayerName('');
    setNewPlayerPin('');
  };

  const removePlayer = (playerId: string) => {
    setRemovingPlayerId(playerId);
  };

  const confirmRemovePlayer = () => {
    if (!removingPlayerId) return;

    // Find the player
    let playerToRemove: Player | null = null;
    
    // Check active players
    playerToRemove = gameState.activePlayers.find(p => p?.id === removingPlayerId) || null;
    
    // Check queue
    if (!playerToRemove) {
      playerToRemove = gameState.queue.find(p => p.id === removingPlayerId) || null;
    }

    if (!playerToRemove) {
      setRemovingPlayerId(null);
      setVerifyPin('');
      return;
    }

    // Verify PIN
    if (verifyPin !== playerToRemove.pin) {
      alert('Incorrect PIN. Cannot remove player.');
      setVerifyPin('');
      return;
    }

    // Remove player
    setGameState(prev => ({
      ...prev,
      queue: prev.queue.filter(p => p.id !== removingPlayerId),
      activePlayers: prev.activePlayers.map(p => 
        p?.id === removingPlayerId ? null : p
      ) as [Player | null, Player | null]
    }));

    setRemovingPlayerId(null);
    setVerifyPin('');
  };

  const cancelRemovePlayer = () => {
    setRemovingPlayerId(null);
    setVerifyPin('');
  };

  const handleWinner = (winnerId: string) => {
    setGameState(prev => {
      const winner = prev.activePlayers.find(p => p?.id === winnerId);
      const nextPlayer = prev.queue[0];
      const newQueue = prev.queue.slice(1);

      return {
        ...prev,
        activePlayers: [winner, nextPlayer || null] as [Player | null, Player | null],
        queue: newQueue
      };
    });
  };

  const getEstimatedWaitTime = (position: number) => {
    return Math.round(position * gameState.averageGameDuration);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Pool Table Queue</h1>
        
        {/* Current Players */}
        <div className="bg-slate-800 p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Current Players</h2>
          <div className="grid grid-cols-2 gap-4">
            {gameState.activePlayers.map((player, index) => (
              <div key={index} className="bg-slate-700 p-4 rounded-lg">
                {player ? (
                  <div className="flex justify-between items-center">
                    <span className="text-xl">{player.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleWinner(player.id)}
                        className="p-2 hover:bg-green-600 rounded-full transition-colors"
                        title="Declare Winner"
                      >
                        <Trophy size={24} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400">Waiting for player...</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add Player Form */}
        <div className="mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmedName = newPlayerName.trim();
              const trimmedPin = newPlayerPin.trim();
              
              if (!trimmedName) {
                alert('Please enter a player name.');
                return;
              }
              
              if (!trimmedPin) {
                alert('Please enter a PIN to protect your spot in the queue.');
                return;
              }
              
              if (trimmedPin.length < 4) {
                alert('PIN must be at least 4 characters long.');
                return;
              }
              
              addPlayer(trimmedName, trimmedPin);
            }}
            className="space-y-2"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name"
                className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 focus:outline-none focus:border-blue-500"
                maxLength={20}
              />
              <input
                type="password"
                value={newPlayerPin}
                onChange={(e) => setNewPlayerPin(e.target.value)}
                placeholder="Enter PIN (min 4 chars)"
                className="w-48 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 focus:outline-none focus:border-blue-500"
                minLength={4}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <UserPlus size={20} />
                Add Player
              </button>
            </div>
            <p className="text-sm text-slate-400">
              Set a PIN to protect your spot. Usernames must be unique, but multiple users can share the same PIN.
            </p>
          </form>
        </div>

        {/* Queue */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Waiting List</h2>
          {gameState.queue.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No players waiting</p>
          ) : (
            <div className="space-y-2">
              {gameState.queue.map((player, index) => (
                <div
                  key={player.id}
                  className="flex justify-between items-center bg-slate-700 p-4 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-slate-400">
                      {index + 1}.
                    </span>
                    <span className="text-xl">{player.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={20} />
                      <span>~{getEstimatedWaitTime(index + 1)} mins</span>
                    </div>
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="p-2 hover:bg-red-600 rounded-full transition-colors"
                      title="Remove Player"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PIN Verification Modal */}
        {removingPlayerId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">Enter PIN to Remove Player</h3>
              <p className="text-slate-400 mb-4">
                Please enter the PIN for this player to confirm removal.
              </p>
              <input
                type="password"
                value={verifyPin}
                onChange={(e) => setVerifyPin(e.target.value)}
                placeholder="Enter PIN"
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 focus:outline-none focus:border-blue-500 mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmRemovePlayer();
                  } else if (e.key === 'Escape') {
                    cancelRemovePlayer();
                  }
                }}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={cancelRemovePlayer}
                  className="px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemovePlayer}
                  className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;