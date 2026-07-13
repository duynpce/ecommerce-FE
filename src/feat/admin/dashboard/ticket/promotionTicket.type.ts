export type TicketStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PromotionTicketResponse {
  ticketId:            string;
  userId:              string;
  status:              TicketStatus;
  createdAt:           string;
  identityCardNumber:  string;
  bankName:            string;
  bankAccountNumber:   string;
  shopName:            string;
  deliveryAddress:     string;
  taxId:               string;
}
