import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

export const shipperGuard: CanActivateFn = () => {
  const router = inject(Router);
  const toast = inject(ToastrService);
  try {
    const roles: string[] = JSON.parse(localStorage.getItem('roles') ?? '[]');
    if (roles.includes('SHIPPER')) return true;
  } catch {
    // Treat a corrupted role cache as unauthorised.
  }
  sessionStorage.setItem('previousPath', window.location.pathname);
  toast.error('A Shipper role is required to access delivery work.', 'Access Denied');
  return router.createUrlTree(['/user/tickets/apply']);
};
