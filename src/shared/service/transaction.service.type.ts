export type TransactionStatus =
  'PENDING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'RETURNED' | 'PARTIALLY_RETURNED' | 'FAILED';
import type { VoucherSnapshot } from './voucher.service.type';

export interface TransactionResponse {
  id: string;
  customerId: string;
  subOrderIds: string[];
  subtotalAmount?: number;
  totalAmount: number;
  discountAmount?: number;
  vouchers: VoucherSnapshot[];
  phoneNumber?: string;
  address?: string;
  description?: string;
  status: TransactionStatus;
  statusReason?: string;
  triggerSubOrderId?: string;
  createdAt: string;
  updatedAt?: string;
  productId?: string;
  contributorId?: string;
  quantity?: number;
  isReviewed?: boolean;
}

export interface CreateTransactionItemRequest {
  productId: string;
  quantity: number;
}
export interface CreateTransactionRequest {
  items: CreateTransactionItemRequest[];
  voucherCodes?: string[];
  phoneNumber: string;
  address: string;
}
export interface TransactionFilter {
  productId?: string;
  status?: TransactionStatus;
  createdFrom?: string;
  createdTo?: string;
  page: number;
  limit: number;
}
