import { Injectable } from '@angular/core';

export type CheckoutSource = 'buy-now' | 'cart';

export interface CheckoutDraftItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  subtotal: number;
}

export interface CheckoutDraft {
  source: CheckoutSource;
  items: CheckoutDraftItem[];
}

@Injectable({ providedIn: 'root' })
export class CheckoutDraftService {
  private readonly storageKey = 'checkout-draft';

  save(draft: CheckoutDraft): void {
    sessionStorage.setItem(this.storageKey, JSON.stringify(draft));
  }

  get(): CheckoutDraft | null {
    const raw = sessionStorage.getItem(this.storageKey);
    if (!raw) return null;

    try {
      const draft = JSON.parse(raw) as CheckoutDraft;
      return draft.items?.length ? draft : null;
    } catch {
      this.clear();
      return null;
    }
  }

  clear(): void {
    sessionStorage.removeItem(this.storageKey);
  }
}
