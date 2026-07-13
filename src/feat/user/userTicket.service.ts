import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SKIP_GLOBAL_ERROR_HANDLER } from '../../core/interceptor/error.interceptor';

export interface SavePromotionRequest {
  identityCardNumber: string;
  bankName:           string;
  bankAccountNumber:  string;
  shopName:           string;
  deliveryAddress:    string;
  taxId:              string;
}

@Injectable({ providedIn: 'root' })
export class UserTicketService {
  private readonly http = inject(HttpClient);
  private readonly ctx  = { context: new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLER, true) };

  savePromotion(body: SavePromotionRequest): Observable<void> {
    return this.http.post<void>(`/v1/tickets/promotions`, body, this.ctx);
  }
}
