import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/response.dto';
import {
  CreateShopRequest,
  ShopFilter,
  ShopResponse,
  UpdateShopRequest,
} from './shop.service.type';

export type { ShopStatus, ShopResponse, CreateShopRequest, UpdateShopRequest, ShopFilter, AddressResponse } from './shop.service.type';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly http = inject(HttpClient);

  private toFormData(data: CreateShopRequest | UpdateShopRequest): FormData {
    const fd = new FormData();
    Object.entries(data).forEach(([key, val]) => {
      if (val === undefined || val === null) return;
      if (val instanceof File) {
        fd.append(key, val, val.name);
      } else {
        fd.append(key, String(val));
      }
    });
    return fd;
  }

  // POST /v1/products/shops/create
  create(body: CreateShopRequest): Observable<ResponseDto<void>> {
    return this.http.post<ResponseDto<void>>(
      `/v1/products/shops/create`,
      this.toFormData(body),
    );
  }

  // GET /v1/products/shops/me — returns all shops owned by the logged-in contributor
  getMyShops(): Observable<ResponseDto<ShopResponse[]>> {
    return this.http.get<ResponseDto<ShopResponse[]>>(`/v1/products/shops/me`);
  }

  // GET /v1/products/shops/{id}
  findById(id: string): Observable<ResponseDto<ShopResponse>> {
    return this.http.get<ResponseDto<ShopResponse>>(`/v1/products/shops/${id}`);
  }

  // PUT /v1/products/shops/{id}
  update(id: string, body: UpdateShopRequest): Observable<ResponseDto<ShopResponse>> {
    return this.http.put<ResponseDto<ShopResponse>>(
      `/v1/products/shops/${id}`,
      this.toFormData(body),
    );
  }

  // DELETE /v1/products/shops/{id}
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/v1/products/shops/${id}`);
  }

  // GET /v1/products/shops/search
  search(filter: ShopFilter): Observable<ResponseDto<ShopResponse[]>> {
    let params = new HttpParams();
    if (filter.page != null)        params = params.set('page', filter.page);
    if (filter.limit != null)       params = params.set('limit', filter.limit);
    if (filter.name)                params = params.set('name', filter.name);
    if (filter.contributorId)       params = params.set('contributorId', filter.contributorId);
    if (filter.status)              params = params.set('status', filter.status);

    return this.http.get<ResponseDto<ShopResponse[]>>(`/v1/products/shops/search`, { params });
  }
}
