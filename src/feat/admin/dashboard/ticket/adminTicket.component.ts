import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../../shared/constant/className.constant';
import { TicketDetailModalComponent } from './ticketDetailModal.component';
import { TicketService } from '../../../../shared/service/ticket.service';
import {
  RoleApplicationTicket,
  ShipperApplicationResponse,
} from '../../../../shared/service/ticket.service.type';
import { PaginationBarComponent } from '../../../../shared/component/paginationBar.component';

type ApplicationQueue = 'CONTRIBUTOR' | 'SHIPPER';

@Component({
  selector: 'app-admin-ticket',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, TicketDetailModalComponent, PaginationBarComponent],
  templateUrl: './adminTicket.component.html',
})
export class AdminTicketComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly toastr = inject(ToastrService);

  readonly ui = UI_CLASS_NAME;
  readonly activeQueue = signal<ApplicationQueue>('SHIPPER');
  readonly tickets = signal<RoleApplicationTicket[]>([]);
  readonly loading = signal(true);
  readonly approvingId = signal<string | null>(null);
  readonly rejectingId = signal<string | null>(null);
  readonly page = signal(0);
  readonly limit = signal(10);
  readonly totalPages = signal(0);
  readonly totalItems = signal(0);
  readonly detailTicket = signal<RoleApplicationTicket | null>(null);
  readonly isDetailOpen = signal(false);

  ngOnInit(): void {
    this.loadTickets();
  }

  selectQueue(queue: ApplicationQueue): void {
    if (queue === this.activeQueue()) return;
    this.activeQueue.set(queue);
    this.page.set(0);
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading.set(true);
    if (this.activeQueue() === 'SHIPPER') {
      this.ticketService.getShipperApplications(this.page(), this.limit()).subscribe({
        next: (response) => this.applyResponse(response),
        error: () => this.loadFailed('shipper'),
      });
      return;
    }
    this.ticketService.getPromotions(this.page(), this.limit()).subscribe({
      next: (response) => this.applyResponse(response),
      error: () => this.loadFailed('contributor'),
    });
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.loadTickets();
  }

  openDetail(ticket: RoleApplicationTicket): void {
    this.detailTicket.set(ticket);
    this.isDetailOpen.set(true);
  }

  closeDetail(): void {
    this.isDetailOpen.set(false);
    this.detailTicket.set(null);
  }

  onApprove(ticket: RoleApplicationTicket): void {
    this.approvingId.set(ticket.ticketId);
    const request = this.isShipper(ticket)
      ? this.ticketService.approveShipperApplication(ticket.ticketId)
      : this.ticketService.approvePromotion(ticket.ticketId);
    request.subscribe({
      next: () => {
        this.approvingId.set(null);
        this.toastr.success(`${this.queueLabel()} application approved and role granted.`);
        this.loadTickets();
      },
      error: (error) => {
        this.approvingId.set(null);
        this.toastr.error(error?.error?.message ?? 'Failed to approve application.');
      },
    });
  }

  onReject(ticket: RoleApplicationTicket): void {
    this.rejectingId.set(ticket.ticketId);
    const request = this.isShipper(ticket)
      ? this.ticketService.rejectShipperApplication(ticket.ticketId)
      : this.ticketService.rejectPromotion(ticket.ticketId);
    request.subscribe({
      next: () => {
        this.rejectingId.set(null);
        this.toastr.success(`${this.queueLabel()} application rejected.`);
        this.loadTickets();
      },
      error: (error) => {
        this.rejectingId.set(null);
        this.toastr.error(error?.error?.message ?? 'Failed to reject application.');
      },
    });
  }

  isShipper(ticket: RoleApplicationTicket): ticket is ShipperApplicationResponse {
    return 'vehicleType' in ticket;
  }

  queueLabel(): string {
    return this.activeQueue() === 'SHIPPER' ? 'Shipper' : 'Contributor';
  }

  private applyResponse(response: {
    data?: RoleApplicationTicket[] | null;
    metaData?: { totalPages?: number; totalItems?: number };
  }): void {
    this.tickets.set(response.data ?? []);
    this.totalPages.set(response.metaData?.totalPages ?? 0);
    this.totalItems.set(response.metaData?.totalItems ?? 0);
    this.loading.set(false);
  }

  private loadFailed(label: string): void {
    this.loading.set(false);
    this.toastr.error(`Failed to load ${label} applications.`);
  }
}
