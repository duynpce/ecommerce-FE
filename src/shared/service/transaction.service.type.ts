export type TransactionStatus =
  'PENDING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'RETURNED' | 'PARTIALLY_RETURNED' | 'FAILED';

export interface TransactionResponse {
  id: string;
  customerId: string;
  subOrderIds: string[];
  totalAmount: number;
  discountAmount?: number;
  voucherId?: string;
  voucherCode?: string;
  description?: string;
  status: TransactionStatus;
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
}
export interface TransactionFilter {
  productId?: string;
  status?: TransactionStatus;
  createdFrom?: string;
  createdTo?: string;
  page: number;
  limit: number;
}
