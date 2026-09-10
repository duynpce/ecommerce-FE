import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/response.dto';

export interface CartItemResponse {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  subtotal: number;
}
export interface CartResponse {
  id: string;
  userId: string;
  items: CartItemResponse[];
  totalAmount: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly base = '/v1/products/carts/me';

  getMyCart(): Observable<ResponseDto<CartResponse>> {
    return this.http.get<ResponseDto<CartResponse>>(this.base);
  }

  addItem(productId: string, quantity: number): Observable<ResponseDto<CartResponse>> {
    return this.http.post<ResponseDto<CartResponse>>(`${this.base}/items`, { productId, quantity });
  }

  updateItem(productId: string, quantity: number): Observable<ResponseDto<CartResponse>> {
    return this.http.put<ResponseDto<CartResponse>>(`${this.base}/items/${productId}`, {
      quantity,
    });
  }

  removeItems(productIds: string[]): Observable<ResponseDto<CartResponse>> {
    return this.http.delete<ResponseDto<CartResponse>>(`${this.base}/items`, {
      body: productIds,
    });
  }

  clear(): Observable<void> {
    return this.http.delete<void>(this.base);
  }
}
