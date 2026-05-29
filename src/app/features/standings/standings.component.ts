import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { LeagueService } from '../../core/services/league.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { TeamStanding } from '../../core/models/team.model';
import type { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-standings',
  standalone: true,
  template: `
    <div class="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <h1 class="text-xl sm:text-2xl font-bold text-white mb-5">Tabela</h1>

      @if (loading() && standings().length === 0) {
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center text-slate-500 text-sm">
          Učitava se...
        </div>
      } @else if (standings().length === 0) {
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center text-slate-500 text-sm">
          Nema podataka. Liga još nije počela.
        </div>
      } @else {
        <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-xs sm:text-sm">
              <thead>
                <tr class="border-b border-slate-700 text-slate-500 text-[10px] sm:text-xs uppercase tracking-wider">
                  <th class="pl-3 pr-1 sm:px-4 py-3 text-left w-6 sm:w-10">#</th>
                  <th class="px-1 sm:px-4 py-3 text-left">Tim</th>
                  <th class="px-1 sm:px-4 py-3 text-center">OM</th>
                  <th class="px-1 sm:px-4 py-3 text-center">P</th>
                  <th class="px-1 sm:px-4 py-3 text-center">G</th>
                  <th class="px-1 sm:px-4 py-3 text-center">SR</th>
                  <th class="px-1 sm:px-4 py-3 text-center">GR</th>
                  <th class="px-1 pr-3 sm:px-4 py-3 text-center font-semibold text-slate-400">BOD</th>
                </tr>
              </thead>
              <tbody>
                @for (s of standings(); track s.team.id) {
                  <tr class="border-b border-slate-700/40 hover:bg-slate-700/25 transition-colors last:border-0"
                    [class.bg-emerald-500/5]="s.position <= 4">
                    <td class="pl-3 pr-1 sm:px-4 py-2.5 sm:py-3">
                      <span class="text-xs font-bold tabular-nums w-5 sm:w-6 inline-block text-center"
                        [class.text-emerald-400]="s.position <= 4"
                        [class.text-slate-500]="s.position > 4">
                        {{ s.position }}
                      </span>
                    </td>
                    <td class="px-1 sm:px-4 py-2.5 sm:py-3 font-medium text-white">{{ s.team.name }}</td>
                    <td class="px-1 sm:px-4 py-2.5 sm:py-3 text-center text-slate-400 tabular-nums">{{ s.played }}</td>
                    <td class="px-1 sm:px-4 py-2.5 sm:py-3 text-center text-emerald-400 font-medium tabular-nums">{{ s.wins }}</td>
                    <td class="px-1 sm:px-4 py-2.5 sm:py-3 text-center text-red-400 font-medium tabular-nums">{{ s.losses }}</td>
                    <td class="px-1 sm:px-4 py-2.5 sm:py-3 text-center font-medium tabular-nums"
                      [class.text-emerald-400]="s.setDiff > 0"
                      [class.text-red-400]="s.setDiff < 0"
                      [class.text-slate-400]="s.setDiff === 0"
                    >{{ s.setDiff > 0 ? '+' : '' }}{{ s.setDiff }}</td>
                    <td class="px-1 sm:px-4 py-2.5 sm:py-3 text-center font-medium tabular-nums"
                      [class.text-emerald-400]="s.gameDiff > 0"
                      [class.text-red-400]="s.gameDiff < 0"
                      [class.text-slate-400]="s.gameDiff === 0"
                    >{{ s.gameDiff > 0 ? '+' : '' }}{{ s.gameDiff }}</td>
                    <td class="px-1 pr-3 sm:px-4 py-2.5 sm:py-3 text-center font-bold text-white tabular-nums">{{ s.points }}</td>
                  </tr>
                  @if (s.position === 4 && standings().length > 4) {
                    <tr>
                      <td colspan="8" class="px-4 py-0">
                        <div class="flex items-center gap-2 py-1">
                          <div class="flex-1 border-t border-dashed border-emerald-500/30"></div>
                          <span class="text-emerald-500/50 text-xs tracking-wider">Final Four</span>
                          <div class="flex-1 border-t border-dashed border-emerald-500/30"></div>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
          <span>OM — Odigrani Mečevi</span>
          <span>P — Pobede</span>
          <span>G — Gubici</span>
          <span>SR — Set Razlika</span>
          <span>GR — Gem Razlika</span>
          <span>BOD — Bodovi</span>
        </div>
      }

      @if (error()) {
        <div class="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {{ error() }}
        </div>
      }

      <!-- Sponsors (hidden for now)
      <div class="mt-10">
        <div class="text-xs uppercase tracking-widest text-slate-600 text-center mb-4">Sponzori</div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <a href="https://rs-barbershop.com/" target="_blank" rel="noopener noreferrer"
            class="flex flex-col items-center gap-3 group">
            <img src="/images/sponsors/barber.jpeg" alt="Barber Shop"
              class="max-h-32 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-200" />
            <span class="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">Barber Shop</span>
          </a>
          <a href="https://evrodom.rs/" target="_blank" rel="noopener noreferrer"
            class="flex flex-col items-center gap-3 group">
            <img src="/images/sponsors/evrodom.jpeg" alt="Evrodom"
              class="max-h-32 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-200" />
            <span class="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">Evrodom</span>
          </a>
        </div>
      </div>
      -->
    </div>
  `,
})
export class StandingsComponent implements OnInit, OnDestroy {
  standings = signal<TeamStanding[]>([]);
  loading = signal(false);
  error = signal('');

  private channel: RealtimeChannel | null = null;

  constructor(private league: LeagueService, private supabase: SupabaseService) {}

  ngOnInit() {
    this.load();
    this.channel = this.supabase.client
      .channel('standings-matches')
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
      const [teams, matches] = await Promise.all([
        this.league.getTeams(),
        this.league.getMatches(),
      ]);
      this.standings.set(this.league.calculateStandings(teams, matches));
    } catch {
      this.error.set('Greška pri učitavanju podataka. Pokušaj ponovo.');
    } finally {
      this.loading.set(false);
    }
  }

}
