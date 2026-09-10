import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  ProductService,
  ProductCategory,
} from '../../../shared/service/product.service';
import { ShopService, ShopResponse } from '../../../shared/service/shop.service';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';

@Component({
  selector: 'app-contributor-product-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './contributorProductCreate.component.html',
})
export class contributorProductCreateComponent implements OnInit {
  private readonly fb             = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly shopService    = inject(ShopService);
  private readonly toastr         = inject(ToastrService);
  private readonly router         = inject(Router);

  readonly ui            = UI_CLASS_NAME;
  readonly loading       = signal(false);
  readonly loadingShop   = signal(false);
  readonly isContributor = signal(false);
  readonly previews      = signal<string[]>([]);

  /** All shops owned by this contributor */
  readonly shops         = signal<ShopResponse[]>([]);
  /** The currently selected shop */
  readonly shop          = signal<ShopResponse | null>(null);

  selectedFiles: File[]  = [];

  readonly categories: ProductCategory[] = [
    'ELECTRONICS', 'CLOTHING', 'BOOKS',
    'HOME_AND_KITCHEN', 'BEAUTY_AND_HEALTH', 'MEDICALS', 'ELSE',
  ];

  readonly attributeRows = signal<{ key: string; value: string }[]>([]);

  readonly form = this.fb.group({
    name:        ['', [Validators.required, Validators.minLength(1)]],
    description: [''],
    price:       [null as number | null, [Validators.required, Validators.min(0)]],
    quantity:    [null as number | null, [Validators.required, Validators.min(0)]],
    category:    ['' as ProductCategory | '', Validators.required],
  });

  ngOnInit(): void {
    this.checkContributorRole();
    this.loadShops();
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

  loadShops(): void {
    this.loadingShop.set(true);
    this.shopService.getMyShops().subscribe({
      next: (res) => {
        this.loadingShop.set(false);
        const list = res.data ?? [];
        this.shops.set(list);
        // Default: select the first shop (contributor can change via dropdown)
        if (list.length > 0) {
          this.shop.set(list[0]);
        }
      },
      error: () => {
        this.loadingShop.set(false);
      },
    });
  }

  /** Called when the contributor picks a different shop from the selector */
  onShopSelect(shopId: string): void {
    const found = this.shops().find((s) => s.id === shopId) ?? null;
    this.shop.set(found);
  }

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onFilesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files  = Array.from(input.files ?? []);
    if (!files.length) return;
    this.selectedFiles = files;
    const results: string[] = new Array(files.length).fill('');
    let loaded = 0;
    files.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = () => {
        results[i] = reader.result as string;
        loaded++;
        if (loaded === files.length) this.previews.set([...results]);
      };
      reader.readAsDataURL(file);
    });
  }

  removePreview(index: number): void {
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
    this.previews.update((p) => p.filter((_, i) => i !== index));
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

  onSubmit(): void {
    if (!this.isContributor()) {
      this.toastr.error('You need the CONTRIBUTOR role to add products.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.selectedFiles.length) {
      this.toastr.warning('Please select at least one product image.');
      return;
    }
    const currentShop = this.shop();
    if (!currentShop) {
      this.toastr.error('No shop selected. Please create your shop first in "My Shop".');
      return;
    }

    const attrs: Record<string, string> = {};
    for (const row of this.attributeRows()) {
      if (row.key.trim()) attrs[row.key.trim()] = row.value;
    }

    this.loading.set(true);
    this.productService
      .create({
        shopId:      currentShop.id,
        imgs:        this.selectedFiles,
        name:        this.form.value.name!,
        description: this.form.value.description || undefined,
        price:       this.form.value.price!,
        quantity:    this.form.value.quantity!,
        category:    this.form.value.category as ProductCategory,
        attributes:  Object.keys(attrs).length ? attrs : undefined,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toastr.success('Product created successfully.');
          this.router.navigate(['/contributor/my-products']);
        },
        error: (err) => {
          this.loading.set(false);
          this.toastr.error(err?.error?.message ?? 'Failed to create product.');
        },
      });
  }
}
