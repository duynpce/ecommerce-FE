import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);

  try {
    const raw = localStorage.getItem('roles');
    const roles: string[] = raw ? JSON.parse(raw) : [];

    if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
      return true;
    }
  } catch {
    // Corrupted localStorage value — treat as no roles
  }

  // Save where they were trying to go, then redirect
  sessionStorage.setItem('previousPath', window.location.pathname);
  return router.createUrlTree(['/home']);
};