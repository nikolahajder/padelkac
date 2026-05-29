import { Component, OnInit, signal } from '@angular/core';
import { LeagueService } from '../../core/services/league.service';
import { TeamStanding } from '../../core/models/team.model';

@Component({
  selector: 'app-standings',
  standalone: true,
  template: `
    <div class="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <div class="flex items-center justify-between mb-5">
        <h1 class="text-xl sm:text-2xl font-bold text-white">Liga Tabela</h1>
        <button
          (click)="load()"
          class="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800"
          title="Osveži"
        >
          <svg class="w-4 h-4" [class.animate-spin]="loading()" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

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
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-700 text-slate-500 text-xs uppercase tracking-wider">
                  <th class="px-3 sm:px-4 py-3 text-left w-10">#</th>
                  <th class="px-3 sm:px-4 py-3 text-left">Tim</th>
                  <th class="px-2 sm:px-4 py-3 text-center">OM</th>
                  <th class="px-2 sm:px-4 py-3 text-center">P</th>
                  <th class="px-2 sm:px-4 py-3 text-center">G</th>
                  <th class="px-2 sm:px-4 py-3 text-center">SR</th>
                  <th class="px-2 sm:px-4 py-3 text-center font-semibold text-slate-400">BOD</th>
                </tr>
              </thead>
              <tbody>
                @for (s of standings(); track s.team.id) {
                  <tr class="border-b border-slate-700/40 hover:bg-slate-700/25 transition-colors last:border-0"
                    [class.bg-emerald-500/5]="s.position <= 4">
                    <td class="px-3 sm:px-4 py-3">
                      <span class="text-xs font-bold tabular-nums w-6 inline-block text-center"
                        [class.text-emerald-400]="s.position <= 4"
                        [class.text-slate-500]="s.position > 4">
                        {{ s.position }}
                      </span>
                    </td>
                    <td class="px-3 sm:px-4 py-3 font-medium text-white whitespace-nowrap">{{ s.team.name }}</td>
                    <td class="px-2 sm:px-4 py-3 text-center text-slate-400">{{ s.played }}</td>
                    <td class="px-2 sm:px-4 py-3 text-center text-emerald-400 font-medium">{{ s.wins }}</td>
                    <td class="px-2 sm:px-4 py-3 text-center text-red-400 font-medium">{{ s.losses }}</td>
                    <td class="px-2 sm:px-4 py-3 text-center font-medium"
                      [class.text-emerald-400]="s.setDiff > 0"
                      [class.text-red-400]="s.setDiff < 0"
                      [class.text-slate-400]="s.setDiff === 0"
                    >{{ s.setDiff > 0 ? '+' : '' }}{{ s.setDiff }}</td>
                    <td class="px-2 sm:px-4 py-3 text-center font-bold text-white text-base">{{ s.points }}</td>
                  </tr>
                  @if (s.position === 4 && standings().length > 4) {
                    <tr>
                      <td colspan="7" class="px-4 py-0">
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
          <span>BOD — Bodovi</span>
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
export class StandingsComponent implements OnInit {
  standings = signal<TeamStanding[]>([]);
  loading = signal(false);
  error = signal('');

  constructor(private league: LeagueService) {}

  ngOnInit() {
    this.load();
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
