import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { LogoutButtonComponent } from '../feat/auth/logout/logoutButton.component';
import { AuthService } from '../shared/service/auth.service';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, LogoutButtonComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // toSignal() subscribes to the Observable and keeps the signal
  // in sync — initialValue: false so the navbar starts as "logged out"
  // while the /me request is in-flight
  readonly isAuthenticated = toSignal(this.authService.isLoggedIn(), {
    initialValue: false,
  });

  private readonly roles = this.readRoles();

  navigateToProfile(): void {
    if (this.roles.includes('ADMIN') || this.roles.includes('SUPER_ADMIN')) {
      this.router.navigate(['/admin']);
      return;
    }

    if (this.roles.includes('CONTRIBUTOR')) {
      this.router.navigate(['/contributor/profile']);
      return;
    }

    this.router.navigate(['/user/profile']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToSeller(): void {
    this.router.navigate([
      this.roles.includes('CONTRIBUTOR') ? '/contributor/my-shop' : '/user/tickets/apply',
    ]);
  }

  private readRoles(): string[] {
    try {
      const raw = localStorage.getItem('roles');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
