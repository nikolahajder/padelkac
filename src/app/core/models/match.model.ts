import { Team } from './team.model';
import { Round } from './round.model';

export interface Match {
  id: string;
  round_id: string;
  home_team_id: string;
  away_team_id: string;
  home_sets: number | null;
  away_sets: number | null;
  home_games: number | null;
  away_games: number | null;
  set_scores?: string | null;
  created_at?: string;
  home_team?: Team;
  away_team?: Team;
  round?: Round;
}
