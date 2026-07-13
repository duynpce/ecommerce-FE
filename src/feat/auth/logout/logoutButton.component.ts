import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { ConfirmModalComponent } from '../../../shared/component/confirmModal.component';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import {
  getStoredAuthServer,
  type AuthServer,
} from '../auth.type';
import { LogoutService } from './logout.service';

@Component({
  selector: 'app-logout-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  
  imports: [ConfirmModalComponent],
  templateUrl: './logoutButton.component.html',
})
export class LogoutButtonComponent {
  private readonly logoutService = inject(LogoutService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  readonly authServer = input<AuthServer | null>(null);
  readonly loggedOut = output<void>();

  readonly ui = UI_CLASS_NAME;

  readonly modalOpen = signal(false);
  readonly processing = signal(false);

  openConfirm(): void {
    this.modalOpen.set(true);
  }

  closeConfirm(): void {
    this.modalOpen.set(false);
  }

  confirmLogout(): void {
    const selectedServer = this.authServer() ?? getStoredAuthServer();

    if (!selectedServer) {
      this.logoutService.clearClientAuthState();
      this.modalOpen.set(false);
      this.toastr.warning('No selected auth server found. Local auth state was still cleared.');
      this.router.navigate(['/home']);
      this.loggedOut.emit();
      return;
    }

    this.processing.set(true);

    this.logoutService
      .logout(selectedServer)
      .pipe(finalize(() => this.processing.set(false)))
      .subscribe({
        next: () => {
          this.modalOpen.set(false);
          this.router.navigate(['/home']);
          localStorage.removeItem('roles');
          localStorage.removeItem('isLoggedIn');
          this.loggedOut.emit();
        },
        error: () => {
          this.toastr.error('Logout failed. Please try again.');
        },
      });
  }
}
