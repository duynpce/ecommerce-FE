import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AdminTicketService } from './adminTicket.service';
import { PromotionTicketResponse } from './promotionTicket.type';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../../shared/constant/className.constant';
import { TicketDetailModalComponent } from './ticketDetailModal.component';

@Component({
  selector: 'app-admin-ticket',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TicketDetailModalComponent],
  templateUrl: './adminTicket.component.html',
})
export class AdminTicketComponent implements OnInit {
  private readonly ticketService = inject(AdminTicketService);
  private readonly toastr = inject(ToastrService);

  readonly ui = UI_CLASS_NAME;
  readonly tickets = signal<PromotionTicketResponse[]>([]);
  readonly approvingId = signal<string | null>(null);
  readonly rejectingId = signal<string | null>(null);

  // Pagination state
  readonly page = signal(0);
  readonly limit = signal(10);
  readonly totalPages = signal(0);
  readonly totalItems = signal(0);

  // Detail modal state
  readonly detailTicket = signal<PromotionTicketResponse | null>(null);
  readonly isDetailOpen = signal(false);

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.ticketService.getPromotionTickets(this.page(), this.limit()).subscribe({
      next: (res) => {
        this.tickets.set(res.data ?? []);
        this.totalPages.set(res.metaData?.totalPages ?? 0);
        this.totalItems.set(res.metaData?.totalItems ?? 0);
      },
      error: () => this.toastr.error('Failed to load promotion tickets.'),
    });
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.loadTickets();
  }

  openDetail(ticket: PromotionTicketResponse): void {
    this.detailTicket.set(ticket);
    this.isDetailOpen.set(true);
  }

  closeDetail(): void {
    this.isDetailOpen.set(false);
    this.detailTicket.set(null);
  }

  onApprove(promotionTicketId: string): void {
    this.approvingId.set(promotionTicketId);

    this.ticketService.approvePromotion(promotionTicketId).subscribe({
      next: () => {
        this.approvingId.set(null);
        this.toastr.success('Promotion request approved.');
        this.loadTickets();
      },
      error: (err) => {
        this.approvingId.set(null);
        this.toastr.error(err?.error?.message ?? 'Failed to approve. Please try again.');
      },
    });
  }

  onReject(promotionTicketId: string): void {
    this.rejectingId.set(promotionTicketId);

    this.ticketService.rejectPromotion(promotionTicketId).subscribe({
      next: () => {
        this.rejectingId.set(null);
        this.toastr.success('Promotion request rejected.');
        this.loadTickets();
      },
      error: (err) => {
        this.rejectingId.set(null);
        this.toastr.error(err?.error?.message ?? 'Failed to reject. Please try again.');
      },
    });
  }
}
