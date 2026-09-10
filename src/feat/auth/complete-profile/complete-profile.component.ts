import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  switchMap,
} from 'rxjs';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { CompleteProfileService } from './complete-profile.service';
import {
  completeProfileSchema,
  completeProfileAvailabilitySchema,
  type CompleteProfileFieldName,
  type CompleteProfileAvailabilityField,
} from './complete-profile.type';
import { LogoutButtonComponent } from "../logout/logoutButton.component";

@Component({
  selector: 'app-complete-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LogoutButtonComponent],
  templateUrl: './complete-profile.component.html',
})
export class CompleteProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly completeProfileService = inject(CompleteProfileService);
  private readonly router = inject(Router);

  readonly ui = UI_CLASS_NAME;

  readonly form = this.fb.nonNullable.group({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
  });

  readonly zodErrors = signal<Partial<Record<CompleteProfileFieldName, string>>>({});

  readonly usernameExists = signal(false);
  readonly phoneNumberExists = signal(false);

  readonly submitting = signal(false);
  readonly submitMessage = signal('');

  readonly submitDisabled = computed(
    () =>
      this.submitting() ||
      Object.keys(this.zodErrors()).length > 0 ||
      this.usernameExists() ||
      this.phoneNumberExists()
  );

  constructor() {
    this.validateForm();
    this.bindFormValidation();
    this.bindAvailabilityChecks();
  }

  fieldError(field: CompleteProfileFieldName): string | undefined {
    return this.zodErrors()[field];
  }

  submit(): void {
    this.validateForm();

    if (this.submitDisabled()) {
      return;
    }

    this.submitting.set(true);
    this.submitMessage.set('');

    this.completeProfileService
      .completeProfile(this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (res) => {
          this.submitMessage.set(res.message ?? 'Profile completed successfully.');
          // Mark the user as active and navigate home
          localStorage.setItem('isActive', 'true');
          this.router.navigate(['/home'], { replaceUrl: true });
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
    this.bindUsernameCheck();
    this.bindPhoneNumberCheck();
  }

  private bindUsernameCheck(): void {
    this.form.controls.username.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((value) => {
          if (!this.canCheck('username', value)) {
            this.usernameExists.set(false);
            return of(false);
          }
          return this.completeProfileService.checkUsernameExists(value);
        }),
        takeUntilDestroyed()
      )
      .subscribe((exists) => this.usernameExists.set(exists));
  }

  private bindPhoneNumberCheck(): void {
    this.form.controls.phoneNumber.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((value) => {
          if (!this.canCheck('phoneNumber', value)) {
            this.phoneNumberExists.set(false);
            return of(false);
          }
          return this.completeProfileService.checkPhoneNumberExists(value);
        }),
        takeUntilDestroyed()
      )
      .subscribe((exists) => this.phoneNumberExists.set(exists));
  }

  private canCheck(field: CompleteProfileAvailabilityField, value: string): boolean {
    if (!value) return false;
    return completeProfileAvailabilitySchema[field].safeParse(value).success;
  }

  private validateForm(): void {
    const parsed = completeProfileSchema.safeParse(this.form.getRawValue());

    if (parsed.success) {
      this.zodErrors.set({});
      return;
    }

    const errors: Partial<Record<CompleteProfileFieldName, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as CompleteProfileFieldName | undefined;
      if (!field || errors[field]) continue;
      errors[field] = issue.message;
    }

    this.zodErrors.set(errors);
  }
}
