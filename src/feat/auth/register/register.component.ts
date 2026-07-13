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
import {  Router, RouterLink } from '@angular/router';
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
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly registerService = inject(RegisterService);
  private readonly toastr = inject(ToastrService);
  private readonly http = inject(HttpClient);
  private readonly authServer = "local";
  private readonly router = inject(Router);

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

  readonly zodErrors = signal<Partial<Record<RegisterFieldName, string>>>({});

  readonly usernameExists = signal(false);
  readonly emailExists = signal(false);
  readonly phoneNumberExists = signal(false);

  readonly submitting = signal(false);
  readonly submitMessage = signal('');

  readonly submitDisabled = computed(() => {
    return (
      this.submitting() ||
      Object.keys(this.zodErrors()).length > 0 ||
      this.usernameExists() ||
      this.emailExists() ||
      this.phoneNumberExists()
    );
  });

  constructor() {
    this.validateForm();
    this.bindFormValidation();
    this.bindAvailabilityChecks();
  }

  fieldError(field: RegisterFieldName): string | undefined {
    return this.zodErrors()[field];
  }

  submit(): void {
    this.validateForm();

    if (this.submitDisabled()) {
      return;
    }

    this.submitting.set(true);
    this.submitMessage.set('');

    this.registerService
      .register( this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (res) => {
          this.submitMessage.set(res.message ?? 'Registration completed successfully.');
          this.router.navigate(['/login']);
        },
        error: () => {
          this.submitMessage.set('');
        },
      });
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
          return this.registerService.checkAuthFieldExists(this.authServer  , field, value);
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

          return this.registerService.checkUserFieldExists('phone-number', value);
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


}
