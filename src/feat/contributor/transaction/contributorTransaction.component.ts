import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SubOrderService } from '../../../shared/service/sub-order.service';
import { SubOrderResponse, SubOrderStatus } from '../../../shared/service/sub-order.service.type';
import { ShopResponse, ShopService } from '../../../shared/service/shop.service';
import { SnapshotItemCardComponent } from '../../../shared/component/snapshotItemCard.component';
import { PaginationBarComponent } from '../../../shared/component/paginationBar.component';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';

@Component({
  selector: 'app-contributor-transaction',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, RouterLink, SnapshotItemCardComponent, PaginationBarComponent],
  templateUrl: './contributorTransaction.component.html',
})
export class ContributorTransactionComponent implements OnInit {
  private readonly subOrderService = inject(SubOrderService);
  private readonly shopService = inject(ShopService);
  private readonly toastr = inject(ToastrService);

  readonly ui = UI_CLASS_NAME;
  readonly loading = signal(true);
  readonly loadingShops = signal(true);
  readonly orders = signal<SubOrderResponse[]>([]);
  readonly shops = signal<ShopResponse[]>([]);
  readonly selectedShopId = signal('');
  readonly selectedStatus = signal<SubOrderStatus | ''>('');
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  readonly totalItems = signal(0);
  readonly pageSize = 5;
  readonly statuses: SubOrderStatus[] = [
    'PENDING',
    'COMPLETED',
    'REJECTED',
    'CANCELLED',
    'RETURNED',
    'PARTIALLY_RETURNED',
  ];

  ngOnInit(): void {
    this.loadShops();
    this.load(0);
  }

  private loadShops(): void {
    this.shopService.getMyShops().subscribe({
      next: (response) => {
        this.shops.set(response.data ?? []);
        this.loadingShops.set(false);
      },
      error: () => {
        this.loadingShops.set(false);
        this.toastr.warning('Your shops could not be loaded. All shop orders are still available.');
      },
    });
  }

  load(page: number): void {
    this.loading.set(true);
    const filter = {
      page,
      limit: this.pageSize,
      status: this.selectedStatus() || undefined,
    };
    const request = this.selectedShopId()
      ? this.subOrderService.shopSearch(this.selectedShopId(), filter)
      : this.subOrderService.contributorSearch(filter);

    request.subscribe({
      next: (response) => {
        this.orders.set(response.data ?? []);
        this.currentPage.set(response.metaData?.currentPage ?? page);
        this.totalPages.set(response.metaData?.totalPages ?? (response.data?.length ? 1 : 0));
        this.totalItems.set(response.metaData?.totalItems ?? response.data?.length ?? 0);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toastr.error(error?.error?.message ?? 'Failed to load shop orders.');
      },
    });
  }

  onShopChange(event: Event): void {
    this.selectedShopId.set((event.target as HTMLSelectElement).value);
    this.load(0);
  }

  onStatusChange(event: Event): void {
    this.selectedStatus.set((event.target as HTMLSelectElement).value as SubOrderStatus | '');
    this.load(0);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.load(page);
  }

  shopName(shopId: string): string {
    return this.shops().find((shop) => shop.id === shopId)?.name ?? `Shop ${shopId.slice(0, 8)}`;
  }
}
