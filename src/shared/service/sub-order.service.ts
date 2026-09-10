import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/response.dto';
import { SubOrderFilter, SubOrderResponse } from './sub-order.service.type';

export type {
  ProductSnapshotResponse,
  SnapshotStatus,
  SubOrderFilter,
  SubOrderResponse,
  SubOrderStatus,
} from './sub-order.service.type';

@Injectable({ providedIn: 'root' })
export class SubOrderService {
  private readonly http = inject(HttpClient);
  private readonly base = '/v1/products/sub-orders';
  findById(id: string): Observable<ResponseDto<SubOrderResponse>> {
    return this.http.get<ResponseDto<SubOrderResponse>>(`${this.base}/${id}`);
  }

  updateNote(id: string, note: string): Observable<ResponseDto<SubOrderResponse>> {
    return this.http.put<ResponseDto<SubOrderResponse>>(`${this.base}/${id}`, { note });
  }

  search(filter: SubOrderFilter): Observable<ResponseDto<SubOrderResponse[]>> {
    return this.http.get<ResponseDto<SubOrderResponse[]>>(`${this.base}/search`, {
      params: this.toSearchParams(filter),
    });
  }

  contributorSearch(filter: SubOrderFilter): Observable<ResponseDto<SubOrderResponse[]>> {
    return this.http.get<ResponseDto<SubOrderResponse[]>>(`${this.base}/contributor/search`, {
      params: this.toSearchParams(filter),
    });
  }

  shopSearch(shopId: string, filter: SubOrderFilter): Observable<ResponseDto<SubOrderResponse[]>> {
    return this.http.get<ResponseDto<SubOrderResponse[]>>(`${this.base}/shop/${shopId}/search`, {
      params: this.toSearchParams(filter, false),
    });
  }

  byTransaction(transactionId: string): Observable<ResponseDto<SubOrderResponse[]>> {
    return this.http.get<ResponseDto<SubOrderResponse[]>>(
      `${this.base}/transaction/${transactionId}`,
    );
  }

  private toSearchParams(filter: SubOrderFilter, includeShopId = true): HttpParams {
    let params = new HttpParams().set('page', filter.page).set('limit', filter.limit);
    if (includeShopId && filter.shopId) params = params.set('shopId', filter.shopId);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.transactionId) params = params.set('transactionId', filter.transactionId);
    if (filter.createdFrom) params = params.set('createdFrom', filter.createdFrom);
    if (filter.createdTo) params = params.set('createdTo', filter.createdTo);
    return params;
  }
}
