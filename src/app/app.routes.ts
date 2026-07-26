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
  {
    path: 'complete-profile',
    loadComponent: () =>
      import('../feat/auth/complete-profile/complete-profile.component').then(
        (m) => m.CompleteProfileComponent,
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

  // ── User layout — left sidebar, wraps user-facing feature pages ─────────
  {
    path: 'user',
    loadComponent: () =>
      import('../layout/userLayout.component').then((m) => m.UserLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'products',
      },

      // ── Contributor application ────────────────────────────────────────
      {
        path: 'tickets/apply',
        loadComponent: () =>
          import('../feat/user/ticket/userTicket.component').then(
            (m) => m.UserTicketComponent,
          ),
      },

      // ── Products ──────────────────────────────────────────────────────
      {
        path: 'products',
        loadComponent: () =>
          import('../feat/user/product/userProduct.component').then(
            (m) => m.UserProductComponent,
          ),
      },
      {
        path: 'products/create',
        loadComponent: () =>
          import('../feat/user/product/userProductCreate.component').then(
            (m) => m.UserProductCreateComponent,
          ),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('../feat/user/product/userProductDetail.component').then(
            (m) => m.UserProductDetailComponent,
          ),
      },

      // ── Shops ─────────────────────────────────────────────────────────
      {
        path: 'shops/:id',
        loadComponent: () =>
          import('../feat/user/shop/userShopDetail.component').then(
            (m) => m.UserShopDetailComponent,
          ),
      },

      // ── My Shop (Contributor only) ────────────────────────────────────
      {
        path: 'my-shop',
        loadComponent: () =>
          import('../feat/user/shop/userMyShop.component').then(
            (m) => m.UserMyShopComponent,
          ),
      },

      // ── My Products (Contributor only) ───────────────────────────────
      {
        path: 'my-products',
        loadComponent: () =>
          import('../feat/user/product/userMyProducts.component').then(
            (m) => m.UserMyProductsComponent,
          ),
      },

      // ── Transactions ──────────────────────────────────────────────────
      {
        path: 'transactions',
        loadComponent: () =>
          import('../feat/user/transaction/userTransaction.component').then(
            (m) => m.UserTransactionComponent,
          ),
      },
      {
        path: 'transactions/:id',
        loadComponent: () =>
          import('../feat/user/transaction/userTransactionDetail.component').then(
            (m) => m.UserTransactionDetailComponent,
          ),
      },
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
      // ── Admin: all transactions (admin/search endpoint) ────────────────
      {
        path: 'transactions',
        loadComponent: () =>
          import('../feat/admin/dashboard/transaction/adminTransaction.component').then(
            (m) => m.AdminTransactionComponent,
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