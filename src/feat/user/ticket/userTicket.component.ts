import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { TicketService } from '../../../shared/service/ticket.service';

@Component({
  selector: 'app-user-ticket',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './userTicket.component.html',
})
export class UserTicketComponent {
  private readonly fb            = inject(FormBuilder);
  private readonly ticketService = inject(TicketService);
  private readonly toastr        = inject(ToastrService);

  readonly ui      = UI_CLASS_NAME;
  readonly loading = signal(false);

  readonly form = this.fb.group({
    identityCardNumber: ['', Validators.required],
    bankName:           ['', Validators.required],
    bankAccountNumber:  ['', Validators.required],  
    taxId:              ['', Validators.required],
  });

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    this.ticketService.savePromotion(this.form.value as any).subscribe({
      next: () => {
        this.loading.set(false);
        this.toastr.success('Your promotion request has been submitted.');
        this.form.reset();
      },
      error: (err) => {
        this.loading.set(false);
        this.toastr.error(err?.error?.message ?? 'Failed to submit request. Please try again.');
      },
    });
  }
}
