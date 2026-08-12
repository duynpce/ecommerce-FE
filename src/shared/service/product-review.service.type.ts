export interface ProductReviewResponse {
  id: string;
  productId: string;
  userId: string;
  transactionId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductReviewRequest {
  productId: string;
  transactionId: string;
  rating: number; // 0-5
  comment?: string;
}

export interface UpdateProductReviewRequest {
  rating?: number; // 0-5
  comment?: string;
}
