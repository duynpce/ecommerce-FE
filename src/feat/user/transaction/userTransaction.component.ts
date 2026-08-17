import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import {
  TransactionResponse,
  TransactionService,
  TransactionStatus,
} from '../../../shared/service/transaction.service';
import { SubOrderService } from '../../../shared/service/sub-order.service';
import { SubOrderResponse } from '../../../shared/service/sub-order.service.type';
import { SnapshotItemCardComponent } from '../../../shared/component/snapshotItemCard.component';
import { PaginationBarComponent } from '../../../shared/component/paginationBar.component';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';

interface TransactionView extends TransactionResponse {
  subOrders: SubOrderResponse[];
}

@Component({
  selector: 'app-user-transaction',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, RouterLink, SnapshotItemCardComponent, PaginationBarComponent],
  templateUrl: './userTransaction.component.html',
})
export class UserTransactionComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly subOrderService = inject(SubOrderService);
  private readonly toastr = inject(ToastrService);

  readonly ui = UI_CLASS_NAME;
  readonly loading = signal(true);
  readonly transactions = signal<TransactionView[]>([]);
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  readonly pageSize = 5;

  ngOnInit(): void {
    this.load(0);
  }

  load(page: number): void {
    this.loading.set(true);
    this.transactionService.search({ page, limit: this.pageSize }).subscribe({
      next: (response) => {
        const transactions = response.data ?? [];
        this.currentPage.set(response.metaData?.currentPage ?? page);
        this.totalPages.set(response.metaData?.totalPages ?? (transactions.length ? 1 : 0));

        if (!transactions.length) {
          this.transactions.set([]);
          this.loading.set(false);
          return;
        }

        const requests = transactions.map((transaction) =>
          this.subOrderService
            .byTransaction(transaction.id)
            .pipe(catchError(() => of({ data: [] as SubOrderResponse[] }))),
        );

        forkJoin(requests).subscribe({
          next: (subOrderResponses) => {
            this.transactions.set(
              transactions.map((transaction, index) => ({
                ...transaction,
                subOrders: subOrderResponses[index].data ?? [],
              })),
            );
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
            this.toastr.error('Transactions loaded, but their item details could not be loaded.');
          },
        });
      },
      error: (error) => {
        this.loading.set(false);
        this.toastr.error(error?.error?.message ?? 'Failed to load transactions.');
      },
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.load(page);
  }

  itemCount(transaction: TransactionView): number {
    return transaction.subOrders.reduce(
      (total, subOrder) => total + subOrder.items.reduce((sum, item) => sum + item.quantity, 0),
      0,
    );
  }

  statusClass(status: TransactionStatus): string {
    const classes: Partial<Record<TransactionStatus, string>> = {
      PENDING: 'bg-amber-100 text-amber-700',
      COMPLETED: 'bg-emerald-100 text-emerald-700',
      REJECTED: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-slate-200 text-slate-700',
      RETURNED: 'bg-orange-100 text-orange-700',
      PARTIALLY_RETURNED: 'bg-orange-100 text-orange-700',
      FAILED: 'bg-red-100 text-red-700',
    };
    return classes[status] ?? 'bg-slate-100 text-slate-700';
  }
}
