import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../shared/service/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly toastService = inject(ToastrService);
  private readonly authService = inject(AuthService);

  readonly roles = signal<string[]>(this.readRoles());

  readonly isAdmin = computed(() =>
    this.roles().includes('ADMIN') || this.roles().includes('SUPER_ADMIN'),
  );

  private readRoles(): string[] {
    try {
      const raw = localStorage.getItem('roles');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  testToastr(): void {
    this.toastService.success('This is a success message!', 'Success');
  }

  testAuthService(): void {
    this.authService.isLoggedIn().subscribe({
      next: (isLoggedIn) => {
        if (isLoggedIn) {
          this.toastService.success('User is logged in.', 'Auth Status');
        } else {
          this.toastService.warning('User is not logged in.', 'Auth Status');
        }
      },
    });
  }
}