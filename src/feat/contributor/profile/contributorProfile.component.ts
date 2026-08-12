import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import {
  UserService,
  ContributorProfileResponse,
} from '../../../shared/service/user.service';

@Component({
  selector: 'app-contributor-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './contributorProfile.component.html',
})
export class ContributorProfileComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly toastr      = inject(ToastrService);
  private readonly fb          = inject(FormBuilder);

  readonly ui        = UI_CLASS_NAME;
  readonly loading   = signal(false);
  readonly saving    = signal(false);
  readonly isEditing = signal(false);
  readonly profile   = signal<ContributorProfileResponse | null>(null);

  readonly form = this.fb.group({
    bankName:           ['', [Validators.required, Validators.minLength(1)]],
    bankAccountNumber:  ['', [Validators.required, Validators.minLength(1)]],
    taxId:              ['', [Validators.required, Validators.minLength(1)]],
  });

  ngOnInit(): void {
    this.fetchProfile();
  }

  private fetchProfile(): void {
    this.loading.set(true);
    this.userService.getMyContributorProfile().subscribe({
      next: (res) => {
        this.loading.set(false);
        const p = res.data;
        if (!p) return;
        this.profile.set(p);
        this.patchForm(p);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastr.error(err?.error?.message ?? 'Failed to load contributor profile.');
      },
    });
  }

  private patchForm(p: ContributorProfileResponse): void {
    this.form.patchValue({
      bankName:          p.bankName,
      bankAccountNumber: p.bankAccountNumber,
      taxId:             p.taxId,
    });
  }

  toggleEdit(): void {
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    const p = this.profile();
    if (p) this.patchForm(p);
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    this.saving.set(true);
    this.userService.updateMyContributorProfile({
      bankName:          v.bankName          || undefined,
      bankAccountNumber: v.bankAccountNumber || undefined,
      taxId:             v.taxId             || undefined,
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.data) this.profile.set(res.data);
        this.isEditing.set(false);
        this.toastr.success('Contributor profile updated successfully!');
      },
      error: (err) => {
        this.saving.set(false);
        this.toastr.error(err?.error?.message ?? 'Failed to update contributor profile.');
      },
    });
  }
}
