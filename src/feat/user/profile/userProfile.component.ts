import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import {
  UserService,
  AccountProfileResponse,
  Gender,
} from '../../../shared/service/user.service';

import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-user-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, SlicePipe],
  templateUrl: './userProfile.component.html',
})
export class UserProfileComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly toastr      = inject(ToastrService);
  private readonly fb          = inject(FormBuilder);

  readonly ui        = UI_CLASS_NAME;
  readonly loading   = signal(false);
  readonly saving    = signal(false);
  readonly isEditing = signal(false);
  readonly profile   = signal<AccountProfileResponse | null>(null);

  readonly genders: Gender[] = ['MALE', 'FEMALE', 'OTHER'];

  readonly form = this.fb.group({
    firstName:   ['', [Validators.required, Validators.minLength(1)]],
    lastName:    ['', [Validators.required, Validators.minLength(1)]],
    phoneNumber: ['', [Validators.required, Validators.minLength(1)]],
    address:     ['', [Validators.required, Validators.minLength(1)]],
    gender:      ['' as Gender | '', [Validators.required]],
  });

  ngOnInit(): void {
    this.fetchProfile();
  }

  private fetchProfile(): void {
    this.loading.set(true);
    this.userService.getMyProfile().subscribe({
      next: (res) => {
        this.loading.set(false);
        const p = res.data;
        if (!p) return;
        this.profile.set(p);
        this.form.patchValue({
          firstName:   p.firstName,
          lastName:    p.lastName,
          phoneNumber: p.phoneNumber,
          address:     p.address,
          gender:      p.gender,
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.toastr.error(err?.error?.message ?? 'Failed to load profile.');
      },
    });
  }

  toggleEdit(): void {
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    const p = this.profile();
    if (p) {
      this.form.patchValue({
        firstName:   p.firstName,
        lastName:    p.lastName,
        phoneNumber: p.phoneNumber,
        address:     p.address,
        gender:      p.gender,
      });
    }
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
    this.userService.updateMyProfile({
      firstName:   v.firstName   || undefined,
      lastName:    v.lastName    || undefined,
      phoneNumber: v.phoneNumber || undefined,
      address:     v.address     || undefined,
      gender:      (v.gender     || undefined) as Gender | undefined,
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.data) this.profile.set(res.data);
        this.isEditing.set(false);
        this.toastr.success('Profile updated successfully!');
      },
      error: (err) => {
        this.saving.set(false);
        this.toastr.error(err?.error?.message ?? 'Failed to update profile.');
      },
    });
  }
}
