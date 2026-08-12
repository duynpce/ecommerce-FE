import { Routes } from '@angular/router';
import { adminGuard } from '../core/router-guard/adminGuard';
import { contributorGuard } from '../core/router-guard/contributorGuard';

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
      import('../feat/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'callback/:authServer',
    loadComponent: () =>
      import('../feat/auth/callback/callback.component').then((m) => m.CallbackComponent),
  },
  {
    path: 'complete-profile',
    loadComponent: () =>
      import('../feat/auth/complete-profile/complete-profile.component').then(
        (m) => m.CompleteProfileComponent,
      ),
  },

  // ── Shell layout ─────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('../layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        loadComponent: () =>
          import('../feat/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'logout',
        loadComponent: () =>
          import('../feat/auth/logout/logout.component').then((m) => m.LogoutComponent),
      },
      {
        path: 'logout/:authServer',
        loadComponent: () =>
          import('../feat/auth/logout/logout.component').then((m) => m.LogoutComponent),
      },
    ],
  },

  // ── User layout ───────────────────────────────────────────────────────────
  {
    path: 'user',
    loadComponent: () =>
      import('../layout/userLayout.component').then((m) => m.UserLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'products' },

      {
        path: 'profile',
        loadComponent: () =>
          import('../feat/user/profile/userProfile.component').then(
            (m) => m.UserProfileComponent,
          ),
      },
      {
        path: 'credential',
        loadComponent: () =>
          import('../feat/user/profile/userCredential.component').then(
            (m) => m.UserCredentialComponent,
          ),
      },
      {
        path: 'tickets/apply',
        loadComponent: () =>
          import('../feat/user/ticket/userTicket.component').then(
            (m) => m.UserTicketComponent,
          ),
      },

      // Products
      {
        path: 'products',
        loadComponent: () =>
          import('../feat/user/product/userProduct.component').then((m) => m.UserProductComponent),
      },
      {
        path: 'products/create',
        loadComponent: () =>
          import('../feat/contributor/product/contributorProductCreate.component').then(
            (m) => m.contributorProductCreateComponent,
          ),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('../feat/user/product/userProductDetail.component').then(
            (m) => m.UserProductDetailComponent,
          ),
      },

      // Shops
      {
        path: 'shops/:id',
        loadComponent: () =>
          import('../feat/user/shop/userShopDetail.component').then((m) => m.UserShopDetailComponent),
      },

      // Transactions
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

  // ── Contributor layout ────────────────────────────────────────────────────
  {
    path: 'contributor',
    canActivate: [contributorGuard],
    loadComponent: () =>
      import('../layout/contributorLayout.component').then((m) => m.ContributorLayoutComponent), // reuse or swap for a dedicated layout later
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'my-shop' },

      // My shop & products
      {
        path: 'my-shop',
        loadComponent: () =>
          import('../feat/contributor/shop/contributorMyShop.component').then((m) => m.contributorMyShopComponent),
      },
      {
        path: 'my-products',
        loadComponent: () =>
          import('../feat/contributor/product/contributorMyProducts.component').then(
            (m) => m.contributorMyProductsComponent,
          ),
      },

      // Order management
      {
        path: 'transactions',
        loadComponent: () =>
          import('../feat/contributor/transaction/contributorTransaction.component').then(
            (m) => m.ContributorTransactionComponent,
          ),
      },
      {
        path: 'transactions/:id',
        loadComponent: () =>
          import('../feat/contributor/transaction/contributorTransactionDetail.component').then(
            (m) => m.ContributorTransactionDetailComponent,
          ),
      },

      // Contributor Profile
      {
        path: 'profile',
        loadComponent: () =>
          import('../feat/contributor/profile/contributorProfile.component').then(
            (m) => m.ContributorProfileComponent,
          ),
      },
    ],
  },

  // ── Admin layout ──────────────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('../layout/adminLayout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'account' },
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
      {
        path: 'transactions',
        loadComponent: () =>
          import('../feat/admin/dashboard/transaction/adminTransaction.component').then(
            (m) => m.AdminTransactionComponent,
          ),
      },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  { path: '**', redirectTo: 'home' },
];