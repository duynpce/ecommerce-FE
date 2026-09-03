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
import {
  VoucherService,
  type VoucherApplicationResponse,
  type VoucherType,
} from '../../../shared/service/voucher.service';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';

const PHONE_NUMBER_PATTERN = /^[0-9+()\-\s]{7,25}$/;
const VOUCHER_TYPES: VoucherType[] = ['SHIPPING', 'PLATFORM', 'SHOP'];

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
  private readonly voucherService = inject(VoucherService);

  readonly ui = UI_CLASS_NAME;
  readonly draft = signal<CheckoutDraft | null>(this.checkoutDraftService.get());
  readonly confirming = signal(false);
  readonly phoneNumber = signal('');
  readonly deliveryAddress = signal('');
  readonly voucherTypes = VOUCHER_TYPES;
  readonly loadingVouchers = signal(false);
  readonly availableVouchers = signal<VoucherApplicationResponse[]>([]);
  readonly selectedByType = signal<Record<VoucherType, VoucherApplicationResponse | null>>({
    SHIPPING: null,
    PLATFORM: null,
    SHOP: null,
  });
  readonly selectedVouchers = computed(() =>
    this.voucherTypes
      .map((type) => this.selectedByType()[type])
      .filter((voucher): voucher is VoucherApplicationResponse => voucher !== null),
  );

  readonly totalQuantity = computed(() =>
    (this.draft()?.items ?? []).reduce((total, item) => total + item.quantity, 0),
  );

  readonly totalAmount = computed(() =>
    (this.draft()?.items ?? []).reduce((total, item) => total + item.subtotal, 0),
  );
  readonly totalDiscount = computed(() =>
    this.selectedVouchers().reduce((total, voucher) => total + voucher.discountAmount, 0),
  );
  readonly finalAmount = computed(() => Math.max(this.totalAmount() - this.totalDiscount(), 0));
  readonly phoneNumberValid = computed(() => PHONE_NUMBER_PATTERN.test(this.phoneNumber().trim()));
  readonly deliveryAddressValid = computed(() => {
    const length = this.deliveryAddress().trim().length;
    return length > 0 && length <= 500;
  });
  readonly deliveryDetailsValid = computed(
    () => this.phoneNumberValid() && this.deliveryAddressValid(),
  );

  readonly backLink = computed(() => {
    const draft = this.draft();
    if (draft?.source === 'buy-now' && draft.items[0]) {
      return ['/user/products', draft.items[0].productId];
    }
    return ['/user/cart'];
  });

  constructor() {
    this.loadAvailableVouchers();
  }

  confirmOrder(): void {
    const draft = this.draft();
    if (!draft?.items.length || this.confirming()) return;
    if (!this.deliveryDetailsValid()) {
      this.toastr.error('Enter a valid phone number and delivery address.');
      return;
    }

    this.confirming.set(true);
    this.transactionService
      .create({
        items: draft.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        voucherCodes: this.selectedVouchers().map((voucher) => voucher.voucher.code),
        phoneNumber: this.phoneNumber().trim(),
        address: this.deliveryAddress().trim(),
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

  updatePhoneNumber(phoneNumber: string): void {
    this.phoneNumber.set(phoneNumber);
  }

  updateDeliveryAddress(deliveryAddress: string): void {
    this.deliveryAddress.set(deliveryAddress);
  }

  vouchersFor(type: VoucherType): VoucherApplicationResponse[] {
    return this.availableVouchers().filter((voucher) => voucher.voucher.type === type);
  }

  selectedVoucher(type: VoucherType): VoucherApplicationResponse | null {
    return this.selectedByType()[type];
  }

  selectVoucher(voucher: VoucherApplicationResponse): void {
    const type = voucher.voucher.type;
    const current = this.selectedByType()[type];
    this.selectedByType.update((selected) => ({
      ...selected,
      [type]: current?.voucher.voucherId === voucher.voucher.voucherId ? null : voucher,
    }));
  }

  voucherTypeLabel(type: VoucherType): string {
    if (type === 'SHIPPING') return 'Shipping voucher';
    if (type === 'PLATFORM') return 'Platform voucher';
    return 'Shop voucher';
  }

  voucherValueLabel(voucher: VoucherApplicationResponse): string {
    const snapshot = voucher.voucher;
    return snapshot.discountType === 'PERCENTAGE'
      ? `${snapshot.discountValue}% off`
      : `$${snapshot.discountValue.toFixed(2)} off`;
  }

  private loadAvailableVouchers(): void {
    const draft = this.draft();
    if (!draft?.items.length) return;
    this.loadingVouchers.set(true);
    this.voucherService.available({
      items: draft.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    }).subscribe({
      next: (response) => {
        this.availableVouchers.set(response.data ?? []);
        this.loadingVouchers.set(false);
      },
      error: (error) => {
        this.loadingVouchers.set(false);
        this.toastr.error(error?.error?.message ?? 'Could not load available vouchers.');
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
