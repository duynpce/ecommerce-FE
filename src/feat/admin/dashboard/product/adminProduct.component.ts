import { DecimalPipe, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PaginationBarComponent } from '../../../../shared/component/paginationBar.component';
import { UI_CLASS_NAME } from '../../../../shared/constant/className.constant';
import {
  ProductCategory,
  ProductResponse,
  ProductService,
} from '../../../../shared/service/product.service';
import { ShopService } from '../../../../shared/service/shop.service';

@Component({
  selector: 'app-admin-product',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, KeyValuePipe, PaginationBarComponent],
  templateUrl: './adminProduct.component.html',
})
export class AdminProductComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly shopService = inject(ShopService);
  private readonly toastr = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly requestedShopIds = new Set<string>();

  readonly ui = UI_CLASS_NAME;
  readonly loading = signal(true);
  readonly products = signal<ProductResponse[]>([]);
  readonly shopNames = signal<Record<string, string>>({});
  readonly page = signal(0);
  readonly pageSize = 8;
  readonly totalPages = signal(0);
  readonly totalItems = signal(0);
  readonly selectedProduct = signal<ProductResponse | null>(null);
  readonly selectedImageIndex = signal(0);
  readonly unavailableImages = signal<ReadonlySet<string>>(new Set());
  readonly actingProductId = signal<string | null>(null);

  readonly selectedImages = computed(() => {
    const images = this.normalizeImageUrls(this.selectedProduct()?.imgUrls);
    const unavailableImages = this.unavailableImages();
    return images.filter((imageUrl) => !unavailableImages.has(imageUrl));
  });

  readonly selectedImage = computed(() => {
    const images = this.selectedImages();
    return images[this.selectedImageIndex()] ?? images[0] ?? null;
  });

  readonly categories: ProductCategory[] = [
    'ELECTRONICS',
    'CLOTHING',
    'BOOKS',
    'HOME_AND_KITCHEN',
    'BEAUTY_AND_HEALTH',
    'MEDICALS',
    'ELSE',
  ];

  readonly filterForm = this.fb.nonNullable.group({
    name: [''],
    category: ['' as ProductCategory | ''],
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    const name = this.filterForm.controls.name.value.trim();
    const category = this.filterForm.controls.category.value;
    this.loading.set(true);

    this.productService
      .getPendingProducts({
        page: this.page(),
        limit: this.pageSize,
        name: name || undefined,
        category: category || undefined,
      })
      .subscribe({
        next: (response) => {
          const products = response.data ?? [];
          this.products.set(products);
          this.totalPages.set(response.metaData?.totalPages ?? (products.length ? 1 : 0));
          this.totalItems.set(response.metaData?.totalItems ?? products.length);
          this.loadShopNames(products);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.toastr.error(error?.error?.message ?? 'Could not load pending products.');
        },
      });
  }

  applyFilters(): void {
    this.page.set(0);
    this.loadProducts();
  }

  clearFilters(): void {
    this.filterForm.reset({ name: '', category: '' });
    this.page.set(0);
    this.loadProducts();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.page()) return;
    this.page.set(page);
    this.loadProducts();
  }

  openReview(product: ProductResponse): void {
    this.selectedProduct.set(product);
    this.selectedImageIndex.set(0);
    this.unavailableImages.set(new Set());
  }

  closeReview(): void {
    if (this.actingProductId()) return;
    this.selectedProduct.set(null);
    this.selectedImageIndex.set(0);
    this.unavailableImages.set(new Set());
  }

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  previousImage(): void {
    this.moveImage(-1);
  }

  nextImage(): void {
    this.moveImage(1);
  }

  markImageUnavailable(imageUrl: string): void {
    this.unavailableImages.update((images) => new Set([...images, imageUrl]));
    this.selectedImageIndex.set(0);
  }

  censor(product: ProductResponse, isApproved: boolean): void {
    if (this.actingProductId()) return;

    const action = isApproved ? 'approve' : 'reject';
    if (!confirm(`${action[0].toUpperCase()}${action.slice(1)} “${product.name}”?`)) return;

    this.actingProductId.set(product.id);
    this.productService.censor(product.id, isApproved).subscribe({
      next: () => {
        this.actingProductId.set(null);
        this.selectedProduct.set(null);
        if (this.products().length === 1 && this.page() > 0) {
          this.page.update((page) => page - 1);
        }
        this.toastr.success(`Product ${isApproved ? 'approved' : 'rejected'}.`);
        this.loadProducts();
      },
      error: (error) => {
        this.actingProductId.set(null);
        this.toastr.error(error?.error?.message ?? `Could not ${action} this product.`);
      },
    });
  }

  shopName(shopId: string): string {
    return this.shopNames()[shopId] ?? 'Loading shop…';
  }

  categoryLabel(category: string): string {
    return category.replaceAll('_', ' ');
  }

  productImages(product: ProductResponse): string[] {
    return this.normalizeImageUrls(product.imgUrls);
  }

  private moveImage(offset: number): void {
    const images = this.selectedImages();
    if (images.length < 2) return;
    this.selectedImageIndex.update((index) => (index + offset + images.length) % images.length);
  }

  private normalizeImageUrls(imgUrls: unknown): string[] {
    if (!Array.isArray(imgUrls)) return [];

    const validUrls = imgUrls
      .filter((imageUrl): imageUrl is string => typeof imageUrl === 'string')
      .map((imageUrl) => imageUrl.trim())
      .filter(Boolean);

    return [...new Set(validUrls)];
  }

  private loadShopNames(products: ProductResponse[]): void {
    for (const shopId of new Set(products.map((product) => product.shopId))) {
      if (this.requestedShopIds.has(shopId)) continue;
      this.requestedShopIds.add(shopId);

      this.shopService.findById(shopId).subscribe({
        next: (response) => {
          const shopName = response.data?.name ?? 'Shop unavailable';
          this.shopNames.update((names) => ({ ...names, [shopId]: shopName }));
        },
        error: () => {
          this.shopNames.update((names) => ({ ...names, [shopId]: 'Shop unavailable' }));
        },
      });
    }
  }
}
