import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/response.dto';
import {
  ConfirmDeliveryRequest,
  ConfirmReturnRequest,
  ConfirmTransactionRequest,
  PromotionTicketResponse,
  SavePromotionRequest,
  StartBuyingProcedureRequest,
} from './ticket.service.type';


@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly ticketBase     = '/v1/tickets/transaction-tickets';
  private readonly promotionBase  = '/v1/tickets/promotions';

  // -------------------------------------------------------------------------
  // Transaction-ticket flow
  // -------------------------------------------------------------------------

  /**
   * Step 1 — Buyer starts the buying procedure after a transaction is created
   * in product-service.
   * POST /transaction-tickets/start
   */
  startBuyingProcedure(body: StartBuyingProcedureRequest): Observable<ResponseDto<void>> {
    return this.http.post<ResponseDto<void>>(`${this.ticketBase}/start`, body);
  }

  /**
   * Step 2 — Contributor approves or rejects the transaction.
   * POST /transaction-tickets/{transactionId}/confirm
   */
  confirmTransaction(
    transactionId: string,
    body: ConfirmTransactionRequest,
  ): Observable<ResponseDto<void>> {
    return this.http.post<ResponseDto<void>>(
      `${this.ticketBase}/${transactionId}/confirm`,
      body,
    );
  }

  /**
   * Step 3 — Contributor confirms the product was handed to the carrier.
   * POST /transaction-tickets/{transactionId}/shipped
   */
  confirmShipped(transactionId: string): Observable<ResponseDto<void>> {
    return this.http.post<ResponseDto<void>>(
      `${this.ticketBase}/${transactionId}/shipped`,
      {},
    );
  }

  /**
   * Step 4 — Buyer confirms delivery outcome.
   * status: RECEIVED → completes; NOT_RECEIVED → retry; RETURNED → return flow.
   * POST /transaction-tickets/{transactionId}/delivery
   */
  confirmDelivery(
    transactionId: string,
    body: ConfirmDeliveryRequest,
  ): Observable<ResponseDto<void>> {
    return this.http.post<ResponseDto<void>>(
      `${this.ticketBase}/${transactionId}/delivery`,
      body,
    );
  }

  /**
   * Step 5 — Contributor confirms whether the returned product was received back.
   * POST /transaction-tickets/{transactionId}/confirm-return
   */
  confirmReturn(
    transactionId: string,
    body: ConfirmReturnRequest,
  ): Observable<ResponseDto<void>> {
    return this.http.post<ResponseDto<void>>(
      `${this.ticketBase}/${transactionId}/confirm-return`,
      body,
    );
  }

  // -------------------------------------------------------------------------
  // Promotion tickets
  // -------------------------------------------------------------------------

  /** GET /promotions */
  getPromotions(page: number, limit: number): Observable<ResponseDto<PromotionTicketResponse[]>> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);
    return this.http.get<ResponseDto<PromotionTicketResponse[]>>(this.promotionBase, { params });
  }

  /** POST /promotions — contributor submits promotion application */
  savePromotion(body: SavePromotionRequest): Observable<ResponseDto<void>> {
    return this.http.post<ResponseDto<void>>(this.promotionBase, body);
  }

  /** POST /promotions/approve/{promotionTicketId} */
  approvePromotion(promotionTicketId: string): Observable<ResponseDto<void>> {
    return this.http.post<ResponseDto<void>>(
      `${this.promotionBase}/approve/${promotionTicketId}`,
      {},
    );
  }

  /** POST /promotions/reject/{promotionTicketId} */
  rejectPromotion(promotionTicketId: string): Observable<ResponseDto<void>> {
    return this.http.post<ResponseDto<void>>(
      `${this.promotionBase}/reject/${promotionTicketId}`,
      {},
    );
  }
}
