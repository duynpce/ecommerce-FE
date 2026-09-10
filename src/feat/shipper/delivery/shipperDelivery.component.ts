import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { TicketService } from '../../../shared/service/ticket.service';
import { DeliveryWorkItem } from '../../../shared/service/ticket.service.type';

@Component({
  selector: 'app-shipper-delivery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './shipperDelivery.component.html',
})
export class ShipperDeliveryComponent implements OnInit {
  private readonly tickets = inject(TicketService);
  private readonly toastr = inject(ToastrService);

  readonly ui = UI_CLASS_NAME;
  readonly loading = signal(true);
  readonly work = signal<DeliveryWorkItem[]>([]);
  readonly actingTaskId = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.tickets.getDeliveryWork().subscribe({
      next: (response) => { this.work.set(response.data ?? []); this.loading.set(false); },
      error: (error) => { this.loading.set(false); this.toastr.error(error?.error?.message ?? 'Failed to load delivery work.'); },
    });
  }

  isPickup(item: DeliveryWorkItem): boolean {
    return item.stage === 'AWAITING_PICKUP' || item.stage === 'AWAITING_RETURN_PICKUP';
  }

  isReturn(item: DeliveryWorkItem): boolean {
    return item.stage === 'AWAITING_RETURN_PICKUP' || item.stage === 'RETURN_IN_DELIVERY';
  }

  stageLabel(item: DeliveryWorkItem): string {
    switch (item.stage) {
      case 'AWAITING_RETURN_PICKUP': return 'RETURN PICKUP';
      case 'RETURN_IN_DELIVERY': return 'RETURN IN DELIVERY';
      case 'AWAITING_PICKUP': return 'AWAITING PICKUP';
      default: return 'IN DELIVERY';
    }
  }

  accept(item: DeliveryWorkItem): void {
    this.actingTaskId.set(item.taskId);
    this.tickets.acceptPickup(item.taskId).subscribe({
      next: () => {
        this.actingTaskId.set(null);
        this.toastr.success(this.isReturn(item)
          ? 'Return pickup accepted. Deliver it back to the contributor.'
          : 'Pickup accepted. This delivery is now assigned to you.');
        this.load();
      },
      error: (error) => { this.actingTaskId.set(null); this.toastr.error(error?.error?.message ?? 'Pickup could not be accepted.'); },
    });
  }

  finish(item: DeliveryWorkItem, outcome: 'RECEIVED' | 'NOT_RECEIVED'): void {
    this.actingTaskId.set(item.taskId);
    this.tickets.completeDelivery(item.taskId, outcome).subscribe({
      next: () => {
        this.actingTaskId.set(null);
        this.toastr.success(outcome === 'RECEIVED'
          ? (this.isReturn(item) ? 'Return delivered to the contributor.' : 'Delivery completed.')
          : 'Delivery attempt recorded for retry.');
        this.load();
      },
      error: (error) => { this.actingTaskId.set(null); this.toastr.error(error?.error?.message ?? 'Delivery outcome could not be recorded.'); },
    });
  }
}
