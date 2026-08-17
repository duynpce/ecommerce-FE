import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SKIP_GLOBAL_ERROR_HANDLER } from '../../core/interceptor/error.interceptor';
import { ResponseDto } from '../dto/response.dto';
import {
  CreateProductRequest,
  ProductFilter,
  ProductResponse,
  UpdateProductRequest,
} from './product.service.type';

export type {
  ProductCategory,
  ProductResponse,
  CreateProductRequest,
  UpdateProductRequest,
  ProductFilter,
} from './product.service.type';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  private toFormData(data: CreateProductRequest | UpdateProductRequest): FormData {
    const fd = new FormData();
    Object.entries(data).forEach(([key, val]) => {
      if (val === undefined || val === null) return;
      if (key === 'imgs' && Array.isArray(val)) {
        // Append each image file under the same key
        (val as File[]).forEach((file) => fd.append('imgs', file, file.name));
      } else if (key === 'attributes' && typeof val === 'object' && val !== null) {
        Object.entries(val as Record<string, string>).forEach(([attrKey, attrVal]) => {
          fd.append(`attributes[${attrKey}]`, attrVal);
        });
      } else if (val instanceof File) {
        fd.append(key, val, val.name);
      } else {
        fd.append(key, String(val));
      }
    });
    return fd;
  }

  // POST /api/v1/products
  create(body: CreateProductRequest): Observable<ResponseDto<void>> {
    return this.http.post<ResponseDto<void>>(`/v1/products/create`, this.toFormData(body));
  }

  // GET /api/v1/products/{id}
  findById(id: string): Observable<ResponseDto<ProductResponse>> {
    return this.http.get<ResponseDto<ProductResponse>>(`/v1/products/${id}`);
  }

  // PUT /api/v1/products/{id}
  update(id: string, body: UpdateProductRequest): Observable<ResponseDto<ProductResponse>> {
    return this.http.put<ResponseDto<ProductResponse>>(`/v1/products/${id}`, this.toFormData(body));
  }

  // DELETE /api/v1/products/{id}
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/v1/products/${id}`);
  }

  // GET /api/v1/products/search
  search(filter: ProductFilter): Observable<ResponseDto<ProductResponse[]>> {
    const params = this.toSearchParams(filter);

    return this.http.get<ResponseDto<ProductResponse[]>>(`/v1/products/search`, { params });
  }

  // GET /api/v1/products/pending
  getPendingProducts(filter: ProductFilter): Observable<ResponseDto<ProductResponse[]>> {
    return this.http.get<ResponseDto<ProductResponse[]>>(`/v1/products/pending`, {
      params: this.toSearchParams(filter),
    });
  }

  // PATCH /api/v1/products/censor/{id}?isApproved={boolean}
  censor(id: string, isApproved: boolean): Observable<ResponseDto<void>> {
    return this.http.patch<ResponseDto<void>>(`/v1/products/censor/${id}`, null, {
      params: { isApproved },
    });
  }

  private toSearchParams(filter: ProductFilter): HttpParams {
    let params = new HttpParams().set('page', filter.page).set('limit', filter.limit);

    if (filter.name) params = params.set('name', filter.name);
    if (filter.category) params = params.set('category', filter.category);
    if (filter.contributorId) params = params.set('contributorId', filter.contributorId);
    if (filter.minPrice != null) params = params.set('minPrice', filter.minPrice);
    if (filter.maxPrice != null) params = params.set('maxPrice', filter.maxPrice);
    if (filter.createdFrom) params = params.set('createdFrom', filter.createdFrom);
    if (filter.createdTo) params = params.set('createdTo', filter.createdTo);
    if (filter.shopId) params = params.set('shopId', filter.shopId);

    return params;
  }

  getMyProducts(page: number, limit: number): Observable<ResponseDto<ProductResponse[]>> {
    return this.http.get<ResponseDto<ProductResponse[]>>(`/v1/products/me`, {
      params: { page, limit },
    });
  }
}
