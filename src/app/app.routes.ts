import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { StandingsComponent } from './features/standings/standings.component';
import { ResultsComponent } from './features/results/results.component';
import { AdminLoginComponent } from './features/admin/admin-login.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'tabela', pathMatch: 'full' },
  { path: 'tabela', component: StandingsComponent },
  { path: 'raspored', component: ResultsComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'tabela' },
];
