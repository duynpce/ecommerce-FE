import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { TicketService } from '../../../shared/service/ticket.service';
import {
  SavePromotionRequest,
  SaveShipperApplicationRequest,
  VehicleType,
} from '../../../shared/service/ticket.service.type';

@Component({
  selector: 'app-user-ticket',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './userTicket.component.html',
})
export class UserTicketComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ticketService = inject(TicketService);
  private readonly toastr = inject(ToastrService);
  private readonly roles = signal<string[]>(this.readRoles());

  readonly ui = UI_CLASS_NAME;
  readonly contributorLoading = signal(false);
  readonly shipperLoading = signal(false);
  readonly isContributor = computed(() => this.roles().includes('CONTRIBUTOR'));
  readonly isShipper = computed(() => this.roles().includes('SHIPPER'));
  readonly vehicleTypes: VehicleType[] = ['MOTORBIKE', 'CAR', 'VAN', 'TRUCK'];

  readonly contributorForm = this.fb.nonNullable.group({
    identityCardNumber: ['', Validators.required],
    bankName: ['', Validators.required],
    bankAccountNumber: ['', Validators.required],
    taxId: ['', Validators.required],
  });

  readonly shipperForm = this.fb.nonNullable.group({
    identityCardNumber: ['', Validators.required],
    driverLicenseNumber: ['', Validators.required],
    vehicleType: ['MOTORBIKE' as VehicleType, Validators.required],
    vehiclePlateNumber: ['', Validators.required],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9][0-9\s-]{7,14}$/)]],
  });

  isFieldInvalid(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  submitContributor(): void {
    if (this.contributorForm.invalid) {
      this.contributorForm.markAllAsTouched();
      return;
    }
    this.contributorLoading.set(true);
    this.ticketService.savePromotion(this.contributorForm.getRawValue() as SavePromotionRequest).subscribe({
      next: () => {
        this.contributorLoading.set(false);
        this.toastr.success('Your contributor application has been submitted.');
        this.contributorForm.reset();
      },
      error: (error) => {
        this.contributorLoading.set(false);
        this.toastr.error(error?.error?.message ?? 'Failed to submit contributor application.');
      },
    });
  }

  submitShipper(): void {
    if (this.shipperForm.invalid) {
      this.shipperForm.markAllAsTouched();
      return;
    }
    this.shipperLoading.set(true);
    this.ticketService
      .saveShipperApplication(this.shipperForm.getRawValue() as SaveShipperApplicationRequest)
      .subscribe({
        next: () => {
          this.shipperLoading.set(false);
          this.toastr.success('Your delivery-person application has been submitted.');
          this.shipperForm.reset({ vehicleType: 'MOTORBIKE' });
        },
        error: (error) => {
          this.shipperLoading.set(false);
          this.toastr.error(error?.error?.message ?? 'Failed to submit shipper application.');
        },
      });
  }

  vehicleLabel(type: VehicleType): string {
    return type.charAt(0) + type.slice(1).toLowerCase();
  }

  private readRoles(): string[] {
    try {
      return JSON.parse(localStorage.getItem('roles') ?? '[]');
    } catch {
      return [];
    }
  }
}
