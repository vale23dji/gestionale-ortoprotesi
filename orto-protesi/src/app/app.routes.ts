import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  // Dashboard - accessibile solo all'admin
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [() => RoleGuard(['admin'])],
  },

  // Rotte pubbliche (senza autenticazione)
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'verifica-email',
    loadComponent: () => import('./pages/verifica-email/verifica-email.component').then(m => m.VerificaEmailComponent),
  },

  // Profilo - accessibile sia ad admin che medico
  {
    path: 'profilo',
    loadComponent: () => import('./pages/profilo/profilo.component').then(m => m.ProfiloComponent),
    canActivate: [() => RoleGuard(['admin', 'medico'])],
  },

  // Rotte amministrative - solo admin
  {
    path: 'clienti',
    loadComponent: () => import('./pages/clienti/clienti.component').then(m => m.ClientiComponent),
    canActivate: [() => RoleGuard(['admin'])],
  },
  {
    path: 'invita-medico',
    loadComponent: () => import('./pages/invita-medico/invita-medico.component').then(m => m.InvitaMedicoComponent),
    canActivate: [() => RoleGuard(['admin'])],
  },
  {
    path: 'nuova-lavorazione',
    loadComponent: () => import('./pages/nuova-lavorazione.component').then(m => m.NuovaLavorazioneComponent),
    canActivate: [() => RoleGuard(['admin'])],
  },
  {
    path: 'lavorazioni',
    loadComponent: () => import('./pages/lavorazioni/lavorazioni.component').then(m => m.LavorazioniComponent),
    canActivate: [() => RoleGuard(['admin'])],
  },
  {
    path: 'clienti/:id',
    loadComponent: () => import('./pages/cliente-dettaglio.component').then(m => m.ClienteDettaglioComponent),
    canActivate: [() => RoleGuard(['admin'])],
  },
  {
    path: 'invita-medico-list',
    loadComponent: () => import('./pages/invita-medico-list/invita-medico-list.component').then(m => m.InvitaMedicoListComponent),
    canActivate: [() => RoleGuard(['admin'])],
  },

  // Rotte medico - solo medico
  {
    path: 'mie-lavorazioni',
    loadComponent: () => import('./pages/mie-lavorazioni/mie-lavorazioni.component').then(m => m.MieLavorazioniComponent),
    canActivate: [() => RoleGuard(['medico'])],
  },
  {
    path: 'nuova-lavorazione-medico',
    loadComponent: () => import('./pages/nuova-lavorazione-medico/nuova-lavorazione-medico.component').then(m => m.NuovaLavorazioneMedicoComponent),
    canActivate: [() => RoleGuard(['medico'])],
  },

  // Cambio password - accessibile a tutti gli utenti autenticati
  {
    path: 'cambia-password',
    loadComponent: () => import('./pages/cambia-password/cambia-password.component').then(m => m.CambiaPasswordComponent),
    canActivate: [() => RoleGuard(['admin', 'medico'])],
  },

  //Rotte informative e privacy (accessibili a tutti)
  {
    path: 'privacy',
    loadComponent: () => import('./pages/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent)
  },
  {
    path: 'termini',
    loadComponent: () => import('./pages/termini-servizio/termini-servizio.component').then(m => m.TerminiServizioComponent)
  },
  {
    path: 'gdpr',
    loadComponent: () => import('./pages/gdpr-info/gdpr-info.component').then(m => m.GdprInfoComponent),
    canActivate: [() => RoleGuard(['admin', 'medico'])] // Solo per admin e medico
  },


  // Rotte speciali
  {
    path: 'accesso-negato',
    loadComponent: () => import('./pages/accesso-negato.component').then(m => m.AccessoNegatoComponent)
  },
  {
    path: '**',
    redirectTo: '/login',  // Reindirizza alla login invece che alla dashboard
  },
];
