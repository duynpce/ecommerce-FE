export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';

export interface TransactionResponse {
  id: string;
  productId: string;
  contributorId: string;
  customerId: string;
  quantity: number;
  totalAmount: number;
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
  status?: TransactionStatus;
}

export interface TransactionFilter {
  productId?: string;
  status?: TransactionStatus;
  createdFrom?: string;
  createdTo?: string;
  page: number;
  limit: number;
}
