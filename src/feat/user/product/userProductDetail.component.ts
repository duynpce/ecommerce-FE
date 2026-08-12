import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ProductService,
  ProductResponse,
  ProductCategory,
} from '../../../shared/service/product.service';
import { ShopService, ShopResponse } from '../../../shared/service/shop.service';
import { ToastrService } from 'ngx-toastr';
import { TransactionService } from '../../../shared/service/transaction.service';
import { ProductReviewService, ProductReviewResponse } from '../../../shared/service/product-review.service';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { DecimalPipe, KeyValuePipe, DatePipe, SlicePipe } from '@angular/common';
import { PaginationBarComponent } from '../../../shared/component/paginationBar.component';

@Component({
  selector: 'app-user-product-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, KeyValuePipe, DecimalPipe, DatePipe, RouterLink, SlicePipe, PaginationBarComponent],
  templateUrl: './userProductDetail.component.html',
})
export class UserProductDetailComponent implements OnInit {
  private readonly route              = inject(ActivatedRoute);
  private readonly router             = inject(Router);
  private readonly fb                 = inject(FormBuilder);
  private readonly productService     = inject(ProductService);
  private readonly shopService        = inject(ShopService);
  private readonly transactionService = inject(TransactionService);
  private readonly reviewService      = inject(ProductReviewService);
  private readonly toastr             = inject(ToastrService);

  readonly ui            = UI_CLASS_NAME;
  readonly loading       = signal(false);
  readonly saving        = signal(false);
  readonly deleting      = signal(false);
  readonly buying        = signal(false);
  readonly loadingShop   = signal(false);
  readonly loadingReviews = signal(false);
  readonly isContributor = signal(false);
  readonly product       = signal<ProductResponse | null>(null);
  readonly shop          = signal<ShopResponse | null>(null);
  readonly reviews       = signal<ProductReviewResponse[]>([]);
  readonly editMode      = signal(false);
  readonly preview       = signal<string | null>(null);
  selectedFiles: File[]  = [];
  previews               = signal<string[]>([]);

  readonly reviewPage     = signal(0);
  readonly reviewPageSize = 5;

  readonly pagedReviews = computed(() => {
    const start = this.reviewPage() * this.reviewPageSize;
    return this.reviews().slice(start, start + this.reviewPageSize);
  });

  readonly reviewTotalPages = computed(() =>
    Math.ceil(this.reviews().length / this.reviewPageSize),
  );

  readonly stars = [1, 2, 3, 4, 5];

  readonly categories: ProductCategory[] = [
    'ELECTRONICS', 'CLOTHING', 'BOOKS',
    'HOME_AND_KITCHEN', 'BEAUTY_AND_HEALTH', 'MEDICALS', 'ELSE',
  ];

  readonly attributeRows = signal<{ key: string; value: string }[]>([]);

  readonly editForm = this.fb.group({
    name:     ['', Validators.required],
    price:    [null as number | null, [Validators.required, Validators.min(0)]],
    quantity: [null as number | null, [Validators.required, Validators.min(0)]],
    category: ['' as ProductCategory | '', Validators.required],
  });

  readonly buyForm = this.fb.group({
    quantity: [1, [Validators.required, Validators.min(1)]],
  });

  private productId!: string;

  ngOnInit(): void {
    this.checkContributorRole();
    this.productId = this.route.snapshot.paramMap.get('id')!;
    this.fetchProduct();
  }

  private checkContributorRole(): void {
    try {
      const raw = localStorage.getItem('roles');
      const roles = raw ? JSON.parse(raw) : [];
      this.isContributor.set(Array.isArray(roles) && roles.includes('CONTRIBUTOR'));
    } catch {
      this.isContributor.set(false);
    }
  }

  fetchProduct(): void {
    this.loading.set(true);
    this.productService.findById(this.productId).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.product.set(res.data);
        this.patchEditForm(res.data);
        if (res.data?.contributorId) {
          this.fetchShop(res.data.shopId);
        }
        this.fetchReviews();
      },
      error: (err) => {
        this.loading.set(false);
        this.toastr.error(err?.error?.message ?? 'Failed to load product.');
        this.router.navigate(['/user/products']);
      },
    });
  }

  /** Fetch the shop that owns this product */
  private fetchShop(shopId: string): void {
    this.loadingShop.set(true);
    this.shopService.findById(shopId).subscribe({
      next: (res) => {
        this.loadingShop.set(false);
        this.shop.set(res.data ?? null);
      },
      error: () => {
        this.loadingShop.set(false);
      },
    });
  }

  fetchReviews(): void {
    this.loadingReviews.set(true);
    this.reviewService.findAllByProductId(this.productId).subscribe({
      next: (res) => {
        this.loadingReviews.set(false);
        this.reviews.set(res.data ?? []);
        this.reviewPage.set(0);
      },
      error: () => {
        this.loadingReviews.set(false);
      },
    });
  }

  viewShopDetail(shopId: string): void {
    this.router.navigate(['/user/shops', shopId]);
  }

  patchEditForm(p: ProductResponse): void {
    this.editForm.patchValue({
      name:     p.name,
      price:    p.price,
      quantity: p.quantity,
      category: p.category,
    });
    const attrs = p.attributes ?? {};
    this.attributeRows.set(
      Object.entries(attrs).map(([key, value]) => ({ key, value })),
    );
  }

  toggleEdit(): void {
    this.editMode.update((v) => !v);
    if (!this.editMode()) {
      const p = this.product();
      if (p) this.patchEditForm(p);
    }
  }

  isFieldInvalid(field: string): boolean {
    const c = this.editForm.get(field);
    return !!(c?.invalid && c?.touched);
  }


  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    this.selectedFiles = files;
    const reader = new FileReader();
    reader.onload = () => this.preview.set(reader.result as string);
    reader.readAsDataURL(files[0]);
    const allPreviews: string[] = [];
    files.forEach((file, i) => {
      const r = new FileReader();
      r.onload = () => { allPreviews[i] = r.result as string; this.previews.set([...allPreviews]); };
      r.readAsDataURL(file);
    });
  }

  addAttribute(): void {
    this.attributeRows.update((rows) => [...rows, { key: '', value: '' }]);
  }

  removeAttribute(index: number): void {
    this.attributeRows.update((rows) => rows.filter((_, i) => i !== index));
  }

  updateAttributeKey(index: number, key: string): void {
    this.attributeRows.update((rows) =>
      rows.map((r, i) => (i === index ? { ...r, key } : r)),
    );
  }

  updateAttributeValue(index: number, value: string): void {
    this.attributeRows.update((rows) =>
      rows.map((r, i) => (i === index ? { ...r, value } : r)),
    );
  }

  labelForCategory(cat: string): string {
    return cat.replace(/_/g, ' ');
  }

  onSave(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const attrs: Record<string, string> = {};
    for (const row of this.attributeRows()) {
      if (row.key.trim()) attrs[row.key.trim()] = row.value;
    }

    this.saving.set(true);
    this.productService
      .update(this.productId, {
        id:         this.productId,
        imgs:       this.selectedFiles.length ? this.selectedFiles : undefined,
        name:       this.editForm.value.name!,
        price:      this.editForm.value.price!,
        quantity:   this.editForm.value.quantity!,
        category:   this.editForm.value.category as ProductCategory,
        attributes: Object.keys(attrs).length ? attrs : undefined,
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.product.set(res.data);
          this.editMode.set(false);
          this.selectedFiles = [];
          this.toastr.success('Product updated.');
        },
        error: (err) => {
          this.saving.set(false);
          this.toastr.error(err?.error?.message ?? 'Failed to update product.');
        },
      });
  }

  onDelete(): void {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    this.deleting.set(true);
    this.productService.delete(this.productId).subscribe({
      next: () => {
        this.deleting.set(false);
        this.toastr.success('Product deleted.');
        this.router.navigate(['/user/products']);
      },
      error: (err) => {
        this.deleting.set(false);
        this.toastr.error(err?.error?.message ?? 'Failed to delete product.');
      },
    });
  }

  onBuy(): void {
    if (this.buyForm.invalid) {
      this.buyForm.markAllAsTouched();
      return;
    }
    const p = this.product()!;
    this.buying.set(true);
    this.transactionService
      .create({
        productId: p.id,
        quantity:  this.buyForm.value.quantity!,
        price:     p.price,
      })
      .subscribe({
        next: () => {
          this.buying.set(false);
          this.toastr.success('Purchase successful!');
          this.fetchProduct();
        },
        error: (err) => {
          this.buying.set(false);
          this.toastr.error(err?.error?.message ?? 'Purchase failed.');
        },
      });
  }

  /** Total star count summed for bar widths */
  totalReviewCount(p: ProductResponse): number {
    return (p.oneStarRatingCount ?? 0)
      + (p.twoStarRatingCount ?? 0)
      + (p.threeStarRatingCount ?? 0)
      + (p.fourStarRatingCount ?? 0)
      + (p.fiveStarRatingCount ?? 0);
  }

  starCountFor(p: ProductResponse, star: number): number {
    const map: Record<number, number> = {
      1: p.oneStarRatingCount ?? 0,
      2: p.twoStarRatingCount ?? 0,
      3: p.threeStarRatingCount ?? 0,
      4: p.fourStarRatingCount ?? 0,
      5: p.fiveStarRatingCount ?? 0,
    };
    return map[star] ?? 0;
  }
}
