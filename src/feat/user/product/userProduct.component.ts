import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, ProductResponse, ProductCategory } from '../../../shared/service/product.service';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { DecimalPipe } from '@angular/common';
import { PaginationBarComponent } from '../../../shared/component/paginationBar.component';

@Component({
  selector: 'app-user-product',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DecimalPipe, PaginationBarComponent],
  templateUrl: './userProduct.component.html',
})
export class UserProductComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly toastr         = inject(ToastrService);
  private readonly router         = inject(Router);
  private readonly fb             = inject(FormBuilder);

  readonly ui          = UI_CLASS_NAME;
  readonly loading     = signal(false);
  readonly products    = signal<ProductResponse[]>([]);
  readonly totalPages  = signal(0);
  readonly currentPage = signal(0);

  readonly categories: ProductCategory[] = [
    'ELECTRONICS', 'CLOTHING', 'BOOKS',
    'HOME_AND_KITCHEN', 'BEAUTY_AND_HEALTH', 'MEDICALS', 'ELSE',
  ];

  readonly filterForm = this.fb.group({
    name:        [''],
    category:    ['' as ProductCategory | ''],
    minPrice:    [null as number | null],
    maxPrice:    [null as number | null],
    createdFrom: [''],
    createdTo:   [''],
  });

  ngOnInit(): void {
    this.load(0);
  }

  load(page: number): void {
    this.loading.set(true);
    const f = this.filterForm.value;

    this.productService.search({
      page,
      limit: 12,
      name:        f.name        || undefined,
      category:    (f.category   || undefined) as ProductCategory | undefined,
      minPrice:    f.minPrice    ?? undefined,
      maxPrice:    f.maxPrice    ?? undefined,
      createdFrom: f.createdFrom || undefined,
      createdTo:   f.createdTo   || undefined,
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.products.set(res.data ?? []);
        // FIX: Use 0 as fallback (not 1) so the pagination bar is
        // hidden when there are truly no pages, and visible for 1+ pages.
        this.totalPages.set(res.metaData?.totalPages ?? 0);
        this.currentPage.set(page);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastr.error(err?.error?.message ?? 'Failed to load products.');
      },
    });
  }

  onSearch(): void { this.load(0); }

  onReset(): void {
    this.filterForm.reset();
    this.load(0);
  }

  labelForCategory(cat: string): string {
    return cat.replace(/_/g, ' ');
  }

  viewDetail(id: string): void {
    this.router.navigate(['/user/products', id]);
  }
}
