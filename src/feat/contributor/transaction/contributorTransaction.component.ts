import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  TransactionService,
  TransactionResponse,
  TransactionStatus,
} from '../../../shared/service/transaction.service';
import { ReportService } from '../../../shared/service/report.service';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { DatePipe, DecimalPipe, LowerCasePipe, NgClass, SlicePipe } from '@angular/common';

/** Tabs visible on the contributor order page, mapped to their BPMN statuses. */
type ContributorTab = 'PENDING' | 'PACKING' | 'DELIVERING' | 'COMPLETED';

interface TabConfig {
  status: ContributorTab;
  label: string;
  badgeClass: string;
  count: ReturnType<typeof signal<number>>;
}

@Component({
  selector: 'app-contributor-transaction',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DecimalPipe, DatePipe, NgClass, SlicePipe, LowerCasePipe],
  templateUrl: './contributorTransaction.component.html',
})
export class ContributorTransactionComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly reportService      = inject(ReportService);
  private readonly toastr             = inject(ToastrService);
  private readonly router             = inject(Router);
  private readonly fb                 = inject(FormBuilder);

  readonly ui           = UI_CLASS_NAME;
  readonly loading      = signal(false);
  readonly exporting    = signal<'PDF' | 'XLSX' | null>(null);
  readonly transactions = signal<TransactionResponse[]>([]);
  readonly totalPages   = signal(0);
  readonly currentPage  = signal(0);
  readonly activeTab    = signal<ContributorTab>('PENDING');

  /** Per-tab counts shown in the tab badges (loaded on init, refreshed after actions). */
  private readonly pendingCount    = signal(0);
  private readonly packingCount    = signal(0);
  private readonly deliveringCount = signal(0);
  private readonly completedCount  = signal(0);

  readonly tabs: TabConfig[] = [
    {
      status:     'PENDING',
      label:      'New Orders',
      badgeClass: 'bg-amber-100 text-amber-700',
      count:      this.pendingCount,
    },
    {
      status:     'PACKING',
      label:      'Packing',
      badgeClass: 'bg-blue-100 text-blue-700',
      count:      this.packingCount,
    },
    {
      status:     'DELIVERING',
      label:      'Delivering',
      badgeClass: 'bg-violet-100 text-violet-700',
      count:      this.deliveringCount,
    },
    {
      status:     'COMPLETED',
      label:      'Completed',
      badgeClass: 'bg-emerald-100 text-emerald-700',
      count:      this.completedCount,
    },
  ];

  readonly activeTabLabel = computed(
    () => this.tabs.find(t => t.status === this.activeTab())?.label ?? ''
  );

  readonly filterForm = this.fb.group({
    createdFrom: [''],
    createdTo:   [''],
  });

  ngOnInit(): void {
    this.refreshCounts();
    this.load(0);
  }

  /** Fetch badge counts for every tab independently. */
  private refreshCounts(): void {
    const tabs: ContributorTab[] = ['PENDING', 'PACKING', 'DELIVERING', 'COMPLETED'];
    tabs.forEach(status => {
      this.transactionService.contributorSearch({ page: 0, limit: 1, status }).subscribe({
        next: (res) => {
          const count = res.metaData?.totalItems ?? res.data?.length ?? 0;
          this.setCount(status, count);
        },
      });
    });
  }

  private setCount(status: ContributorTab, n: number): void {
    if (status === 'PENDING')    this.pendingCount.set(n);
    if (status === 'PACKING')    this.packingCount.set(n);
    if (status === 'DELIVERING') this.deliveringCount.set(n);
    if (status === 'COMPLETED')  this.completedCount.set(n);
  }

  switchTab(tab: ContributorTab): void {
    this.activeTab.set(tab);
    this.filterForm.reset();
    this.load(0);
  }

  load(page: number): void {
    this.loading.set(true);
    const f = this.filterForm.value;

    this.transactionService.contributorSearch({
      page,
      limit:       10,
      status:      this.activeTab(),
      createdFrom: f.createdFrom || undefined,
      createdTo:   f.createdTo   || undefined,
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.transactions.set(res.data ?? []);
        this.totalPages.set(res.metaData?.totalPages ?? 1);
        this.currentPage.set(page);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastr.error(err?.error?.message ?? 'Failed to load orders.');
      },
    });
  }

  onSearch(): void { this.load(0); }

  onReset(): void {
    this.filterForm.reset();
    this.load(0);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.load(page);
  }

  viewDetail(id: string): void {
    this.router.navigate(['/user/contributor/transactions', id]);
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  exportReport(format: 'PDF' | 'XLSX'): void {
    if (this.exporting()) return;
    this.exporting.set(format);

    const f = this.filterForm.value;

    this.reportService.exportTransactionReport({
      exportFileName: format,
      page:           0,
      limit:          10_000,
      status:         this.activeTab(),        // export only the active tab's status
      createdFrom:    f.createdFrom || undefined,
      createdTo:      f.createdTo   || undefined,
    }).subscribe({
      next: (blob) => {
        this.exporting.set(null);
        this.reportService.download(blob, format, `${this.activeTab().toLowerCase()}_orders`);
        this.toastr.success(`${format} downloaded.`);
      },
      error: (err) => {
        this.exporting.set(null);
        this.toastr.error(err?.error?.message ?? 'Export failed.');
      },
    });
  }

  statusClass(status: TransactionStatus): string {
    const map: Partial<Record<TransactionStatus, string>> = {
      PENDING:    'bg-amber-100 text-amber-700',
      PACKING:    'bg-blue-100 text-blue-700',
      DELIVERING: 'bg-violet-100 text-violet-700',
      COMPLETED:  'bg-emerald-100 text-emerald-700',
      REJECTED:   'bg-red-100 text-red-700',
      RETURNED:   'bg-slate-100 text-slate-600',
    };
    return map[status] ?? 'bg-slate-100 text-slate-600';
  }
}