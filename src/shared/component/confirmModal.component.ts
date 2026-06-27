import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UI_CLASS_NAME } from '../constant/className.constant';

@Component({
  selector: 'app-confirm-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  templateUrl: './confirmModal.component.html',
})
export class ConfirmModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('Confirmation');
  readonly description = input<string>('Are you sure you want to continue?');
  readonly confirmText = input<string>('Confirm');
  readonly cancelText = input<string>('Cancel');
  readonly busy = input<boolean>(false);

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  readonly ui = UI_CLASS_NAME;

  onEscape(): void {
    if (!this.isOpen() || this.busy()) {
      return;
    }

    this.cancel.emit();
  }
}
