import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { LeagueService } from '../../core/services/league.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { Round } from '../../core/models/round.model';
import { Match } from '../../core/models/match.model';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RoundWithMatches extends Round {
  matches: Match[];
}

@Component({
  selector: 'app-results',
  standalone: true,
  template: `
    <div class="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <h1 class="text-xl sm:text-2xl font-bold text-white mb-5">Raspored</h1>

      @if (loading() && roundsWithMatches().length === 0) {
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center text-slate-500 text-sm">
          Učitava se...
        </div>
      } @else if (roundsWithMatches().length === 0) {
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center text-slate-500 text-sm">
          Nema kola. Liga još nije počela.
        </div>
      } @else {
        <div class="space-y-4">
          @for (round of roundsWithMatches(); track round.id) {
            <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div class="px-4 py-3 bg-slate-700/40 border-b border-slate-700 flex items-center justify-between">
                <h2 class="font-semibold text-white">{{ round.round_number }}. Kolo</h2>
                <span class="text-xs text-slate-500">
                  {{ playedCount(round) }}/{{ round.matches.length }} odigrano
                </span>
              </div>
              <div class="divide-y divide-slate-700/40">
                @for (match of round.matches; track match.id) {
                  <div class="px-4 py-3 flex items-center gap-2 sm:gap-4">
                    <span class="flex-1 text-right text-sm sm:text-base"
                      [class.text-white]="isWinner(match, 'home')"
                      [class.font-semibold]="isWinner(match, 'home')"
                      [class.text-slate-400]="!isWinner(match, 'home') && match.home_sets !== null"
                      [class.text-slate-200]="match.home_sets === null"
                    >{{ match.home_team?.name ?? '—' }}</span>

                    <div class="min-w-[72px] text-center">
                      @if (match.home_sets !== null && match.away_sets !== null) {
                        <span class="font-bold text-white text-base sm:text-lg tabular-nums">
                          {{ match.home_sets }} : {{ match.away_sets }}
                        </span>
                        @if (match.set_scores) {
                          <div class="text-xs text-slate-500 leading-tight">
                            {{ match.set_scores }}
                          </div>
                        } @else if (match.home_games != null && match.away_games != null) {
                          <div class="text-xs text-slate-500 tabular-nums leading-tight">
                            ({{ match.home_games }}:{{ match.away_games }})
                          </div>
                        }
                      } @else {
                        <span class="text-slate-600 text-sm">vs</span>
                      }
                    </div>

                    <span class="flex-1 text-left text-sm sm:text-base"
                      [class.text-white]="isWinner(match, 'away')"
                      [class.font-semibold]="isWinner(match, 'away')"
                      [class.text-slate-400]="!isWinner(match, 'away') && match.away_sets !== null"
                      [class.text-slate-200]="match.away_sets === null"
                    >{{ match.away_team?.name ?? '—' }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      @if (error()) {
        <div class="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {{ error() }}
        </div>
      }
    </div>
  `,
})
export class ResultsComponent implements OnInit, OnDestroy {
  private rounds = signal<Round[]>([]);
  private matches = signal<Match[]>([]);
  loading = signal(false);
  error = signal('');

  roundsWithMatches = computed<RoundWithMatches[]>(() => {
    const rounds = this.rounds();
    const matches = this.matches();
    return rounds
      .map(r => ({ ...r, matches: matches.filter(m => m.round_id === r.id) }))
      .sort((a, b) => a.round_number - b.round_number);
  });

  private channel: RealtimeChannel | null = null;

  constructor(private league: LeagueService, private supabase: SupabaseService) {}

  ngOnInit() {
    this.load();
    this.channel = this.supabase.client
      .channel('results-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => this.load())
      .subscribe();
  }

  ngOnDestroy() {
    if (this.channel) this.supabase.client.removeChannel(this.channel);
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const [rounds, matches] = await Promise.all([
        this.league.getRounds(),
        this.league.getMatches(),
      ]);
      this.rounds.set(rounds);
      this.matches.set(matches);
    } catch {
      this.error.set('Greška pri učitavanju podataka. Pokušaj ponovo.');
    } finally {
      this.loading.set(false);
    }
  }

  playedCount(round: RoundWithMatches): number {
    return round.matches.filter(m => m.home_sets !== null).length;
  }

  isWinner(match: Match, side: 'home' | 'away'): boolean {
    if (match.home_sets === null || match.away_sets === null) return false;
    return side === 'home'
      ? match.home_sets > match.away_sets
      : match.away_sets > match.home_sets;
  }
}
