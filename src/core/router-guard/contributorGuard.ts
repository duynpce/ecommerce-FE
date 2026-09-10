import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";

export const contributorGuard: CanActivateFn = () => {
  const router = inject(Router);
  const toast = inject(ToastrService);

  try {
    const raw = localStorage.getItem('roles');
    const roles: string[] = raw ? JSON.parse(raw) : [];

    if (roles.includes('CONTRIBUTOR')) {
      return true;
    }
  } catch {
    // Corrupted localStorage value — treat as no roles
  }

  // Save where they were trying to go, then redirect
  sessionStorage.setItem('previousPath', window.location.pathname);

  toast.error('You do not have permission to access this page.', 'Access Denied');
  return router.createUrlTree(['/home']);
};