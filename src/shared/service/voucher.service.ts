import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TOAST_ON_SUCCESS } from '../../core/interceptor/success.interceptor';
import type { ResponseDto } from '../dto/response.dto';
import type {
  SaveVoucherRequest,
  VoucherApplicationResponse,
  VoucherAvailabilityRequest,
  VoucherPreviewRequest,
  VoucherResponse,
} from './voucher.service.type';

export type * from './voucher.service.type';

@Injectable({ providedIn: 'root' })
export class VoucherService {
  private readonly http = inject(HttpClient);
  private readonly base = '/v1/products/vouchers';

  listManageable(): Observable<ResponseDto<VoucherResponse[]>> {
    return this.http.get<ResponseDto<VoucherResponse[]>>(`${this.base}/manage`);
  }

  create(body: SaveVoucherRequest): Observable<ResponseDto<VoucherResponse>> {
    return this.http.post<ResponseDto<VoucherResponse>>(this.base, body, {
      context: new HttpContext().set(TOAST_ON_SUCCESS, true),
    });
  }

  update(id: string, body: SaveVoucherRequest): Observable<ResponseDto<VoucherResponse>> {
    return this.http.put<ResponseDto<VoucherResponse>>(`${this.base}/${id}`, body, {
      context: new HttpContext().set(TOAST_ON_SUCCESS, true),
    });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  preview(body: VoucherPreviewRequest): Observable<ResponseDto<VoucherApplicationResponse>> {
    return this.http.post<ResponseDto<VoucherApplicationResponse>>(`${this.base}/preview`, body);
  }

  available(body: VoucherAvailabilityRequest): Observable<ResponseDto<VoucherApplicationResponse[]>> {
    return this.http.post<ResponseDto<VoucherApplicationResponse[]>>(`${this.base}/available`, body);
  }
}
