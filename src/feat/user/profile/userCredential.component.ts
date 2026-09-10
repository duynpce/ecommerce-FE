import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { UserService } from '../../../shared/service/user.service';

/** Validator: newPassword must not equal currentPassword */
const newPasswordDifferentValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const current = control.get('currentPassword')?.value ?? '';
  const next    = control.get('newPassword')?.value ?? '';
  return current && next && current === next
    ? { samePassword: true }
    : null;
};

/** Validator: confirmPassword must match newPassword */
const confirmMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const next    = control.get('newPassword')?.value ?? '';
  const confirm = control.get('confirmPassword')?.value ?? '';
  return next && confirm && next !== confirm
    ? { passwordMismatch: true }
    : null;
};

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':",./<>?\\|~`])\S{8,}$/;

@Component({
  selector: 'app-user-credential',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './userCredential.component.html',
})
export class UserCredentialComponent {
  private readonly userService = inject(UserService);
  private readonly toastr      = inject(ToastrService);
  private readonly fb          = inject(FormBuilder);

  readonly ui      = UI_CLASS_NAME;
  readonly saving  = signal(false);
  readonly success = signal(false);

  /** Toggle visibility for each password field */
  readonly showCurrent = signal(false);
  readonly showNew     = signal(false);
  readonly showConfirm = signal(false);

  readonly form = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(PASSWORD_PATTERN),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [newPasswordDifferentValidator, confirmMatchValidator],
    },
  );

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  get formError(): string | null {
    if (this.form.hasError('samePassword')) {
      return 'New password must be different from your current password.';
    }
    if (this.form.hasError('passwordMismatch')) {
      return 'Passwords do not match.';
    }
    return null;
  }

  onSubmit(): void {
    this.success.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    this.saving.set(true);
    this.userService
      .changePassword({
        currentPassword: v.currentPassword!,
        newPassword:     v.newPassword!,
        confirmPassword: v.confirmPassword!,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.success.set(true);
          this.form.reset();
          this.toastr.success('Password changed successfully!');
        },
        error: (err) => {
          this.saving.set(false);
          this.toastr.error(err?.error?.message ?? 'Failed to change password.');
        },
      });
  }
}
