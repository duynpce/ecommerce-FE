import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, finalize } from 'rxjs';
import { UI_CLASS_NAME } from '../../../../shared/constant/className.constant';
import { ExportAccountsModalComponent } from './exportAccounts-modal.component';
import { PaginationBarComponent } from '../../../../shared/component/paginationBar.component';
import { AdminAccountService } from './adminAccount.service';
import {
  EXPORT_FILE_NAME,
  type Account,
  type AccountReportQuery,
  type ExportFileType,
  type Gender,
} from './adminAccount.type';

const PAGE_SIZE = 6;

@Component({
  selector: 'app-admin-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, ExportAccountsModalComponent, PaginationBarComponent],
  templateUrl: './adminAccount.component.html',
})
export class AdminAccountComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminAccountService = inject(AdminAccountService);

  readonly ui = UI_CLASS_NAME;

  readonly filterForm = this.fb.nonNullable.group({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    gender: '' as Gender | '',
    createdFrom: '',
    createdTo: '',
  });

  readonly accounts = signal<Account[]>([]);
  readonly totalPages = signal(1);
  readonly totalItems = signal(0);
  readonly page = signal(1);

  readonly loading = signal(false);
  readonly loadError = signal('');

  readonly exportModalOpen = signal(false);
  readonly exporting = signal(false);
  readonly exportError = signal('');

  readonly hasAccounts = computed(() => this.accounts().length > 0);

  constructor() {
    this.loadAccounts();
    this.bindFilterChanges();
  }

  onPageChange(nextPage: number): void {
    if (nextPage < 1 || nextPage > this.totalPages() || nextPage === this.page()) {
      return;
    }

    this.page.set(nextPage);
    this.loadAccounts();
  }

  openExportModal(): void {
    this.exportError.set('');
    this.exportModalOpen.set(true);
  }

  onExportCancel(): void {
    if (this.exporting()) {
      return;
    }

    this.exportModalOpen.set(false);
  }

  onExportConfirm(exportFileName: ExportFileType): void {
    this.exporting.set(true);
    this.exportError.set('');

    const filters = this.filterForm.getRawValue();

    this.adminAccountService
      .exportAccounts({
        exportFileName,
        page: this.page(),
        limit: PAGE_SIZE,
        ...filters,
      })
      .pipe(finalize(() => this.exporting.set(false)))
      .subscribe({
        next: (blob) => {
          this.downloadBlob(blob, EXPORT_FILE_NAME[exportFileName]);
          this.exportModalOpen.set(false);
        },
        error: () => {
          this.exportError.set('Failed to export accounts. Please try again.');
        },
      });
  }

  private bindFilterChanges(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => {
        this.page.set(1);
        this.loadAccounts();
      });
  }

  private loadAccounts(): void {
    const filters = this.filterForm.getRawValue();
    const query: AccountReportQuery = {
      page: this.page(),
      limit: PAGE_SIZE,
      ...filters,
    };

    this.loading.set(true);
    this.loadError.set('');

    this.adminAccountService
      .getAccounts(query)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.accounts.set(res.data ?? []);
          this.totalPages.set(res.metaData?.totalPages ?? 1);
          this.totalItems.set(res.metaData?.totalItems ?? res.data?.length ?? 0);
        },
        error: () => {
          this.accounts.set([]);
          this.loadError.set('Failed to load accounts. Please try again.');
        },
      });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
