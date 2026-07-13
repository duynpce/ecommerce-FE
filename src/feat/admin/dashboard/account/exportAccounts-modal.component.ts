import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { UI_CLASS_NAME } from '../../../../shared/constant/className.constant';
import { EXPORT_FILE_TYPES, type ExportFileType } from './adminAccount.type';

@Component({
  selector: 'app-export-accounts-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  templateUrl: './exportAccounts-modal.component.html',
})
export class ExportAccountsModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly busy = input<boolean>(false);

  readonly confirm = output<ExportFileType>();
  readonly cancel = output<void>();

  readonly ui = UI_CLASS_NAME;
  readonly fileTypes = EXPORT_FILE_TYPES;

  readonly selectedFileType = signal<ExportFileType>('PDF');

  selectFileType(fileType: ExportFileType): void {
    this.selectedFileType.set(fileType);
  }

  onConfirm(): void {
    this.confirm.emit(this.selectedFileType());
  }

  onEscape(): void {
    if (!this.isOpen() || this.busy()) {
      return;
    }

    this.cancel.emit();
  }
}
