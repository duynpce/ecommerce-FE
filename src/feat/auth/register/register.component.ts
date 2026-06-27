import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  switchMap,
} from 'rxjs';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import {
  getStoredAuthServer,
  isAuthServer,
  setStoredAuthServer,
  type AuthServer,
  type RegisterRequest,
} from '../auth.type';
import { RegisterService } from './register.service';
import {
  availabilitySchema,
  registerSchema,
  type AvailabilityField,
  type RegisterFieldName,
} from './register.type';
import { ToastrService } from 'ngx-toastr';
import { TokenService } from '../../../core/token.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly registerService = inject(RegisterService);
  private readonly toastr = inject(ToastrService);
  private readonly tokenService = inject(TokenService);
  private readonly http = inject(HttpClient);

  readonly ui = UI_CLASS_NAME;

  readonly form = this.fb.nonNullable.group({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    gender: 'MALE' as RegisterRequest['gender'],
  });

  readonly authServer = signal<AuthServer | null>(null);
  readonly authServerError = signal<string>('');

  readonly zodErrors = signal<Partial<Record<RegisterFieldName, string>>>({});

  readonly usernameExists = signal(false);
  readonly emailExists = signal(false);
  readonly phoneNumberExists = signal(false);

  readonly submitting = signal(false);
  readonly submitMessage = signal('');

  readonly submitDisabled = computed(() => {
    return (
      this.submitting() ||
      !!this.authServerError() ||
      Object.keys(this.zodErrors()).length > 0 ||
      this.usernameExists() ||
      this.emailExists() ||
      this.phoneNumberExists()
    );
  });

  constructor() {
    this.resolveAuthServer();
    this.validateForm();
    this.bindFormValidation();
    this.bindAvailabilityChecks();
  }

  fieldError(field: RegisterFieldName): string | undefined {
    return this.zodErrors()[field];
  }

  submit(): void {
    this.validateForm();

    const authServer = this.authServer();
    if (!authServer) {
      this.authServerError.set('Auth server is required. Visit /register/local or /register/remote.');
      return;
    }

    if (this.submitDisabled()) {
      return;
    }

    this.submitting.set(true);
    this.submitMessage.set('');

    this.registerService
      .register(authServer, this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (res) => {
          this.submitMessage.set(res.message ?? 'Registration completed successfully.');
        },
        error: () => {
          this.submitMessage.set('');
        },
      });
  }

  private resolveAuthServer(): void {
    const serverFromRoute = this.route.snapshot.paramMap.get('authServer');

    if (isAuthServer(serverFromRoute)) {
      setStoredAuthServer(serverFromRoute);
      this.authServer.set(serverFromRoute);
      return;
    }

    const serverFromStorage = getStoredAuthServer();
    if (serverFromStorage) {
      this.authServer.set(serverFromStorage);
      return;
    }

    this.authServerError.set('Auth server is not selected. Use /register/local or /register/remote.');
  }

  private bindFormValidation(): void {
    this.form.valueChanges
      .pipe(debounceTime(250), takeUntilDestroyed())
      .subscribe(() => this.validateForm());
  }

  private bindAvailabilityChecks(): void {
    this.bindAuthAvailabilityCheck('username');
    this.bindAuthAvailabilityCheck('email');
    this.bindPhoneAvailabilityCheck();
  }

  private bindAuthAvailabilityCheck(field: 'username' | 'email'): void {
    this.form.controls[field].valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((value) => {
          const authServer = this.authServer();
          if (!authServer || !this.canCheck(field, value)) {
            this.setExistsState(field, false);
            return of(false);
          }

          return this.registerService.checkAuthFieldExists(authServer, field, value);
        }),
        takeUntilDestroyed()
      )
      .subscribe((exists) => this.setExistsState(field, exists));
  }

  private bindPhoneAvailabilityCheck(): void {
    this.form.controls.phoneNumber.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((value) => {
          if (!this.canCheck('phoneNumber', value)) {
            this.phoneNumberExists.set(false);
            return of(false);
          }

          return this.registerService.checkUserFieldExists('phoneNumber', value);
        }),
        takeUntilDestroyed()
      )
      .subscribe((exists) => this.phoneNumberExists.set(exists));
  }

  private canCheck(field: AvailabilityField, value: string): boolean {
    if (!value) {
      return false;
    }

    return availabilitySchema[field].safeParse(value).success;
  }

  private setExistsState(field: 'username' | 'email', exists: boolean): void {
    if (field === 'username') {
      this.usernameExists.set(exists);
      return;
    }

    this.emailExists.set(exists);
  }

  private validateForm(): void {
    const parsed = registerSchema.safeParse(this.form.getRawValue());

    if (parsed.success) {
      this.zodErrors.set({});
      return;
    }

    const errors: Partial<Record<RegisterFieldName, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as RegisterFieldName | undefined;
      if (!field || errors[field]) {
        continue;
      }

      errors[field] = issue.message;
    }

    this.zodErrors.set(errors);
  }

  logAccessToken(): void {
    this.toastr.info(`Access Token: ${this.tokenService.get()}`);
  }

  try401(): void {
    this.http.get('/v1/auth/local/test-auth').subscribe({
      next: (response) => {
        console.log('Response:', response);
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }
}
