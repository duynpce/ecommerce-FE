// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export type DeliveryStatus = 'RECEIVED' | 'NOT_RECEIVED' | 'RETURNED';

export type PromotionTicketStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// ---------------------------------------------------------------------------
// Transaction-ticket requests
// ---------------------------------------------------------------------------

export interface StartBuyingProcedureRequest {
  transactionId: string;
  customerId: string;
  subOrders?: unknown[];
}

export interface ConfirmTransactionRequest {
  /** true = approve, false = reject */
  approve: boolean;
}

export interface CancelSubOrderRequest {
  reason: string;
}

export interface ConfirmDeliveryRequest {
  status: DeliveryStatus;
}

export interface ConfirmReturnRequest {
  /** true = returned product received back; false = not received */
  received: boolean;
}

export interface CreateProductReviewRequest {
  productId: string;
  transactionId: string;
  snapshotId: string;
  rating: number;
  comment?: string;
}

// ---------------------------------------------------------------------------
// Promotion-ticket requests / responses
// ---------------------------------------------------------------------------

export interface SavePromotionRequest {
  identityCardNumber: string;
  bankName: string;
  bankAccountNumber: string;
  taxId: string;
}

export interface PromotionTicketResponse {
  ticketId: string;
  userId: string;
  status: PromotionTicketStatus;
  createdAt: string;
  identityCardNumber: string;
  bankName: string;
  bankAccountNumber: string;
  taxId: string;
}
