import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShopService, ShopResponse, AddressResponse } from '../../../shared/service/shop.service';
import { ProductService, ProductResponse } from '../../../shared/service/product.service';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { DecimalPipe, DatePipe, Location } from '@angular/common';  
import { PaginationBarComponent } from '../../../shared/component/paginationBar.component';

@Component({
  selector: 'app-user-shop-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, DatePipe, PaginationBarComponent],
  templateUrl: './userShopDetail.component.html',
})
export class UserShopDetailComponent implements OnInit {
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly location       = inject(Location);
  private readonly shopService    = inject(ShopService);
  private readonly productService = inject(ProductService);
  private readonly toastr         = inject(ToastrService);

  readonly ui              = UI_CLASS_NAME;
  readonly loading         = signal(false);
  readonly loadingProducts = signal(false);
  readonly shop            = signal<ShopResponse | null>(null);
  readonly products        = signal<ProductResponse[]>([]);
  readonly totalPages      = signal(0);
  readonly currentPage     = signal(0);

  private shopId!: string;

  ngOnInit(): void {
    this.shopId = this.route.snapshot.paramMap.get('id')!;
    this.fetchShop();
  }

  fetchShop(): void {
    this.loading.set(true);
    this.shopService.findById(this.shopId).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.shop.set(res.data ?? null);
        if (res.data) {
          this.loadProducts(0);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.toastr.error(err?.error?.message ?? 'Failed to load shop.');
      },
    });
  }

  loadProducts(page: number): void {
    this.loadingProducts.set(true);
    this.productService.search({
      shopId: this.shopId,
      page,
      limit: 12,
    }).subscribe({
      next: (res) => {
        this.loadingProducts.set(false);
        this.products.set(res.data ?? []);
        this.totalPages.set(res.metaData?.totalPages ?? 0);
        this.currentPage.set(page);
      },
      error: () => {
        this.loadingProducts.set(false);
      },
    });
  }

  viewProduct(id: string): void {
    this.router.navigate(['/user/products', id]);
  }

  goBack(): void {
    this.location.back();
  }

  labelForCategory(cat: string): string {
    return cat.replace(/_/g, ' ');
  }

  hasAddress(shop: ShopResponse): boolean {
    const a = shop.pickUpAddress;
    if (!a || typeof a !== 'object') return false;
    return !!(a.street || a.ward || a.district || a.city || a.country);
  }

   formatAddress(shop: ShopResponse): string {
    const a = shop.pickUpAddress as AddressResponse;
    const parts = [a.street, a.ward, a.district, a.city, a.country].filter(Boolean).join(', ');
    return a.zipCode ? `${parts} — ${a.zipCode}` : parts;
  }

}
