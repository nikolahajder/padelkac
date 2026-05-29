import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LeagueService } from '../../core/services/league.service';
import { Team } from '../../core/models/team.model';
import { Round } from '../../core/models/round.model';
import { Match } from '../../core/models/match.model';

interface MatchEditState {
  home: number | string;
  away: number | string;
  homeGames: number | string;
  awayGames: number | string;
}

interface DialogConfig {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100">
      <!-- Header -->
      <div class="bg-slate-900 border-b border-slate-700/60 px-4 py-3 sticky top-0 z-10">
        <div class="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <span class="font-bold text-white text-sm sm:text-base">Admin Panel</span>
            <span class="text-slate-600 mx-2">·</span>
            <span class="text-slate-400 text-sm">Padel Liga Kac</span>
          </div>
          <button
            (click)="logout()"
            class="text-slate-400 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
          >Odjavi se</button>
        </div>
      </div>

      <div class="max-w-5xl mx-auto px-4 py-6">
        <!-- Tabs -->
        <div class="flex gap-2 mb-6">
          <button
            (click)="activeTab.set('rounds')"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            [class.bg-emerald-600]="activeTab() === 'rounds'"
            [class.text-white]="activeTab() === 'rounds'"
            [class.bg-slate-800]="activeTab() !== 'rounds'"
            [class.text-slate-400]="activeTab() !== 'rounds'"
          >Kola i Mečevi</button>
          <button
            (click)="activeTab.set('teams')"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            [class.bg-emerald-600]="activeTab() === 'teams'"
            [class.text-white]="activeTab() === 'teams'"
            [class.bg-slate-800]="activeTab() !== 'teams'"
            [class.text-slate-400]="activeTab() !== 'teams'"
          >Timovi</button>
        </div>

        <!-- Global error -->
        @if (globalError()) {
          <div class="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
            {{ globalError() }}
          </div>
        }

        <!-- ===== ROUNDS TAB ===== -->
        @if (activeTab() === 'rounds') {
          <div>
            @if (roundsDesc().length === 0) {
              <!-- No league yet -->
              <div class="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
                <div class="text-slate-500 text-sm mb-1">Liga nije generisana</div>
                <div class="text-slate-400 text-sm mb-5">
                  @if (teams().length < 2) {
                    Najpre dodaj timove u tabu "Timovi".
                  } @else if (teams().length % 2 !== 0) {
                    Potreban je paran broj timova. Trenutno: {{ teams().length }}.
                  } @else {
                    {{ teams().length }} timova · {{ teams().length - 1 }} kola · {{ totalMatchCount() }} mečeva (svako sa svakim)
                  }
                </div>
                <button
                  (click)="generateLeague()"
                  [disabled]="generatingLeague() || teams().length < 2 || teams().length % 2 !== 0"
                  class="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  {{ generatingLeague() ? 'Generišem...' : 'Generiši Ligu' }}
                </button>
              </div>
            } @else {
              <!-- League exists -->
              <div class="flex items-center justify-between mb-4">
                <span class="text-slate-500 text-sm">
                  {{ roundsDesc().length }} kola · {{ matches().length }} mečeva
                </span>
                <button
                  (click)="resetLeague()"
                  [disabled]="generatingLeague()"
                  class="text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {{ generatingLeague() ? 'Resetujem...' : 'Resetuj Ligu' }}
                </button>
              </div>

              <div class="space-y-3">
                @for (round of roundsDesc(); track round.id) {
                  <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <!-- Round header -->
                    <div class="flex items-center">
                      <button
                        (click)="toggleRound(round.id)"
                        class="flex-1 flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors text-left"
                      >
                        <span class="font-semibold text-white">{{ round.round_number }}. Kolo</span>
                        <div class="flex items-center gap-3">
                          <span class="text-slate-500 text-xs">
                            {{ playedInRound(round.id) }}/{{ matchCountForRound(round.id) }} odigrano
                          </span>
                          <svg
                            class="w-4 h-4 text-slate-400 transition-transform duration-200"
                            [class.rotate-180]="isRoundOpen(round.id)"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      <button
                        (click)="deleteRound(round.id, round.round_number)"
                        class="px-3 py-3 text-slate-600 hover:text-red-400 transition-colors"
                        title="Obriši kolo"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    @if (isRoundOpen(round.id)) {
                      <div class="border-t border-slate-700">
                        @for (match of matchesForRound(round.id); track match.id) {
                          <div class="px-3 sm:px-4 py-2.5 flex flex-wrap sm:flex-nowrap items-center gap-x-2 gap-y-1.5 border-b border-slate-700/40 last:border-0">
                            <!-- Home team -->
                            <span class="text-right text-slate-200 text-sm truncate w-[90px] sm:w-[130px]">
                              {{ match.home_team?.name }}
                            </span>

                            <!-- Score inputs -->
                            <div class="flex items-center gap-1 shrink-0">
                              <span class="text-slate-600 text-xs">S</span>
                              <input
                                type="number" min="0" max="2"
                                [value]="editHome(match.id)"
                                (input)="onEditInput(match.id, 'home', $event)"
                                class="w-9 bg-slate-700 border border-slate-600 text-white text-center py-1 rounded text-sm
                                       focus:outline-none focus:border-emerald-500 transition-colors"
                              />
                              <span class="text-slate-500 select-none">:</span>
                              <input
                                type="number" min="0" max="2"
                                [value]="editAway(match.id)"
                                (input)="onEditInput(match.id, 'away', $event)"
                                class="w-9 bg-slate-700 border border-slate-600 text-white text-center py-1 rounded text-sm
                                       focus:outline-none focus:border-emerald-500 transition-colors"
                              />
                              <span class="text-slate-600 text-xs ml-1.5">G</span>
                              <input
                                type="number" min="0"
                                [value]="editHomeGames(match.id)"
                                (input)="onEditInput(match.id, 'homeGames', $event)"
                                class="w-10 bg-slate-700 border border-slate-600 text-white text-center py-1 rounded text-sm
                                       focus:outline-none focus:border-emerald-500 transition-colors"
                              />
                              <span class="text-slate-500 select-none">:</span>
                              <input
                                type="number" min="0"
                                [value]="editAwayGames(match.id)"
                                (input)="onEditInput(match.id, 'awayGames', $event)"
                                class="w-10 bg-slate-700 border border-slate-600 text-white text-center py-1 rounded text-sm
                                       focus:outline-none focus:border-emerald-500 transition-colors"
                              />
                            </div>

                            <!-- Away team -->
                            <span class="text-slate-200 text-sm truncate flex-1 min-w-0">
                              {{ match.away_team?.name }}
                            </span>

                            <!-- Actions -->
                            <div class="flex items-center gap-1 shrink-0">
                              <button
                                (click)="saveResult(match.id)"
                                [disabled]="isSaving(match.id) || !canSave(match.id)"
                                class="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-3 py-1.5 rounded text-xs transition-colors"
                              >{{ isSaving(match.id) ? '...' : 'Sačuvaj' }}</button>
                              @if (match.home_sets !== null) {
                                <button
                                  (click)="clearMatch(match.id)"
                                  class="text-slate-600 hover:text-amber-400 px-2 py-1.5 rounded text-xs transition-colors"
                                  title="Poništi rezultat"
                                >
                                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                </button>
                              }
                              <button
                                (click)="deleteMatch(match.id)"
                                class="text-slate-600 hover:text-red-400 px-2 py-1.5 rounded text-xs transition-colors"
                                title="Obriši meč"
                              >✕</button>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- ===== TEAMS TAB ===== -->
        @if (activeTab() === 'teams') {
          <div>
            <div class="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
              <h2 class="font-semibold text-white mb-3 text-sm">Dodaj Tim</h2>
              <div class="flex gap-2">
                <input
                  type="text"
                  [(ngModel)]="newTeamName"
                  placeholder="Naziv tima"
                  (keyup.enter)="addTeam()"
                  class="flex-1 bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg text-sm
                         focus:outline-none focus:border-emerald-500 placeholder-slate-500 transition-colors"
                />
                <button
                  (click)="addTeam()"
                  [disabled]="!newTeamName.trim() || addingTeam()"
                  class="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
                >{{ addingTeam() ? '...' : 'Dodaj' }}</button>
              </div>
            </div>

            <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div class="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                <span class="font-semibold text-white text-sm">Timovi</span>
                <span class="text-slate-500 text-xs">{{ teams().length }} timova</span>
              </div>
              @if (teams().length === 0) {
                <div class="p-8 text-center text-slate-500 text-sm">Nema timova. Dodaj tim gore.</div>
              } @else {
                <div class="divide-y divide-slate-700/40">
                  @for (team of teams(); track team.id; let i = $index) {
                    <div class="px-4 py-2.5 flex items-center gap-2">
                      <span class="text-slate-600 text-xs w-5 text-right shrink-0">{{ i + 1 }}</span>

                      @if (editingTeamId() === team.id) {
                        <input
                          type="text"
                          [(ngModel)]="editingTeamName"
                          (keyup.enter)="saveEditTeam(team.id)"
                          (keyup.escape)="cancelEditTeam()"
                          class="flex-1 bg-slate-700 border border-emerald-500 text-white px-2 py-1 rounded text-sm
                                 focus:outline-none transition-colors"
                          #editInput
                        />
                        <button
                          (click)="saveEditTeam(team.id)"
                          [disabled]="!editingTeamName.trim() || savingTeam()"
                          class="text-emerald-400 hover:text-emerald-300 disabled:opacity-40 px-1.5 py-1 transition-colors"
                          title="Sačuvaj"
                        >
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          (click)="cancelEditTeam()"
                          class="text-slate-500 hover:text-slate-300 px-1.5 py-1 transition-colors"
                          title="Otkaži"
                        >
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      } @else {
                        <span class="flex-1 text-slate-200 text-sm">{{ team.name }}</span>
                        <button
                          (click)="startEditTeam(team)"
                          class="text-slate-600 hover:text-slate-300 px-1.5 py-1 transition-colors"
                          title="Izmeni naziv"
                        >
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          (click)="deleteTeam(team.id)"
                          class="text-slate-600 hover:text-red-400 px-1.5 py-1 transition-colors"
                          title="Obriši tim"
                        >
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Confirm dialog -->
    @if (dialog()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="dialog.set(null)"></div>
        <div class="relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-5">
          <h3 class="font-semibold text-white text-base mb-1">{{ dialog()!.title }}</h3>
          <p class="text-slate-400 text-sm mb-5 leading-relaxed">{{ dialog()!.message }}</p>
          <div class="flex justify-end gap-2">
            <button
              (click)="dialog.set(null)"
              class="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >Otkaži</button>
            <button
              (click)="confirmDialog()"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
            >{{ dialog()!.confirmLabel }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminDashboardComponent implements OnInit {
  teams = signal<Team[]>([]);
  rounds = signal<Round[]>([]);
  matches = signal<Match[]>([]);

  activeTab = signal<'rounds' | 'teams'>('rounds');
  newTeamName = '';
  addingTeam = signal(false);
  generatingLeague = signal(false);
  globalError = signal('');

  dialog = signal<DialogConfig | null>(null);

  private openRoundIds = signal<string[]>([]);
  private editState = signal<Record<string, MatchEditState>>({});
  private savingMatchIds = signal<string[]>([]);

  roundsDesc = computed(() =>
    [...this.rounds()].sort((a, b) => b.round_number - a.round_number)
  );

  constructor(
    private league: LeagueService,
    private auth: AuthService,
    private router: Router,
  ) {}

  async ngOnInit() {
    await this.loadAll();
  }

  private async loadAll() {
    try {
      const [teams, rounds, matches] = await Promise.all([
        this.league.getTeams(),
        this.league.getRounds(),
        this.league.getMatches(),
      ]);
      this.teams.set(teams);
      this.rounds.set(rounds);
      this.matches.set(matches);

      const state: Record<string, MatchEditState> = {};
      matches.forEach(m => {
        state[m.id] = {
          home: m.home_sets !== null ? m.home_sets : '',
          away: m.away_sets !== null ? m.away_sets : '',
          homeGames: m.home_games != null ? m.home_games : '',
          awayGames: m.away_games != null ? m.away_games : '',
        };
      });
      this.editState.set(state);

      // Auto-open round 1
      if (rounds.length > 0) {
        this.openRoundIds.set([rounds[0].id]);
      }
    } catch {
      this.globalError.set('Greška pri učitavanju. Osveži stranicu.');
    }
  }

  private async reloadMatchesAndTeams() {
    const [teams, matches] = await Promise.all([
      this.league.getTeams(),
      this.league.getMatches(),
    ]);
    this.teams.set(teams);
    this.matches.set(matches);
    const state = { ...this.editState() };
    matches.forEach(m => {
      if (!state[m.id]) {
        state[m.id] = {
          home: m.home_sets !== null ? m.home_sets : '',
          away: m.away_sets !== null ? m.away_sets : '',
          homeGames: m.home_games != null ? m.home_games : '',
          awayGames: m.away_games != null ? m.away_games : '',
        };
      }
    });
    this.editState.set(state);
  }

  confirmDialog() {
    const d = this.dialog();
    this.dialog.set(null);
    d?.onConfirm();
  }

  private ask(config: DialogConfig) {
    this.dialog.set(config);
  }

  // ---- League generation ----
  totalMatchCount(): number {
    const n = this.teams().length;
    return (n * (n - 1)) / 2;
  }

  async generateLeague() {
    this.generatingLeague.set(true);
    this.globalError.set('');
    try {
      await this.league.generateLeague();
      await this.loadAll();
    } catch (e: any) {
      this.globalError.set(e?.message ?? 'Greška pri generisanju lige.');
    } finally {
      this.generatingLeague.set(false);
    }
  }

  resetLeague() {
    const n = this.teams().length;
    this.ask({
      title: 'Resetuj Ligu',
      message: `Ovo će obrisati sva kola i mečeve i generisati novu ligu za ${n} timova. Svi uneseni rezultati će biti izgubljeni.`,
      confirmLabel: 'Resetuj',
      onConfirm: () => this.generateLeague(),
    });
  }

  // ---- Round helpers ----
  matchesForRound(roundId: string): Match[] {
    return this.matches().filter(m => m.round_id === roundId);
  }

  matchCountForRound(roundId: string): number {
    return this.matchesForRound(roundId).length;
  }

  playedInRound(roundId: string): number {
    return this.matchesForRound(roundId).filter(m => m.home_sets !== null).length;
  }

  isRoundOpen(id: string): boolean {
    return this.openRoundIds().includes(id);
  }

  toggleRound(id: string) {
    const ids = this.openRoundIds();
    this.openRoundIds.set(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  }

  deleteRound(roundId: string, num: number) {
    this.ask({
      title: `Obriši ${num}. Kolo`,
      message: `Ovo će obrisati ${num}. kolo i sve njegove mečeve.`,
      confirmLabel: 'Obriši',
      onConfirm: () => this.doDeleteRound(roundId),
    });
  }

  private async doDeleteRound(roundId: string) {
    try {
      await this.league.deleteRound(roundId);
      const [rounds, matches] = await Promise.all([this.league.getRounds(), this.league.getMatches()]);
      this.rounds.set(rounds);
      this.matches.set(matches);
    } catch {
      this.globalError.set('Greška pri brisanju kola.');
    }
  }

  // ---- Match edit helpers ----
  editHome(matchId: string): number | string {
    return this.editState()[matchId]?.home ?? '';
  }

  editAway(matchId: string): number | string {
    return this.editState()[matchId]?.away ?? '';
  }

  editHomeGames(matchId: string): number | string {
    return this.editState()[matchId]?.homeGames ?? '';
  }

  editAwayGames(matchId: string): number | string {
    return this.editState()[matchId]?.awayGames ?? '';
  }

  onEditInput(matchId: string, side: 'home' | 'away' | 'homeGames' | 'awayGames', event: Event) {
    const val = (event.target as HTMLInputElement).value;
    let numVal: number | string;
    if (side === 'home' || side === 'away') {
      numVal = val === '' ? '' : Math.min(2, Math.max(0, parseInt(val, 10)));
    } else {
      numVal = val === '' ? '' : Math.max(0, parseInt(val, 10));
    }
    this.editState.update(s => ({ ...s, [matchId]: { ...s[matchId], [side]: numVal } }));
  }

  isSaving(matchId: string): boolean {
    return this.savingMatchIds().includes(matchId);
  }

  canSave(matchId: string): boolean {
    const s = this.editState()[matchId];
    return !!s && s.home !== '' && s.away !== '';
  }

  async saveResult(matchId: string) {
    const s = this.editState()[matchId];
    if (!s || s.home === '' || s.away === '') return;
    this.savingMatchIds.update(ids => [...ids, matchId]);
    this.globalError.set('');
    try {
      const homeGames = s.homeGames !== '' ? Number(s.homeGames) : null;
      const awayGames = s.awayGames !== '' ? Number(s.awayGames) : null;
      await this.league.updateMatchResult(matchId, Number(s.home), Number(s.away), homeGames, awayGames);
      await this.reloadMatchesAndTeams();
    } catch {
      this.globalError.set('Greška pri čuvanju rezultata.');
    } finally {
      this.savingMatchIds.update(ids => ids.filter(id => id !== matchId));
    }
  }

  clearMatch(matchId: string) {
    this.ask({
      title: 'Poništi Rezultat',
      message: 'Rezultat ovog meča će biti obrisan. Meč će biti označen kao neodigran.',
      confirmLabel: 'Poništi',
      onConfirm: () => this.doClearMatch(matchId),
    });
  }

  private async doClearMatch(matchId: string) {
    this.globalError.set('');
    try {
      await this.league.clearMatchResult(matchId);
      await this.reloadMatchesAndTeams();
      this.editState.update(s => ({
        ...s,
        [matchId]: { home: '', away: '', homeGames: '', awayGames: '' },
      }));
    } catch {
      this.globalError.set('Greška pri poništavanju rezultata.');
    }
  }

  deleteMatch(matchId: string) {
    this.ask({
      title: 'Obriši Meč',
      message: 'Ovaj meč će biti trajno obrisan.',
      confirmLabel: 'Obriši',
      onConfirm: () => this.doDeleteMatch(matchId),
    });
  }

  private async doDeleteMatch(matchId: string) {
    try {
      await this.league.deleteMatch(matchId);
      await this.reloadMatchesAndTeams();
    } catch {
      this.globalError.set('Greška pri brisanju meča.');
    }
  }

  // ---- Teams tab ----
  editingTeamId = signal<string | null>(null);
  editingTeamName = '';
  savingTeam = signal(false);

  startEditTeam(team: Team) {
    this.editingTeamId.set(team.id);
    this.editingTeamName = team.name;
  }

  cancelEditTeam() {
    this.editingTeamId.set(null);
    this.editingTeamName = '';
  }

  async saveEditTeam(teamId: string) {
    if (!this.editingTeamName.trim()) return;
    this.savingTeam.set(true);
    this.globalError.set('');
    try {
      await this.league.updateTeam(teamId, this.editingTeamName);
      const teams = await this.league.getTeams();
      this.teams.set(teams);
      this.editingTeamId.set(null);
      this.editingTeamName = '';
    } catch {
      this.globalError.set('Greška pri izmeni tima.');
    } finally {
      this.savingTeam.set(false);
    }
  }

  async addTeam() {
    if (!this.newTeamName.trim()) return;
    this.addingTeam.set(true);
    this.globalError.set('');
    try {
      await this.league.createTeam(this.newTeamName);
      this.newTeamName = '';
      const teams = await this.league.getTeams();
      this.teams.set(teams);
    } catch {
      this.globalError.set('Greška pri dodavanju tima.');
    } finally {
      this.addingTeam.set(false);
    }
  }

  deleteTeam(teamId: string) {
    this.ask({
      title: 'Obriši Tim',
      message: 'Ovaj tim će biti trajno obrisan. Tim se ne može obrisati ako ima mečeve u ligi.',
      confirmLabel: 'Obriši',
      onConfirm: () => this.doDeleteTeam(teamId),
    });
  }

  private async doDeleteTeam(teamId: string) {
    try {
      await this.league.deleteTeam(teamId);
      const teams = await this.league.getTeams();
      this.teams.set(teams);
    } catch {
      this.globalError.set('Greška pri brisanju tima. Tim možda ima mečeve u ligi.');
    }
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/admin/login']);
  }
}
