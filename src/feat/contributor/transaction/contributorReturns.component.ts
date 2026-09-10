import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { TicketService } from '../../../shared/service/ticket.service';
import { ReturnWorkItem } from '../../../shared/service/ticket.service.type';

@Component({
  selector: 'app-contributor-returns',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  templateUrl: './contributorReturns.component.html',
})
export class ContributorReturnsComponent implements OnInit {
  private readonly tickets = inject(TicketService);
  private readonly toastr = inject(ToastrService);

  readonly ui = UI_CLASS_NAME;
  readonly loading = signal(true);
  readonly returns = signal<ReturnWorkItem[]>([]);
  readonly actingTaskId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.tickets.getPendingReturns().subscribe({
      next: (response) => {
        this.returns.set(response.data ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toastr.error(error?.error?.message ?? 'Failed to load returned sub-orders.');
      },
    });
  }

  confirm(item: ReturnWorkItem, received: boolean): void {
    this.actingTaskId.set(item.taskId);
    this.tickets.confirmReturnTask(item.taskId, received).subscribe({
      next: () => {
        this.actingTaskId.set(null);
        this.toastr.success(
          received
            ? 'Return confirmed. The returned product will be restored.'
            : 'Return marked as not received. The return delivery will retry.',
        );
        this.load();
      },
      error: (error) => {
        this.actingTaskId.set(null);
        this.toastr.error(error?.error?.message ?? 'Failed to update the return.');
      },
    });
  }
}
