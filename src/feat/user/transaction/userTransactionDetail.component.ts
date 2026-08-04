import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  TransactionService,
  TransactionResponse,
  TransactionStatus,
} from '../../../shared/service/transaction.service';
import { TicketService } from '../../../shared/service/ticket.service';
import { DeliveryStatus } from '../../../shared/service/ticket.service.type';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-user-transaction-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DecimalPipe, DatePipe, NgClass],
  templateUrl: './userTransactionDetail.component.html',
})
export class UserTransactionDetailComponent implements OnInit {
  private readonly route              = inject(ActivatedRoute);
  private readonly router             = inject(Router);
  private readonly fb                 = inject(FormBuilder);
  private readonly transactionService = inject(TransactionService);
  private readonly ticketService      = inject(TicketService);
  private readonly toastr             = inject(ToastrService);

  readonly ui            = UI_CLASS_NAME;
  readonly loading       = signal(false);
  readonly saving        = signal(false);
  readonly deleting      = signal(false);
  readonly confirming    = signal<DeliveryStatus | null>(null);
  readonly transaction   = signal<TransactionResponse | null>(null);
  readonly editMode      = signal(false);

  readonly editForm = this.fb.group({
    quantity: [null as number | null, [Validators.min(1)]],
    price:    [null as number | string | null, [Validators.min(0)]],
    status:   ['' as TransactionStatus | ''],
  });

  private txId!: string;

  ngOnInit(): void {
    this.txId = this.route.snapshot.paramMap.get('id')!;
    this.fetch();
  }

  fetch(): void {
    this.loading.set(true);
    this.transactionService.findById(this.txId).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.transaction.set(res.data);
        this.editForm.patchValue({
          quantity: res.data.quantity,
          price:    res.data.totalAmount,
          status:   res.data.status,
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.toastr.error(err?.error?.message ?? 'Failed to load transaction.');
        this.router.navigate(['/user/transactions']);
      },
    });
  }


  /** Called when the buyer picks a delivery outcome while status is DELIVERING. */
  onConfirmDelivery(status: DeliveryStatus): void {
    const labels: Record<DeliveryStatus, string> = {
      RECEIVED:     'Mark as received?',
      NOT_RECEIVED: 'Mark as not received?',
      RETURNED:     'Return this product? This cannot be undone.',
    };
    if (!confirm(labels[status])) return;

    this.confirming.set(status);
    this.ticketService.confirmDelivery(this.txId, { status }).subscribe({
      next: () => {
        this.confirming.set(null);
        this.toastr.success('Delivery confirmation sent.');
        this.fetch(); // refresh to reflect new status
      },
      error: (err) => {
        this.confirming.set(null);
        this.toastr.error(err?.error?.message ?? 'Failed to confirm delivery.');
      },
    });
  }

  statusClass(status: TransactionStatus): string {
    const map: Record<string, string> = {
      PENDING:    'bg-amber-100 text-amber-700',
      COMPLETED:  'bg-emerald-100 text-emerald-700',
      FAILED:     'bg-red-100 text-red-700',
      REVERSED:   'bg-slate-100 text-slate-600',
      DELIVERING: 'bg-blue-100 text-blue-700',
    };
    return map[status] ?? 'bg-slate-100 text-slate-600';
  }
}