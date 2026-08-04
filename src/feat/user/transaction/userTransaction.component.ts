import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  TransactionService,
  TransactionResponse,
  TransactionStatus,
} from '../../../shared/service/transaction.service';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-user-transaction',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports :[ReactiveFormsModule, DecimalPipe, DatePipe, NgClass],
  templateUrl: './userTransaction.component.html',
})
export class UserTransactionComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly toastr             = inject(ToastrService);
  private readonly router             = inject(Router);
  private readonly fb                 = inject(FormBuilder);

  readonly ui           = UI_CLASS_NAME;
  readonly loading      = signal(false);
  readonly transactions = signal<TransactionResponse[]>([]);
  readonly totalPages   = signal(0);
  readonly currentPage  = signal(0);

  readonly statuses: TransactionStatus[] = ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED'];

  readonly filterForm = this.fb.group({
    productId:   [''],
    status:      ['' as TransactionStatus | ''],
    createdFrom: [''],
    createdTo:   [''],
  });

  ngOnInit(): void {
    this.load(0);
  }

  load(page: number): void {
    this.loading.set(true);
    const f = this.filterForm.value;

    this.transactionService.search({
      page,
      limit: 10,
      productId:   f.productId   || undefined,
      status:      (f.status     || undefined) as TransactionStatus | undefined,
      createdFrom: f.createdFrom || undefined,
      createdTo:   f.createdTo   || undefined,
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.transactions.set(res.data ?? []);
        this.totalPages.set(res.metaData?.totalPages ?? 1);
        this.currentPage.set(page);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastr.error(err?.error?.message ?? 'Failed to load transactions.');
      },
    });
  }

  onSearch(): void { this.load(0); }
  onReset(): void { this.filterForm.reset(); this.load(0); }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.load(page);
  }

  viewDetail(id: string): void {
    this.router.navigate(['/user/transactions', id]);
  }

  statusClass(status: TransactionStatus): string {
     const map: Partial<Record<TransactionStatus, string>> = {
      PENDING:    'bg-amber-100 text-amber-700',
      PACKING:    'bg-blue-100 text-blue-700',
      DELIVERING: 'bg-violet-100 text-violet-700',
      COMPLETED:  'bg-emerald-100 text-emerald-700',
      REJECTED:   'bg-red-100 text-red-700',
      RETURNED:   'bg-slate-100 text-slate-600',
    };
    
    return map[status] ?? 'bg-slate-100 text-slate-600';
  }
}
