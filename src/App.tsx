import React, { useState, useEffect } from 'react';
import { Timer, UserPlus, X, Trophy, Clock } from 'lucide-react';
import type { Player, GameState } from './types';

function App() {
  const [gameState, setGameState] = useState<GameState>({
    activePlayers: [null, null],
    queue: [],
    averageGameDuration: 15 // default 15 minutes per game
  });
  const [newPlayerName, setNewPlayerName] = useState('');

  const addPlayer = (name: string) => {
    if (gameState.queue.length >= 10) {
      alert('Queue is full! Maximum 10 players allowed.');
      return;
    }

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: name.trim(),
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
  };

  const removePlayer = (playerId: string) => {
    setGameState(prev => ({
      ...prev,
      queue: prev.queue.filter(p => p.id !== playerId),
      activePlayers: prev.activePlayers.map(p => 
        p?.id === playerId ? null : p
      ) as [Player | null, Player | null]
    }));
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
              if (newPlayerName.trim()) addPlayer(newPlayerName);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Enter player name"
              className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 focus:outline-none focus:border-blue-500"
              maxLength={20}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <UserPlus size={20} />
              Add Player
            </button>
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
      </div>
    </div>
  );
}

export default App;