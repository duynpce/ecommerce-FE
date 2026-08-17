import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/response.dto';
import {
  ProductReviewResponse,
  UpdateProductReviewRequest,
} from './product-review.service.type';

export type {
  ProductReviewResponse,
  UpdateProductReviewRequest,
} from './product-review.service.type';

@Injectable({ providedIn: 'root' })
export class ProductReviewService {
  private readonly http = inject(HttpClient);

  // GET /v1/products/reviews/{id}
  findById(id: string): Observable<ResponseDto<ProductReviewResponse>> {
    return this.http.get<ResponseDto<ProductReviewResponse>>(
      `/v1/products/reviews/${id}`,
    );
  }

  // PUT /v1/products/reviews/{id}
  update(
    id: string,
    body: UpdateProductReviewRequest,
  ): Observable<ResponseDto<ProductReviewResponse>> {
    return this.http.put<ResponseDto<ProductReviewResponse>>(
      `/v1/products/reviews/${id}`,
      body,
    );
  }

  // GET /v1/products/reviews/product/{productId}
  findAllByProductId(
    productId: string,
  ): Observable<ResponseDto<ProductReviewResponse[]>> {
    return this.http.get<ResponseDto<ProductReviewResponse[]>>(
      `/v1/products/reviews/product/${productId}`,
    );
  }
}
