import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/response.dto';
import {
  CreateTransactionRequest,
  TransactionFilter,
  TransactionResponse,
} from './transaction.service.type';

export type {
  TransactionStatus,
  TransactionResponse,
  CreateTransactionRequest,
  TransactionFilter,
} from './transaction.service.type';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly base = '/v1/products/transactions';

  create(body: CreateTransactionRequest): Observable<ResponseDto<void>> {
    return this.http.post<ResponseDto<void>>(this.base, body);
  }
  findById(id: string): Observable<ResponseDto<TransactionResponse>> {
    return this.http.get<ResponseDto<TransactionResponse>>(`${this.base}/${id}`);
  }
  search(filter: TransactionFilter): Observable<ResponseDto<TransactionResponse[]>> {
    let params = new HttpParams().set('page', filter.page).set('limit', filter.limit);
    if (filter.productId) params = params.set('productId', filter.productId);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.createdFrom) params = params.set('createdFrom', filter.createdFrom);
    if (filter.createdTo) params = params.set('createdTo', filter.createdTo);
    return this.http.get<ResponseDto<TransactionResponse[]>>(`${this.base}/search`, { params });
  }
  adminSearch(filter: TransactionFilter): Observable<ResponseDto<TransactionResponse[]>> {
    let params = new HttpParams().set('page', filter.page).set('limit', filter.limit);
    if (filter.productId) params = params.set('productId', filter.productId);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.createdFrom) params = params.set('createdFrom', filter.createdFrom);
    if (filter.createdTo) params = params.set('createdTo', filter.createdTo);
    return this.http.get<ResponseDto<TransactionResponse[]>>(`${this.base}/admin/search`, {
      params,
    });
  }
}
