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
  contributorId: string;
  customerId: string;
}

export interface ConfirmTransactionRequest {
  /** true = approve, false = reject */
  approve: boolean;
}

export interface ConfirmDeliveryRequest {
  status: DeliveryStatus;
}

export interface ConfirmReturnRequest {
  /** true = returned product received back; false = not received */
  received: boolean;
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
