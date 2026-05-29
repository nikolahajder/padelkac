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

  async updateMatchResult(
    matchId: string,
    homeSets: number,
    awaySets: number,
    homeGames: number | null,
    awayGames: number | null,
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from('matches')
      .update({ home_sets: homeSets, away_sets: awaySets, home_games: homeGames, away_games: awayGames })
      .eq('id', matchId);
    if (error) throw error;
  }

  async clearMatchResult(matchId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('matches')
      .update({ home_sets: null, away_sets: null, home_games: null, away_games: null })
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

  async updateTeam(teamId: string, name: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('teams')
      .update({ name: name.trim() })
      .eq('id', teamId);
    if (error) throw error;
  }

  async deleteTeam(teamId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('teams')
      .delete()
      .eq('id', teamId);
    if (error) throw error;
  }

  async deleteRound(roundId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('rounds')
      .delete()
      .eq('id', roundId);
    if (error) throw error;
  }

  async clearLeague(): Promise<void> {
    const { error } = await this.supabase.client
      .from('rounds')
      .delete()
      .gte('round_number', 1);
    if (error) throw error;
  }

  async generateLeague(): Promise<void> {
    const teams = await this.getTeams();
    if (teams.length < 2) throw new Error('Potrebno je najmanje 2 tima za generisanje lige.');
    if (teams.length % 2 !== 0) throw new Error(`Liga zahteva paran broj timova. Trenutno imate ${teams.length} timova.`);

    const shuffled = this.shuffleArray([...teams]);
    const schedule = this.roundRobinSchedule(shuffled);

    await this.clearLeague();

    const roundInserts = schedule.map((_, i) => ({ round_number: i + 1 }));
    const { data: rounds, error: rErr } = await this.supabase.client
      .from('rounds')
      .insert(roundInserts)
      .select();
    if (rErr) throw rErr;

    const sortedRounds = ((rounds ?? []) as Round[]).sort((a, b) => a.round_number - b.round_number);
    if (sortedRounds.length !== schedule.length) throw new Error('Greška pri kreiranju kola.');

    const matchInserts = schedule.flatMap((roundMatches, i) =>
      roundMatches.map(([homeId, awayId]) => ({
        round_id: sortedRounds[i].id,
        home_team_id: homeId,
        away_team_id: awayId,
      }))
    );

    const { error: mErr } = await this.supabase.client
      .from('matches')
      .insert(matchInserts);
    if (mErr) throw mErr;
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private roundRobinSchedule(teams: Team[]): [string, string][][] {
    const list = teams.map(t => t.id);
    const n = list.length;
    const rounds: [string, string][][] = [];

    for (let round = 0; round < n - 1; round++) {
      const matches: [string, string][] = [];
      for (let i = 0; i < n / 2; i++) {
        matches.push([list[i], list[n - 1 - i]]);
      }
      rounds.push(matches);

      // Rotate: keep list[0] fixed, move last element to position 1
      const last = list[n - 1];
      for (let j = n - 1; j > 1; j--) list[j] = list[j - 1];
      list[1] = last;
    }

    return rounds;
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
        gamesWon: 0,
        gamesLost: 0,
        gameDiff: 0,
        points: 0,
      });
    });

    const played = matches.filter(m => m.home_sets !== null && m.away_sets !== null);

    played.forEach(match => {
      const home = map.get(match.home_team_id);
      const away = map.get(match.away_team_id);
      if (!home || !away) return;

      home.played++;
      away.played++;
      home.setsWon += match.home_sets!;
      home.setsLost += match.away_sets!;
      away.setsWon += match.away_sets!;
      away.setsLost += match.home_sets!;

      if (match.home_games != null && match.away_games != null) {
        home.gamesWon += match.home_games;
        home.gamesLost += match.away_games;
        away.gamesWon += match.away_games;
        away.gamesLost += match.home_games;
      }

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

    map.forEach(s => {
      s.setDiff = s.setsWon - s.setsLost;
      s.gameDiff = s.gamesWon - s.gamesLost;
    });

    const sorted = Array.from(map.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const h2h = this.headToHead(a.team.id, b.team.id, played);
      if (h2h !== 0) return h2h;
      if (b.setDiff !== a.setDiff) return b.setDiff - a.setDiff;
      if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
      if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon;
      return a.team.name.localeCompare(b.team.name);
    });

    sorted.forEach((s, i) => (s.position = i + 1));
    return sorted;
  }

  private headToHead(aId: string, bId: string, matches: Match[]): number {
    let aPoints = 0, bPoints = 0;
    matches
      .filter(m =>
        (m.home_team_id === aId && m.away_team_id === bId) ||
        (m.home_team_id === bId && m.away_team_id === aId)
      )
      .forEach(m => {
        const aIsHome = m.home_team_id === aId;
        if (aIsHome ? m.home_sets! > m.away_sets! : m.away_sets! > m.home_sets!) aPoints += 3;
        else if (aIsHome ? m.away_sets! > m.home_sets! : m.home_sets! > m.away_sets!) bPoints += 3;
      });
    return bPoints - aPoints;
  }
}
