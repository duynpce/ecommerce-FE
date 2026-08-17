import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SubOrderService } from '../../../shared/service/sub-order.service';
import { SubOrderResponse } from '../../../shared/service/sub-order.service.type';
import { TicketService } from '../../../shared/service/ticket.service';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { SnapshotItemCardComponent } from '../../../shared/component/snapshotItemCard.component';

@Component({
  selector: 'app-contributor-transaction-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, DecimalPipe, SnapshotItemCardComponent],
  templateUrl: './contributorTransactionDetail.component.html',
})
export class ContributorTransactionDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(SubOrderService);
  private readonly tickets = inject(TicketService);
  private readonly toastr = inject(ToastrService);
  readonly ui = UI_CLASS_NAME;
  readonly loading = signal(true);
  readonly acting = signal(false);
  readonly order = signal<SubOrderResponse | null>(null);
  readonly decisionDescription = signal('');
  readonly decisionError = signal(false);
  private id = '';

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.findById(this.id).subscribe({
      next: (r) => {
        this.order.set(r.data);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.toastr.error(e?.error?.message ?? 'Failed to load order.');
      },
    });
  }

  approve(): void {
    this.acting.set(true);
    this.tickets.confirmSubOrder(this.id, { approve: true }).subscribe({
      next: () => {
        this.acting.set(false);
        this.decisionDescription.set('');
        this.decisionError.set(false);
        this.toastr.success('Order accepted.');
        this.load();
      },
      error: (e) => {
        this.acting.set(false);
        this.toastr.error(e?.error?.message ?? 'Action failed.');
      },
    });
  }

  updateDecisionDescription(description: string): void {
    this.decisionDescription.set(description);
    if (description.trim()) this.decisionError.set(false);
  }

  reject(): void {
    const description = this.validDecisionDescription();
    if (!description) return;

    this.acting.set(true);
    this.service.updateNote(this.id, `Rejected by contributor: ${description}`).subscribe({
      next: () => {
        this.tickets.confirmSubOrder(this.id, { approve: false }).subscribe({
          next: () => this.finishDecision('Sub-order rejected.'),
          error: (error) => this.failDecision(error),
        });
      },
      error: (error) => this.failDecision(error),
    });
  }

  cancel(): void {
    const description = this.validDecisionDescription();
    if (!description) return;

    this.acting.set(true);
    this.tickets.cancelSubOrder(this.id, { reason: description }).subscribe({
      next: () => this.finishDecision('Sub-order cancelled.'),
      error: (error) => this.failDecision(error),
    });
  }

  shipped(): void {
    this.acting.set(true);
    this.tickets.confirmShipped(this.id).subscribe({
      next: () => {
        this.acting.set(false);
        this.toastr.success('Marked as shipped.');
        this.load();
      },
      error: (e) => {
        this.acting.set(false);
        this.toastr.error(e?.error?.message ?? 'Action failed.');
      },
    });
  }

  hasPackingItems(order: SubOrderResponse): boolean {
    return order.items.some((item) => item.status === 'PACKING');
  }

  hasPendingItems(order: SubOrderResponse): boolean {
    return order.items.some((item) => item.status === 'PENDING');
  }

  private validDecisionDescription(): string | null {
    const description = this.decisionDescription().trim();
    this.decisionError.set(!description);
    return description || null;
  }

  private finishDecision(message: string): void {
    this.acting.set(false);
    this.decisionDescription.set('');
    this.toastr.success(message);
    this.load();
  }

  private failDecision(error: any): void {
    this.acting.set(false);
    this.toastr.error(error?.error?.message ?? 'Action failed.');
  }
}
