import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../shared/constant/className.constant';
import { ShopService, type ShopResponse } from '../../shared/service/shop.service';
import {
  VoucherService,
  type SaveVoucherRequest,
  type VoucherApplicableCategory,
  type VoucherDiscountType,
  type VoucherResponse,
  type VoucherType,
} from '../../shared/service/voucher.service';

const CATEGORIES: VoucherApplicableCategory[] = [
  'ALL', 'ELECTRONICS', 'CLOTHING', 'BOOKS', 'HOME_AND_KITCHEN',
  'BEAUTY_AND_HEALTH', 'MEDICALS', 'ELSE',
];

@Component({
  selector: 'app-voucher-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './voucherManagement.component.html',
})
export class VoucherManagementComponent {
  private readonly fb = inject(FormBuilder);
  private readonly voucherService = inject(VoucherService);
  private readonly shopService = inject(ShopService);
  private readonly toastr = inject(ToastrService);

  readonly ui = UI_CLASS_NAME;
  readonly categories = CATEGORIES;
  readonly isAdmin = this.readRoles().some((role) => role === 'ADMIN' || role === 'SUPER_ADMIN');
  readonly title = this.isAdmin ? 'Voucher management' : 'Shop vouchers';

  readonly vouchers = signal<VoucherResponse[]>([]);
  readonly shops = signal<ShopResponse[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly selectedCategories = signal<Set<VoucherApplicableCategory>>(new Set(['ALL']));
  readonly isEditing = computed(() => this.editingId() !== null);

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', Validators.maxLength(500)],
    type: [(this.isAdmin ? 'PLATFORM' : 'SHOP') as VoucherType, Validators.required],
    shopId: [''],
    discountType: ['PERCENTAGE' as VoucherDiscountType, Validators.required],
    discountValue: [10, [Validators.required, Validators.min(0.01)]],
    minimumSpend: [0, [Validators.required, Validators.min(0)]],
    maximumDiscount: [null as number | null],
    startsAt: [this.localDateTime(new Date()), Validators.required],
    endsAt: [this.localDateTime(new Date(Date.now() + 7 * 86400000)), Validators.required],
    usageLimit: [null as number | null],
    active: [true],
  });

  constructor() {
    this.loadShops();
    this.loadVouchers();
  }

  toggleCategory(category: VoucherApplicableCategory, checked: boolean): void {
    const next = new Set(this.selectedCategories());
    if (category === 'ALL' && checked) {
      this.selectedCategories.set(new Set(['ALL']));
      return;
    }
    next.delete('ALL');
    checked ? next.add(category) : next.delete(category);
    if (next.size === 0) next.add('ALL');
    this.selectedCategories.set(next);
  }

  submit(): void {
    if (this.form.invalid || this.selectedCategories().size === 0 || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (value.type === 'SHOP' && !value.shopId) {
      this.toastr.error('Select a shop for a shop voucher.');
      return;
    }
    const body: SaveVoucherRequest = {
      code: value.code.trim().toUpperCase(),
      name: value.name.trim(),
      description: value.description.trim() || undefined,
      type: value.type,
      shopId: value.type === 'SHOP' ? value.shopId : undefined,
      discountType: value.discountType,
      discountValue: Number(value.discountValue),
      minimumSpend: Number(value.minimumSpend),
      maximumDiscount: value.maximumDiscount == null ? undefined : Number(value.maximumDiscount),
      startsAt: new Date(value.startsAt).toISOString(),
      endsAt: new Date(value.endsAt).toISOString(),
      usageLimit: value.usageLimit == null ? undefined : Number(value.usageLimit),
      active: value.active,
      applicableCategories: [...this.selectedCategories()],
    };

    this.saving.set(true);
    const request = this.editingId()
      ? this.voucherService.update(this.editingId()!, body)
      : this.voucherService.create(body);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.resetForm();
        this.loadVouchers();
      },
    });
  }

  edit(voucher: VoucherResponse): void {
    this.editingId.set(voucher.id);
    this.selectedCategories.set(new Set(voucher.applicableCategories));
    this.form.reset({
      code: voucher.code,
      name: voucher.name,
      description: voucher.description ?? '',
      type: voucher.type,
      shopId: voucher.shopId ?? '',
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      minimumSpend: voucher.minimumSpend,
      maximumDiscount: voucher.maximumDiscount ?? null,
      startsAt: this.localDateTime(new Date(voucher.startsAt)),
      endsAt: this.localDateTime(new Date(voucher.endsAt)),
      usageLimit: voucher.usageLimit ?? null,
      active: voucher.active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  remove(voucher: VoucherResponse): void {
    if (!window.confirm(`Delete voucher ${voucher.code}?`)) return;
    this.voucherService.delete(voucher.id).subscribe({
      next: () => {
        this.toastr.success('Voucher deleted successfully.');
        this.loadVouchers();
      },
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.selectedCategories.set(new Set(['ALL']));
    this.form.reset({
      code: '', name: '', description: '',
      type: this.isAdmin ? 'PLATFORM' : 'SHOP',
      shopId: this.shops()[0]?.id ?? '',
      discountType: 'PERCENTAGE', discountValue: 10, minimumSpend: 0,
      maximumDiscount: null,
      startsAt: this.localDateTime(new Date()),
      endsAt: this.localDateTime(new Date(Date.now() + 7 * 86400000)),
      usageLimit: null, active: true,
    });
  }

  categoryLabel(value: string): string {
    return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private loadVouchers(): void {
    this.loading.set(true);
    this.voucherService.listManageable().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res) => this.vouchers.set(res.data ?? []),
    });
  }

  private loadShops(): void {
    const request = this.isAdmin
      ? this.shopService.search({ page: 0, limit: 1000 })
      : this.shopService.getMyShops();
    request.subscribe({
      next: (res) => {
        this.shops.set(res.data ?? []);
        if (!this.form.controls.shopId.value && this.shops()[0]) {
          this.form.controls.shopId.setValue(this.shops()[0].id);
        }
      },
    });
  }

  private readRoles(): string[] {
    try { return JSON.parse(localStorage.getItem('roles') ?? '[]'); } catch { return []; }
  }

  private localDateTime(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }
}
