// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export type DeliveryStatus = 'RECEIVED' | 'NOT_RECEIVED' | 'RETURNED';

export type PromotionTicketStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type VehicleType = 'MOTORBIKE' | 'CAR' | 'VAN' | 'TRUCK';

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
  reason?: string;
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

export interface SaveShipperApplicationRequest {
  identityCardNumber: string;
  driverLicenseNumber: string;
  vehicleType: VehicleType;
  vehiclePlateNumber: string;
  phoneNumber: string;
}

export interface ShipperApplicationResponse extends SaveShipperApplicationRequest {
  ticketId: string;
  userId: string;
  type: 'SHIPPER_APPLICATION';
  status: PromotionTicketStatus;
  createdAt: string;
}

export type RoleApplicationTicket = PromotionTicketResponse | ShipperApplicationResponse;

export interface DeliveryWorkItem {
  taskId: string;
  stage: 'AWAITING_PICKUP' | 'IN_DELIVERY' | 'AWAITING_RETURN_PICKUP' | 'RETURN_IN_DELIVERY';
  transactionId: string;
  subOrderId: string;
  snapshotId: string;
  productName: string;
  retry: number;
  createdAt: string;
}

export interface ReturnWorkItem {
  taskId: string;
  transactionId: string;
  subOrderId: string;
  snapshotId: string;
  shopId?: string;
  productName: string;
  retry: number;
  createdAt: string;
}
