export interface Team {
  id: string;
  name: string;
  created_at?: string;
}

export interface TeamStanding {
  team: Team;
  position: number;
  played: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  setDiff: number;
  gamesWon: number;
  gamesLost: number;
  gameDiff: number;
  points: number;
}
