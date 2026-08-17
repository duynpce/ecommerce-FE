import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CartItemResponse, CartResponse, CartService } from '../../../shared/service/cart.service';
import { CheckoutDraftService } from '../../../shared/service/checkout-draft.service';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';

@Component({
  selector: 'app-user-cart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './userCart.component.html',
})
export class UserCartComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly checkoutDraftService = inject(CheckoutDraftService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);

  readonly ui = UI_CLASS_NAME;
  readonly loading = signal(true);
  readonly changingItem = signal<string | null>(null);
  readonly cart = signal<CartResponse | null>(null);
  readonly selectedProductIds = signal<Set<string>>(new Set());

  readonly selectedItems = computed(() => {
    const selected = this.selectedProductIds();
    return (this.cart()?.items ?? []).filter((item) => selected.has(item.productId));
  });

  readonly selectedQuantity = computed(() =>
    this.selectedItems().reduce((total, item) => total + item.quantity, 0),
  );

  readonly selectedTotal = computed(() =>
    this.selectedItems().reduce((total, item) => total + Number(item.subtotal), 0),
  );

  readonly allSelected = computed(() => {
    const items = this.cart()?.items ?? [];
    return items.length > 0 && items.every((item) => this.isSelected(item.productId));
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.cartService.getMyCart().subscribe({
      next: (response) => {
        this.cart.set(response.data);
        const availableIds = new Set((response.data?.items ?? []).map((item) => item.productId));
        this.selectedProductIds.update(
          (selected) => new Set([...selected].filter((id) => availableIds.has(id))),
        );
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toastr.error(error?.error?.message ?? 'Failed to load cart.');
      },
    });
  }

  isSelected(productId: string): boolean {
    return this.selectedProductIds().has(productId);
  }

  toggleItem(productId: string, checked: boolean): void {
    this.selectedProductIds.update((current) => {
      const next = new Set(current);
      checked ? next.add(productId) : next.delete(productId);
      return next;
    });
  }

  toggleAll(checked: boolean): void {
    this.selectedProductIds.set(
      checked ? new Set((this.cart()?.items ?? []).map((item) => item.productId)) : new Set(),
    );
  }

  changeQuantity(item: CartItemResponse, quantity: number): void {
    if (quantity < 1) {
      this.remove(item);
      return;
    }

    this.changingItem.set(item.productId);
    this.cartService.updateItem(item.productId, quantity).subscribe({
      next: (response) => {
        this.cart.set(response.data);
        this.changingItem.set(null);
      },
      error: (error) => {
        this.changingItem.set(null);
        this.toastr.error(error?.error?.message ?? 'Could not update cart item.');
      },
    });
  }

  remove(item: CartItemResponse): void {
    this.changingItem.set(item.productId);
    this.cartService.removeItems([item.productId]).subscribe({
      next: (response) => {
        this.cart.set(response.data);
        this.toggleItem(item.productId, false);
        this.changingItem.set(null);
      },
      error: (error) => {
        this.changingItem.set(null);
        this.toastr.error(error?.error?.message ?? 'Could not remove cart item.');
      },
    });
  }

  reviewSelectedItems(): void {
    const items = this.selectedItems();

    if (!items.length) {
      this.toastr.info('Select at least one item to continue.');
      return;
    }

    this.checkoutDraftService.save({
      source: 'cart',
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        subtotal: Number(item.subtotal),
      })),
    });

    this.router.navigate(['/user/checkout']);
  }
}
