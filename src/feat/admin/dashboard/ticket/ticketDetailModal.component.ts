import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UI_CLASS_NAME } from '../../../../shared/constant/className.constant';
import { PromotionTicketResponse } from '../../../../shared/service/ticket.service.type';

@Component({
  selector: 'app-ticket-detail-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  templateUrl: './ticketDetailModal.component.html',
})
export class TicketDetailModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly ticket = input<PromotionTicketResponse | null>(null);

  readonly close = output<void>();

  readonly ui = UI_CLASS_NAME;

  onEscape(): void {
    if (this.isOpen()) {
      this.close.emit();
    }
  }
}
