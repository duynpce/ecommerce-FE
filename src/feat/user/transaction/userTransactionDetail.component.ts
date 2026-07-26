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
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-user-transaction-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports :[ReactiveFormsModule, DecimalPipe, DatePipe, NgClass],
  templateUrl: './userTransactionDetail.component.html',
})
export class UserTransactionDetailComponent implements OnInit {
  private readonly route              = inject(ActivatedRoute);
  private readonly router             = inject(Router);
  private readonly fb                 = inject(FormBuilder);
  private readonly transactionService = inject(TransactionService);
  private readonly toastr             = inject(ToastrService);

  readonly ui          = UI_CLASS_NAME;
  readonly loading     = signal(false);
  readonly saving      = signal(false);
  readonly deleting    = signal(false);
  readonly transaction = signal<TransactionResponse | null>(null);
  readonly editMode    = signal(false);

  readonly statuses: TransactionStatus[] = ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED'];

  readonly editForm = this.fb.group({
    quantity: [null as number | null, [Validators.min(1)]],
    price:    [null as number | null, [Validators.min(0)]],
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

  toggleEdit(): void {
    this.editMode.update((v) => !v);
  }

  isFieldInvalid(field: string): boolean {
    const c = this.editForm.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onSave(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const f = this.editForm.value;
    this.transactionService
      .update(this.txId, {
        id:       this.txId,
        quantity: f.quantity ?? undefined,
        price:    f.price    ?? undefined,
        status:   (f.status  || undefined) as TransactionStatus | undefined,
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.transaction.set(res.data);
          this.editMode.set(false);
          this.toastr.success('Transaction updated.');
        },
        error: (err) => {
          this.saving.set(false);
          this.toastr.error(err?.error?.message ?? 'Failed to update transaction.');
        },
      });
  }

  onDelete(): void {
    if (!confirm('Delete this transaction? This cannot be undone.')) return;
    this.deleting.set(true);
    this.transactionService.delete(this.txId).subscribe({
      next: () => {
        this.deleting.set(false);
        this.toastr.success('Transaction deleted.');
        this.router.navigate(['/user/transactions']);
      },
      error: (err) => {
        this.deleting.set(false);
        this.toastr.error(err?.error?.message ?? 'Failed to delete transaction.');
      },
    });
  }

  statusClass(status: TransactionStatus): string {
    const map: Record<TransactionStatus, string> = {
      PENDING:   'bg-amber-100 text-amber-700',
      COMPLETED: 'bg-emerald-100 text-emerald-700',
      FAILED:    'bg-red-100 text-red-700',
      REVERSED:  'bg-slate-100 text-slate-600',
    };
    return map[status] ?? 'bg-slate-100 text-slate-600';
  }
}
