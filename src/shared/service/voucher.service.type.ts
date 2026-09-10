import type { CreateTransactionItemRequest } from './transaction.service.type';

export type VoucherType = 'SHIPPING' | 'PLATFORM' | 'SHOP';
export type VoucherDiscountType = 'FIXED_AMOUNT' | 'PERCENTAGE';
export type VoucherApplicableCategory =
  | 'ALL'
  | 'ELECTRONICS'
  | 'CLOTHING'
  | 'BOOKS'
  | 'HOME_AND_KITCHEN'
  | 'BEAUTY_AND_HEALTH'
  | 'MEDICALS'
  | 'ELSE';

export interface VoucherSnapshot {
  voucherId: string;
  code: string;
  name: string;
  type: VoucherType;
  shopId?: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  minimumSpend: number;
  maximumDiscount?: number;
  discountAmount: number;
  applicableCategories: VoucherApplicableCategory[];
}

export interface VoucherResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: VoucherType;
  shopId?: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  minimumSpend: number;
  maximumDiscount?: number;
  startsAt: string;
  endsAt: string;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
  applicableCategories: VoucherApplicableCategory[];
  createdAt: string;
  updatedAt?: string;
}

export interface SaveVoucherRequest {
  code: string;
  name: string;
  description?: string;
  type: VoucherType;
  shopId?: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  minimumSpend: number;
  maximumDiscount?: number;
  startsAt: string;
  endsAt: string;
  usageLimit?: number;
  active: boolean;
  applicableCategories: VoucherApplicableCategory[];
}

export interface VoucherPreviewRequest {
  code: string;
  items: CreateTransactionItemRequest[];
}

export interface VoucherAvailabilityRequest {
  items: CreateTransactionItemRequest[];
}

export interface VoucherApplicationResponse {
  voucher: VoucherSnapshot;
  transactionSubtotal: number;
  eligibleSubtotal: number;
  discountAmount: number;
}
