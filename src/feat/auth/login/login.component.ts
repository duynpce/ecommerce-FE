import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { environment } from '../../../environments/environment.development';
import { LoginService } from './login.service';
import { setStoredAuthServer } from '../auth.type';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  readonly ui = UI_CLASS_NAME;
  readonly keycloakLoginUrl = environment.KEYCLOAK_LOGIN_API_URL;

  readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  showPassword  = false;
  readonly loading      = signal(false);
  readonly errorMessage = signal('');

  isFieldInvalid(field: 'username' | 'password'): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  onLogin(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const body = {
      username: this.form.value.username!,
      password: this.form.value.password!,
    };

    this.loginService.login(body).subscribe({
      next: (res) => {
        this.loading.set(false);
        localStorage.setItem('roles', JSON.stringify(res.data));
        const previousPath = sessionStorage.getItem('previousPath');
        setStoredAuthServer('local');
        this.router.navigate([previousPath && previousPath !== '/login' ? previousPath : '/home']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }
}