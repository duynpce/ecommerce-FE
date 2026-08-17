import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  TransactionResponse,
  TransactionService,
} from '../../../shared/service/transaction.service';
import {
  ProductSnapshotResponse,
  SubOrderResponse,
} from '../../../shared/service/sub-order.service.type';
import { SubOrderService } from '../../../shared/service/sub-order.service';
import { TicketService } from '../../../shared/service/ticket.service';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { SnapshotItemCardComponent } from '../../../shared/component/snapshotItemCard.component';
import { ShopResponse, ShopService } from '../../../shared/service/shop.service';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user-transaction-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, DecimalPipe, SnapshotItemCardComponent],
  templateUrl: './userTransactionDetail.component.html',
})
export class UserTransactionDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly txService = inject(TransactionService);
  private readonly subService = inject(SubOrderService);
  private readonly tickets = inject(TicketService);
  private readonly shopService = inject(ShopService);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  readonly ui = UI_CLASS_NAME;
  readonly loading = signal(true);
  readonly acting = signal<string | null>(null);
  readonly transaction = signal<TransactionResponse | null>(null);
  readonly orders = signal<SubOrderResponse[]>([]);
  readonly shopsById = signal<Record<string, ShopResponse>>({});
  readonly reviewingSnapshotId = signal<string | null>(null);
  readonly reviewRating = signal(5);
  readonly reviewComment = signal('');
  readonly submittingReview = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.txService.findById(id).subscribe({ next: (r) => this.transaction.set(r.data) });
    this.subService.byTransaction(id).subscribe({
      next: (r) => {
        this.setOrders(r.data ?? []);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.toastr.error(e?.error?.message ?? 'Failed to load order details.');
      },
    });

    interval(5000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.hasActiveDeliveryTimer()) {
          this.reload(id);
        }
      });
  }

  confirmDelivery(
    order: SubOrderResponse,
    item: ProductSnapshotResponse,
    status: 'RECEIVED' | 'NOT_RECEIVED' | 'RETURNED',
  ): void {
    this.acting.set(item.id);
    this.tickets.confirmDelivery(order.id, item.id, { status }).subscribe({
      next: () => {
        this.acting.set(null);
        this.toastr.success('Delivery response sent.');
        this.reload(order.transactionId);
      },
      error: (e) => {
        this.acting.set(null);
        this.toastr.error(e?.error?.message ?? 'Action failed.');
      },
    });
  }

  cancelItem(order: SubOrderResponse, item: ProductSnapshotResponse): void {
    if (!this.canCancel(item) || this.acting()) return;
    if (!confirm(`Cancel ${item.name}? This action cannot be undone.`)) return;

    this.acting.set(item.id);
    this.tickets.cancelSnapshot(order.id, item.id).subscribe({
      next: () => {
        this.acting.set(null);
        this.toastr.success(`${item.name} was cancelled.`);
        this.reload(order.transactionId);
      },
      error: (error) => {
        this.acting.set(null);
        this.toastr.error(error?.error?.message ?? 'Could not cancel this item.');
      },
    });
  }

  private reload(id: string): void {
    this.subService.byTransaction(id).subscribe((r) => this.setOrders(r.data ?? []));
  }

  shopName(shopId: string): string {
    return this.shopsById()[shopId]?.name ?? 'Loading shop…';
  }

  private setOrders(orders: SubOrderResponse[]): void {
    this.orders.set(orders);
    const loadedShops = this.shopsById();
    const shopIds = [...new Set(orders.map((order) => order.shopId))];

    for (const shopId of shopIds) {
      if (loadedShops[shopId]) continue;

      this.shopService.findById(shopId).subscribe({
        next: (response) => {
          if (!response.data) return;
          this.shopsById.update((shops) => ({ ...shops, [shopId]: response.data }));
        },
        error: () => {
          this.toastr.warning('A shop name could not be loaded.');
        },
      });
    }
  }

  canConfirmDelivery(item: ProductSnapshotResponse): boolean {
    return item.status === 'DELIVERED_AWAITING_CONFIRMATION';
  }

  canCancel(item: ProductSnapshotResponse): boolean {
    return item.status === 'PENDING' || item.status === 'PACKING';
  }

  canReview(item: ProductSnapshotResponse): boolean {
    return item.status === 'RECEIVED' && !item.isReviewed;
  }

  private hasActiveDeliveryTimer(): boolean {
    return this.orders().some((order) =>
      order.items.some(
        (item) => item.status === 'DELIVERING' || item.status === 'DELIVERED_AWAITING_CONFIRMATION',
      ),
    );
  }

  startReview(item: ProductSnapshotResponse): void {
    this.reviewingSnapshotId.set(item.id);
    this.reviewRating.set(5);
    this.reviewComment.set('');
  }

  cancelReview(): void {
    this.reviewingSnapshotId.set(null);
  }

  updateReviewComment(comment: string): void {
    this.reviewComment.set(comment);
  }

  submitReview(order: SubOrderResponse, item: ProductSnapshotResponse): void {
    if (!this.canReview(item) || this.submittingReview()) return;

    this.submittingReview.set(true);
    this.tickets
      .createProductReview(order.id, {
        productId: item.productId,
        transactionId: order.transactionId,
        snapshotId: item.id,
        rating: this.reviewRating(),
        comment: this.reviewComment().trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.submittingReview.set(false);
          this.reviewingSnapshotId.set(null);
          this.toastr.success(`${item.name} was reviewed.`);
          this.reload(order.transactionId);
        },
        error: (error) => {
          this.submittingReview.set(false);
          this.toastr.error(error?.error?.message ?? 'Could not submit the review.');
        },
      });
  }
}
