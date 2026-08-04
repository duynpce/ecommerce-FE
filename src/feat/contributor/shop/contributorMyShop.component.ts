import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ShopService, ShopResponse, AddressResponse } from '../../../shared/service/shop.service';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-contributor-my-shop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, NgClass],
  templateUrl: './contributorMyShop.component.html',
})
export class contributorMyShopComponent implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly shopService = inject(ShopService);
  private readonly toastr      = inject(ToastrService);
  private readonly router      = inject(Router);

  readonly ui            = UI_CLASS_NAME;
  readonly loading       = signal(false);
  readonly saving        = signal(false);
  readonly deleting      = signal<string | null>(null); // holds the id of the shop being deleted
  readonly isContributor = signal(false);
  readonly shops         = signal<ShopResponse[]>([]);
  readonly showCreateForm = signal(false);

  // Tracks which shop id is currently in edit mode
  readonly editingShopId = signal<string | null>(null);

  // Logo state — keyed by context: 'create' or a shop id for edit
  logoPreviewMap: Record<string, string | null> = {};
  selectedLogoMap: Record<string, File | null>  = {};

  readonly createForm = this.fb.group({
    name:        ['', [Validators.required, Validators.minLength(1)]],
    description: [''],
    street:      [''],
    ward:        [''],
    district:    [''],
    city:        [''],
    country:     [''],
    zipCode:     [''],
  });

  // Single shared edit form — patched whenever a shop enters edit mode
  readonly editForm = this.fb.group({
    name:        ['', [Validators.required, Validators.minLength(1)]],
    description: [''],
    street:      [''],
    ward:        [''],
    district:    [''],
    city:        [''],
    country:     [''],
    zipCode:     [''],
  });

  ngOnInit(): void {
    this.checkContributorRole();
    if (this.isContributor()) {
      this.fetchMyShops();
    }
  }

  private checkContributorRole(): void {
    try {
      const raw   = localStorage.getItem('roles');
      const roles = raw ? JSON.parse(raw) : [];
      this.isContributor.set(Array.isArray(roles) && roles.includes('CONTRIBUTOR'));
    } catch {
      this.isContributor.set(false);
    }
  }

  fetchMyShops(): void {
    this.loading.set(true);
    this.shopService.getMyShops().subscribe({
      next: (res) => {
        this.loading.set(false);
        this.shops.set(res.data ?? []);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastr.error(err?.error?.message ?? 'Failed to load shops.');
      },
    });
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  toggleCreateForm(): void {
    this.showCreateForm.update((v) => !v);
    if (!this.showCreateForm()) {
      this.createForm.reset();
      this.logoPreviewMap['create'] = null;
      this.selectedLogoMap['create'] = null;
    }
  }

  onCreateSubmit(): void {
    if (!this.isContributor()) {
      this.toastr.error('You need the CONTRIBUTOR role to create a shop.');
      return;
    }
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const v = this.createForm.value;
    this.saving.set(true);
    this.shopService.create({
      logo:        this.selectedLogoMap['create'] ?? undefined,
      name:        v.name!,
      description: v.description || undefined,
      street:      v.street || undefined,
      ward:        v.ward || undefined,
      district:    v.district || undefined,
      city:        v.city || undefined,
      country:     v.country || undefined,
      zipCode:     v.zipCode || undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toastr.success('Shop created successfully!');
        this.createForm.reset();
        this.logoPreviewMap['create'] = null;
        this.selectedLogoMap['create'] = null;
        this.showCreateForm.set(false);
        this.fetchMyShops();
      },
      error: (err) => {
        this.saving.set(false);
        this.toastr.error(err?.error?.message ?? 'Failed to create shop.');
      },
    });
  }

  isCreateFieldInvalid(field: string): boolean {
    const c = this.createForm.get(field);
    return !!(c?.invalid && c?.touched);
  }

  // ── Edit ───────────────────────────────────────────────────────────────────

  startEdit(shop: ShopResponse): void {
    this.editingShopId.set(shop.id);
    this.editForm.patchValue({
      name:        shop.name,
      description: shop.description ?? '',
      street:      shop.pickUpAddress?.street ?? '',
      ward:        shop.pickUpAddress?.ward ?? '',
      district:    shop.pickUpAddress?.district ?? '',
      city:        shop.pickUpAddress?.city ?? '',
      country:     shop.pickUpAddress?.country ?? '',
      zipCode:     shop.pickUpAddress?.zipCode ?? '',
    });
    this.logoPreviewMap[shop.id] = null;
    this.selectedLogoMap[shop.id] = null;
  }

  cancelEdit(shop: ShopResponse): void {
    this.editingShopId.set(null);
    this.logoPreviewMap[shop.id] = null;
    this.selectedLogoMap[shop.id] = null;
  }

  isEditFieldInvalid(field: string): boolean {
    const c = this.editForm.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onUpdateSubmit(shop: ShopResponse): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const v = this.editForm.value;
    this.saving.set(true);
    this.shopService.update(shop.id, {
      logo:        this.selectedLogoMap[shop.id] ?? undefined,
      name:        v.name || undefined,
      description: v.description || undefined,
      street:      v.street || undefined,
      ward:        v.ward || undefined,
      district:    v.district || undefined,
      city:        v.city || undefined,
      country:     v.country || undefined,
      zipCode:     v.zipCode || undefined,
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        // Replace the updated shop in the list
        this.shops.update((list) =>
          list.map((s) => (s.id === shop.id ? res.data : s)),
        );
        this.editingShopId.set(null);
        this.logoPreviewMap[shop.id] = null;
        this.selectedLogoMap[shop.id] = null;
        this.toastr.success('Shop updated.');
      },
      error: (err) => {
        this.saving.set(false);
        this.toastr.error(err?.error?.message ?? 'Failed to update shop.');
      },
    });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  onDelete(shop: ShopResponse): void {
    if (!confirm(`Delete "${shop.name}"? This cannot be undone.`)) return;
    this.deleting.set(shop.id);
    this.shopService.delete(shop.id).subscribe({
      next: () => {
        this.deleting.set(null);
        this.shops.update((list) => list.filter((s) => s.id !== shop.id));
        this.toastr.success('Shop deleted.');
      },
      error: (err) => {
        this.deleting.set(null);
        this.toastr.error(err?.error?.message ?? 'Failed to delete shop.');
      },
    });
  }

  // ── Logo ───────────────────────────────────────────────────────────────────

  onLogoChange(event: Event, context: string): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    this.selectedLogoMap[context] = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreviewMap[context] = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  goAddProduct(shopId?: string): void {
    if (shopId) {
      this.router.navigate(['/contributor/products/create'], { queryParams: { shopId } });
    } else {
      this.router.navigate(['/contributor/products/create']);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Returns true only when the backend has sent a proper AddressResponse object
   * (not a raw Java toString like "Address@62b0c178") and at least one field is set.
   */
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

  statusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE:    'bg-emerald-100 text-emerald-700',
      INACTIVE:  'bg-slate-100 text-slate-600',
      SUSPENDED: 'bg-amber-100 text-amber-700',
      CLOSED:    'bg-red-100 text-red-600',
    };
    return map[status] ?? 'bg-slate-100 text-slate-600';
  }
}
