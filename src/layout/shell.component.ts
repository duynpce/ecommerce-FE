import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { LogoutButtonComponent } from '../feat/auth/logout/logoutButton.component';
import { AuthService } from '../feat/auth/auth.service';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, LogoutButtonComponent],
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

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}