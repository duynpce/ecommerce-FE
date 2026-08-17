export type SubOrderStatus =
  'PENDING' | 'REJECTED' | 'RETURNED' | 'PARTIALLY_RETURNED' | 'CANCELLED' | 'COMPLETED';

export type SnapshotStatus =
  | 'PENDING'
  | 'REJECTED'
  | 'CANCELLED'
  | 'PACKING'
  | 'DELIVERING'
  | 'DELIVERED_AWAITING_CONFIRMATION'
  | 'RECEIVED'
  | 'COMPLETED'
  | 'RETURNED';

export interface ProductSnapshotResponse {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  status: SnapshotStatus;
  isReviewed: boolean;
  deliveredAt?: string;
  subtotal: number;
}

export interface SubOrderResponse {
  id: string;
  transactionId: string;
  shopId: string;
  customerId: string;
  contributorId: string;
  items: ProductSnapshotResponse[];
  subTotalAmount: number;
  shippingFee: number;
  totalAmount: number;
  note?: string;
  status: SubOrderStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface SubOrderFilter {
  shopId?: string;
  status?: SubOrderStatus;
  transactionId?: string;
  createdFrom?: string;
  createdTo?: string;
  page: number;
  limit: number;
}
