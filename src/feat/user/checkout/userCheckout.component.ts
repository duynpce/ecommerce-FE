import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CartService } from '../../../shared/service/cart.service';
import {
  CheckoutDraft,
  CheckoutDraftService,
} from '../../../shared/service/checkout-draft.service';
import { TransactionService } from '../../../shared/service/transaction.service';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';

@Component({
  selector: 'app-user-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './userCheckout.component.html',
})
export class UserCheckoutComponent {
  private readonly checkoutDraftService = inject(CheckoutDraftService);
  private readonly transactionService = inject(TransactionService);
  private readonly cartService = inject(CartService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);

  readonly ui = UI_CLASS_NAME;
  readonly draft = signal<CheckoutDraft | null>(this.checkoutDraftService.get());
  readonly confirming = signal(false);

  readonly totalQuantity = computed(() =>
    (this.draft()?.items ?? []).reduce((total, item) => total + item.quantity, 0),
  );

  readonly totalAmount = computed(() =>
    (this.draft()?.items ?? []).reduce((total, item) => total + item.subtotal, 0),
  );

  readonly backLink = computed(() => {
    const draft = this.draft();
    if (draft?.source === 'buy-now' && draft.items[0]) {
      return ['/user/products', draft.items[0].productId];
    }
    return ['/user/cart'];
  });

  confirmOrder(): void {
    const draft = this.draft();
    if (!draft?.items.length || this.confirming()) return;

    this.confirming.set(true);
    this.transactionService
      .create({
        items: draft.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      })
      .subscribe({
        next: () => {
          this.checkoutDraftService.clear();
          if (draft.source === 'cart') {
            this.removePurchasedCartItems(draft);
            return;
          }
          this.finishCheckout();
        },
        error: (error) => {
          this.confirming.set(false);
          this.toastr.error(error?.error?.message ?? 'Could not create the transaction.');
        },
      });
  }

  private removePurchasedCartItems(draft: CheckoutDraft): void {
    this.cartService.removeItems(draft.items.map((item) => item.productId)).subscribe({
      next: () => this.finishCheckout(),
      error: () => {
        this.toastr.warning(
          'The transaction was created, but the purchased items could not be removed from your cart.',
        );
        this.finishCheckout(false);
      },
    });
  }

  private finishCheckout(showSuccess = true): void {
    this.confirming.set(false);
    if (showSuccess) {
      this.toastr.success('Transaction created successfully.');
    }
    this.router.navigate(['/user/transactions']);
  }
}
