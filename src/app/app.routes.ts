import { Routes } from '@angular/router';
import { adminGuard } from '../core/router-guard/adminGuard';

export const routes: Routes = [
  // ── Auth pages — NO shell layout ────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('../feat/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('../feat/auth/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: 'callback/:authServer',
    loadComponent: () =>
      import('../feat/auth/callback/callback.component').then(
        (m) => m.CallbackComponent,
      ),
  },

  // ── Shell layout — wraps home, logout ───────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('../layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
      },
      {
        path: 'home',
        loadComponent: () =>
          import('../feat/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'logout',
        loadComponent: () =>
          import('../feat/auth/logout/logout.component').then(
            (m) => m.LogoutComponent,
          ),
      },
      {
        path: 'logout/:authServer',
        loadComponent: () =>
          import('../feat/auth/logout/logout.component').then(
            (m) => m.LogoutComponent,
          ),
      },
    ],
  },

  // ── User layout — wraps user-facing feature pages ───────────────────────
  {
    path: 'user',
    loadComponent: () =>
      import('../layout/userLayout.component').then((m) => m.UserLayoutComponent),
    children: [
      {
        path: 'tickets/apply',
        loadComponent: () =>
          import('../feat/user/userTicket.component').then(
            (m) => m.UserTicketComponent,
          ),
      },
      // Add more user pages here as needed
      // {
      //   path: 'profile',
      //   loadComponent: () =>
      //     import('../feat/profile/profile.component').then(
      //       (m) => m.ProfileComponent,
      //     ),
      // },
    ],
  },

  // ── Admin layout — protected by adminGuard, with sidebar nav ────────────
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('../layout/adminLayout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'account',
      },
      {
        path: 'account',
        loadComponent: () =>
          import('../feat/admin/dashboard/account/adminAccount.component').then(
            (m) => m.AdminAccountComponent,
          ),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('../feat/admin/dashboard/ticket/adminTicket.component').then(
            (m) => m.AdminTicketComponent,
          ),
      },
    ],
  },

  // ── Fallback ─────────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'home',
  },
];
