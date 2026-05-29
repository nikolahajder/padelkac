import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Team, TeamStanding } from '../models/team.model';
import { Round } from '../models/round.model';
import { Match } from '../models/match.model';

@Injectable({ providedIn: 'root' })
export class LeagueService {
  constructor(private supabase: SupabaseService) {}

  async getTeams(): Promise<Team[]> {
    const { data, error } = await this.supabase.client
      .from('teams')
      .select('*')
      .order('name');
    if (error) throw error;
    return data ?? [];
  }

  async getRounds(): Promise<Round[]> {
    const { data, error } = await this.supabase.client
      .from('rounds')
      .select('*')
      .order('round_number');
    if (error) throw error;
    return data ?? [];
  }

  async getMatches(): Promise<Match[]> {
    const { data, error } = await this.supabase.client
      .from('matches')
      .select(`
        *,
        home_team:home_team_id(id, name),
        away_team:away_team_id(id, name),
        round:round_id(id, round_number)
      `)
      .order('created_at');
    if (error) throw error;
    return (data ?? []) as Match[];
  }

  async createTeam(name: string): Promise<Team> {
    const { data, error } = await this.supabase.client
      .from('teams')
      .insert({ name: name.trim() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async createRound(roundNumber: number): Promise<Round> {
    const { data, error } = await this.supabase.client
      .from('rounds')
      .insert({ round_number: roundNumber })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async createMatch(roundId: string, homeTeamId: string, awayTeamId: string): Promise<Match> {
    const { data, error } = await this.supabase.client
      .from('matches')
      .insert({ round_id: roundId, home_team_id: homeTeamId, away_team_id: awayTeamId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateMatchResult(matchId: string, homeSets: number, awaySets: number): Promise<void> {
    const { error } = await this.supabase.client
      .from('matches')
      .update({ home_sets: homeSets, away_sets: awaySets })
      .eq('id', matchId);
    if (error) throw error;
  }

  async deleteMatch(matchId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('matches')
      .delete()
      .eq('id', matchId);
    if (error) throw error;
  }

  async deleteRound(roundId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('rounds')
      .delete()
      .eq('id', roundId);
    if (error) throw error;
  }

  calculateStandings(teams: Team[], matches: Match[]): TeamStanding[] {
    const map = new Map<string, TeamStanding>();

    teams.forEach(team => {
      map.set(team.id, {
        team,
        position: 0,
        played: 0,
        wins: 0,
        losses: 0,
        setsWon: 0,
        setsLost: 0,
        setDiff: 0,
        points: 0,
      });
    });

    matches
      .filter(m => m.home_sets !== null && m.away_sets !== null)
      .forEach(match => {
        const home = map.get(match.home_team_id);
        const away = map.get(match.away_team_id);
        if (!home || !away) return;

        home.played++;
        away.played++;
        home.setsWon += match.home_sets!;
        home.setsLost += match.away_sets!;
        away.setsWon += match.away_sets!;
        away.setsLost += match.home_sets!;

        if (match.home_sets! > match.away_sets!) {
          home.wins++;
          home.points += 3;
          away.losses++;
        } else if (match.away_sets! > match.home_sets!) {
          away.wins++;
          away.points += 3;
          home.losses++;
        }
      });

    map.forEach(s => (s.setDiff = s.setsWon - s.setsLost));

    const sorted = Array.from(map.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.setDiff !== a.setDiff) return b.setDiff - a.setDiff;
      return a.team.name.localeCompare(b.team.name);
    });

    sorted.forEach((s, i) => (s.position = i + 1));
    return sorted;
  }
}
