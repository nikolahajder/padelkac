import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div class="w-full max-w-sm">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-white">Padel Liga Kac</h1>
          <p class="text-slate-500 text-sm mt-1">Admin panel</p>
        </div>

        <div class="bg-slate-800 rounded-xl border border-slate-700 p-6">
          @if (error()) {
            <div class="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {{ error() }}
            </div>
          }

          <form (ngSubmit)="onSubmit()">
            <div class="mb-4">
              <label class="block text-slate-400 text-sm mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                [(ngModel)]="email"
                required
                autocomplete="email"
                class="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-lg text-sm
                       focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30
                       placeholder-slate-500 transition-colors"
                placeholder="admin@example.com"
              />
            </div>
            <div class="mb-6">
              <label class="block text-slate-400 text-sm mb-1.5">Lozinka</label>
              <input
                type="password"
                name="password"
                [(ngModel)]="password"
                required
                autocomplete="current-password"
                class="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-lg text-sm
                       focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30
                       placeholder-slate-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              [disabled]="loading()"
              class="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {{ loading() ? 'Prijavljivanje...' : 'Prijavi se' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class AdminLoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  async onSubmit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.signIn(this.email, this.password);
      this.router.navigate(['/admin']);
    } catch {
      this.error.set('Pogrešan email ili lozinka.');
    } finally {
      this.loading.set(false);
    }
  }
}
