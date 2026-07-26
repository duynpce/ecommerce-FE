import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SKIP_GLOBAL_ERROR_HANDLER } from '../../core/interceptor/error.interceptor';
import { ResponseDto } from '../dto/response.dto';
import {
  CreateTransactionRequest,
  TransactionFilter,
  TransactionResponse,
  UpdateTransactionRequest,
} from './transaction.service.type';

export type { TransactionStatus, TransactionResponse, CreateTransactionRequest, UpdateTransactionRequest, TransactionFilter } from './transaction.service.type';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);

  private buildFilterParams(filter: TransactionFilter): HttpParams {
    let params = new HttpParams()
      .set('page', filter.page)
      .set('limit', filter.limit);
    if (filter.productId)   params = params.set('productId', filter.productId);
    if (filter.status)      params = params.set('status', filter.status);
    if (filter.createdFrom) params = params.set('createdFrom', filter.createdFrom);
    if (filter.createdTo)   params = params.set('createdTo', filter.createdTo);
    return params;
  }

  // POST /api/v1/transactions
  create(body: CreateTransactionRequest): Observable<ResponseDto<void>> {
    return this.http.post<ResponseDto<void>>(`/v1/products/transactions`, body);
  }

  // GET /api/v1/transactions/{id}
  findById(id: string): Observable<ResponseDto<TransactionResponse>> {
    return this.http.get<ResponseDto<TransactionResponse>>(
      `/v1/products/transactions/${id}`,
    );
  }

  // PUT /api/v1/transactions/{id}
  update(id: string, body: UpdateTransactionRequest): Observable<ResponseDto<TransactionResponse>> {
    return this.http.put<ResponseDto<TransactionResponse>>(
      `/v1/products/transactions/${id}`,
      body,
    );
  }

  // DELETE /api/v1/transactions/{id}
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/v1/products/transactions/${id}`);
  }

  // GET /api/v1/transactions/search  (current user)
  search(filter: TransactionFilter): Observable<ResponseDto<TransactionResponse[]>> {
    return this.http.get<ResponseDto<TransactionResponse[]>>(
      `/v1/products/transactions/search`,
      { params: this.buildFilterParams(filter) },
    );
  }

  // GET /api/v1/transactions/admin/search
  adminSearch(filter: TransactionFilter): Observable<ResponseDto<TransactionResponse[]>> {
    return this.http.get<ResponseDto<TransactionResponse[]>>(
      `/v1/products/transactions/admin/search`,
      { params: this.buildFilterParams(filter) },
    );
  }
}
