import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SKIP_GLOBAL_ERROR_HANDLER } from '../../../../core/interceptor/error.interceptor';
import { ResponseDto } from '../../../../shared/dto/response.dto';
import { PromotionTicketResponse } from './promotionTicket.type';

@Injectable({ providedIn: 'root' })
export class AdminTicketService {
  private readonly http = inject(HttpClient);
  private readonly ctx  = { context: new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLER, true) };

  getPromotionTickets(page: number, limit: number): Observable<ResponseDto<PromotionTicketResponse[]>> {
    const params = new HttpParams()
      .set('page',  page.toString())
      .set('limit', limit.toString());

    return this.http.get<ResponseDto<PromotionTicketResponse[]>>(
      '/v1/tickets/promotions',
      { params, ...this.ctx }
    );
  } 

  approvePromotion(promotionTicketId: string): Observable<void> {
    return this.http.post<void>(`/v1/tickets/promotions/approve/${promotionTicketId}`, {}, this.ctx);
  }

  rejectPromotion(promotionTicketId: string): Observable<void> {
    return this.http.post<void>(`/v1/tickets/promotions/reject/${promotionTicketId}`, {}, this.ctx);
  }
}
