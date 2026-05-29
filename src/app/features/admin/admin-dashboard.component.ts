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
  saving: boolean;
}

interface AddMatchFormState {
  homeTeamId: string;
  awayTeamId: string;
  open: boolean;
  saving: boolean;
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
            <div class="flex justify-end mb-4">
              <button
                (click)="createRound()"
                [disabled]="creatingRound()"
                class="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {{ creatingRound() ? 'Kreiranje...' : '+ Novo Kolo' }}
              </button>
            </div>

            @if (roundsDesc().length === 0) {
              <div class="bg-slate-800 rounded-xl border border-slate-700 p-10 text-center text-slate-500 text-sm">
                Nema kola. Klikni "+ Novo Kolo" da počneš.
              </div>
            } @else {
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
                          <span class="text-slate-500 text-xs">{{ matchCountForRound(round.id) }} mečeva</span>
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
                        class="px-3 py-3 text-slate-600 hover:text-red-400 transition-colors text-sm"
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
                        <!-- Match rows -->
                        @for (match of matchesForRound(round.id); track match.id) {
                          <div class="px-3 sm:px-4 py-3 flex flex-wrap sm:flex-nowrap items-center gap-2 border-b border-slate-700/40">
                            <span class="flex-1 text-right text-slate-200 text-sm truncate min-w-0">
                              {{ match.home_team?.name }}
                            </span>
                            <div class="flex items-center gap-1.5 shrink-0">
                              <input
                                type="number"
                                min="0" max="2"
                                [value]="editHome(match.id)"
                                (input)="onEditInput(match.id, 'home', $event)"
                                class="w-10 bg-slate-700 border border-slate-600 text-white text-center py-1.5 rounded text-sm
                                       focus:outline-none focus:border-emerald-500 transition-colors"
                              />
                              <span class="text-slate-500 select-none">:</span>
                              <input
                                type="number"
                                min="0" max="2"
                                [value]="editAway(match.id)"
                                (input)="onEditInput(match.id, 'away', $event)"
                                class="w-10 bg-slate-700 border border-slate-600 text-white text-center py-1.5 rounded text-sm
                                       focus:outline-none focus:border-emerald-500 transition-colors"
                              />
                            </div>
                            <span class="flex-1 text-slate-200 text-sm truncate min-w-0">
                              {{ match.away_team?.name }}
                            </span>
                            <div class="flex items-center gap-1 shrink-0">
                              <button
                                (click)="saveResult(match.id)"
                                [disabled]="isSaving(match.id) || !canSave(match.id)"
                                class="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-3 py-1.5 rounded text-xs transition-colors"
                              >{{ isSaving(match.id) ? '...' : 'Sačuvaj' }}</button>
                              <button
                                (click)="deleteMatch(match.id)"
                                class="text-slate-600 hover:text-red-400 px-2 py-1.5 rounded text-xs transition-colors"
                              >✕</button>
                            </div>
                          </div>
                        }

                        <!-- Add match form -->
                        <div class="px-4 py-3 bg-slate-900/30">
                          @if (!isAddFormOpen(round.id)) {
                            <button
                              (click)="openAddForm(round.id)"
                              class="text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
                            >+ Dodaj Meč</button>
                          } @else {
                            <div class="flex flex-wrap gap-2 items-center">
                              <select
                                [ngModel]="addFormHome(round.id)"
                                (ngModelChange)="setAddFormValue(round.id, 'home', $event)"
                                class="bg-slate-700 border border-slate-600 text-white px-2 py-1.5 rounded text-sm
                                       focus:outline-none focus:border-emerald-500 min-w-0 flex-1 sm:flex-none"
                              >
                                <option value="">Dom tim</option>
                                @for (team of teams(); track team.id) {
                                  <option [value]="team.id">{{ team.name }}</option>
                                }
                              </select>
                              <span class="text-slate-500 text-sm hidden sm:block">vs</span>
                              <select
                                [ngModel]="addFormAway(round.id)"
                                (ngModelChange)="setAddFormValue(round.id, 'away', $event)"
                                class="bg-slate-700 border border-slate-600 text-white px-2 py-1.5 rounded text-sm
                                       focus:outline-none focus:border-emerald-500 min-w-0 flex-1 sm:flex-none"
                              >
                                <option value="">Gost tim</option>
                                @for (team of teams(); track team.id) {
                                  <option [value]="team.id">{{ team.name }}</option>
                                }
                              </select>
                              <button
                                (click)="addMatch(round.id)"
                                [disabled]="!canAddMatch(round.id) || isAddFormSaving(round.id)"
                                class="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-3 py-1.5 rounded text-sm transition-colors"
                              >{{ isAddFormSaving(round.id) ? '...' : 'Dodaj' }}</button>
                              <button
                                (click)="closeAddForm(round.id)"
                                class="text-slate-500 hover:text-slate-300 px-2 py-1.5 text-sm transition-colors"
                              >Otkaži</button>
                            </div>
                          }
                        </div>
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
                    <div class="px-4 py-3 flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <span class="text-slate-600 text-xs w-5 text-right">{{ i + 1 }}</span>
                        <span class="text-slate-200 text-sm">{{ team.name }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  teams = signal<Team[]>([]);
  rounds = signal<Round[]>([]);
  matches = signal<Match[]>([]);

  activeTab = signal<'rounds' | 'teams'>('rounds');
  newTeamName = '';
  addingTeam = signal(false);
  creatingRound = signal(false);
  globalError = signal('');

  private openRoundIds = signal<string[]>([]);
  private editState = signal<Record<string, { home: number | string; away: number | string }>>({});
  private savingMatchIds = signal<string[]>([]);
  private addForms = signal<Record<string, AddMatchFormState>>({});

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

      // Init edit state from existing results
      const state: Record<string, { home: number | string; away: number | string }> = {};
      matches.forEach(m => {
        state[m.id] = {
          home: m.home_sets !== null ? m.home_sets : '',
          away: m.away_sets !== null ? m.away_sets : '',
        };
      });
      this.editState.set(state);

      // Auto-open latest round
      if (rounds.length > 0) {
        const latest = rounds[rounds.length - 1];
        this.openRoundIds.set([latest.id]);
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
        };
      }
    });
    this.editState.set(state);
  }

  // ---- Round helpers ----
  matchesForRound(roundId: string): Match[] {
    return this.matches().filter(m => m.round_id === roundId);
  }

  matchCountForRound(roundId: string): number {
    return this.matchesForRound(roundId).length;
  }

  isRoundOpen(id: string): boolean {
    return this.openRoundIds().includes(id);
  }

  toggleRound(id: string) {
    const ids = this.openRoundIds();
    this.openRoundIds.set(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  }

  async createRound() {
    this.creatingRound.set(true);
    this.globalError.set('');
    try {
      const rounds = this.rounds();
      const next = rounds.length > 0 ? Math.max(...rounds.map(r => r.round_number)) + 1 : 1;
      const newRound = await this.league.createRound(next);
      const updated = await this.league.getRounds();
      this.rounds.set(updated);
      this.openRoundIds.update(ids => [...ids, newRound.id]);
    } catch {
      this.globalError.set('Greška pri kreiranju kola.');
    } finally {
      this.creatingRound.set(false);
    }
  }

  async deleteRound(roundId: string, num: number) {
    if (!confirm(`Obriši ${num}. kolo i sve njegove mečeve?`)) return;
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

  onEditInput(matchId: string, side: 'home' | 'away', event: Event) {
    const val = (event.target as HTMLInputElement).value;
    const numVal = val === '' ? '' : Math.min(2, Math.max(0, parseInt(val, 10)));
    this.editState.update(s => ({ ...s, [matchId]: { ...s[matchId], [side]: numVal } }));
  }

  isSaving(matchId: string): boolean {
    return this.savingMatchIds().includes(matchId);
  }

  canSave(matchId: string): boolean {
    const s = this.editState()[matchId];
    if (!s) return false;
    return s.home !== '' && s.away !== '';
  }

  async saveResult(matchId: string) {
    const s = this.editState()[matchId];
    if (!s || s.home === '' || s.away === '') return;
    this.savingMatchIds.update(ids => [...ids, matchId]);
    this.globalError.set('');
    try {
      await this.league.updateMatchResult(matchId, Number(s.home), Number(s.away));
      await this.reloadMatchesAndTeams();
    } catch {
      this.globalError.set('Greška pri čuvanju rezultata.');
    } finally {
      this.savingMatchIds.update(ids => ids.filter(id => id !== matchId));
    }
  }

  async deleteMatch(matchId: string) {
    if (!confirm('Obriši ovaj meč?')) return;
    try {
      await this.league.deleteMatch(matchId);
      await this.reloadMatchesAndTeams();
    } catch {
      this.globalError.set('Greška pri brisanju meča.');
    }
  }

  // ---- Add match form helpers ----
  isAddFormOpen(roundId: string): boolean {
    return this.addForms()[roundId]?.open ?? false;
  }

  isAddFormSaving(roundId: string): boolean {
    return this.addForms()[roundId]?.saving ?? false;
  }

  addFormHome(roundId: string): string {
    return this.addForms()[roundId]?.homeTeamId ?? '';
  }

  addFormAway(roundId: string): string {
    return this.addForms()[roundId]?.awayTeamId ?? '';
  }

  openAddForm(roundId: string) {
    this.addForms.update(f => ({
      ...f,
      [roundId]: { homeTeamId: '', awayTeamId: '', open: true, saving: false },
    }));
  }

  closeAddForm(roundId: string) {
    this.addForms.update(f => {
      const copy = { ...f };
      delete copy[roundId];
      return copy;
    });
  }

  setAddFormValue(roundId: string, side: 'home' | 'away', value: string) {
    this.addForms.update(f => ({
      ...f,
      [roundId]: {
        ...f[roundId],
        [side === 'home' ? 'homeTeamId' : 'awayTeamId']: value,
      },
    }));
  }

  canAddMatch(roundId: string): boolean {
    const f = this.addForms()[roundId];
    return !!f?.homeTeamId && !!f?.awayTeamId && f.homeTeamId !== f.awayTeamId;
  }

  async addMatch(roundId: string) {
    const f = this.addForms()[roundId];
    if (!f || !f.homeTeamId || !f.awayTeamId) return;
    this.addForms.update(forms => ({ ...forms, [roundId]: { ...forms[roundId], saving: true } }));
    this.globalError.set('');
    try {
      await this.league.createMatch(roundId, f.homeTeamId, f.awayTeamId);
      await this.reloadMatchesAndTeams();
      this.closeAddForm(roundId);
    } catch {
      this.globalError.set('Greška pri dodavanju meča.');
      this.addForms.update(forms => ({ ...forms, [roundId]: { ...forms[roundId], saving: false } }));
    }
  }

  // ---- Teams tab ----
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

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/admin/login']);
  }
}
