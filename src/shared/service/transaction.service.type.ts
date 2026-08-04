export type TransactionStatus =
  | 'PENDING'
  | 'PACKING'
  | 'DELIVERING'
  | 'NOT_RECEIVED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'RETURNED'
  | 'FAILED'
  | 'REVERSED';

export interface TransactionResponse {
  id: string;
  productId: string;
  contributorId: string;
  customerId: string;
  quantity: number;
  totalAmount: number | string;
  status: TransactionStatus;
  createdAt: string;
}

export interface CreateTransactionRequest {
  productId: string;
  quantity: number;
  price: number;
}

export interface UpdateTransactionRequest {
  id: string;
  quantity?: number;
  price?: number;
}

export interface TransactionFilter {
  productId?: string;
  status?: TransactionStatus;
  createdFrom?: string;
  createdTo?: string;
  page: number;
  limit: number;
}
