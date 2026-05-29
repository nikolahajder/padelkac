import { Team } from './team.model';
import { Round } from './round.model';

export interface Match {
  id: string;
  round_id: string;
  home_team_id: string;
  away_team_id: string;
  home_sets: number | null;
  away_sets: number | null;
  created_at?: string;
  home_team?: Team;
  away_team?: Team;
  round?: Round;
}
