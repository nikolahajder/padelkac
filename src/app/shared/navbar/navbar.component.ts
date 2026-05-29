import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bg-slate-900 border-b border-slate-700/60 sticky top-0 z-50">
      <div class="max-w-5xl mx-auto px-4">
        <div class="flex items-center justify-between h-14">
          <div class="flex items-center gap-2">
            <a routerLink="/tabela" class="text-lg font-bold text-white tracking-tight hover:text-emerald-400 transition-colors">Padel Liga Kać</a>
          </div>

          <!-- Desktop nav -->
          <div class="hidden sm:flex items-center gap-1">
            <a
              routerLink="/tabela"
              routerLinkActive="bg-slate-700 text-white"
              class="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >Tabela</a>
            <a
              routerLink="/raspored"
              routerLinkActive="bg-slate-700 text-white"
              class="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >Raspored</a>
          </div>

          <!-- Mobile menu button -->
          <button
            class="sm:hidden p-2 text-slate-400 hover:text-white transition-colors"
            (click)="menuOpen.set(!menuOpen())"
            aria-label="Menu"
          >
            @if (menuOpen()) {
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            } @else {
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            }
          </button>
        </div>

        <!-- Mobile menu -->
        @if (menuOpen()) {
          <div class="sm:hidden border-t border-slate-700/60 py-2 pb-3">
            <a
              routerLink="/tabela"
              routerLinkActive
              #rlaTabela="routerLinkActive"
              [class]="'block px-3 py-2 rounded-lg text-sm font-medium transition-colors ' + (rlaTabela.isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white')"
              (click)="menuOpen.set(false)"
            >Tabela</a>
            <a
              routerLink="/raspored"
              routerLinkActive
              #rlaRaspored="routerLinkActive"
              [class]="'block px-3 py-2 rounded-lg text-sm font-medium transition-colors ' + (rlaRaspored.isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white')"
              (click)="menuOpen.set(false)"
            >Raspored</a>
          </div>
        }
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  menuOpen = signal(false);
}
