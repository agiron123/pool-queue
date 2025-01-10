export interface Player {
  id: string;
  name: string;
  joinedAt: Date;
}

export interface GameState {
  activePlayers: [Player | null, Player | null];
  queue: Player[];
  averageGameDuration: number; // in minutes
}