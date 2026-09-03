import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, finalize, forkJoin, of } from 'rxjs';
import { UI_CLASS_NAME } from '../../../../shared/constant/className.constant';
import { ExportAccountsModalComponent } from './exportAccounts-modal.component';
import { PaginationBarComponent } from '../../../../shared/component/paginationBar.component';
import { AdminAccountService } from './adminAccount.service';
import {
  EXPORT_FILE_NAME,
  type Account,
  type AccountStatus,
  type AccountRole,
  type AssignableAccountRole,
  type AccountReportQuery,
  type ExportFileType,
  type Gender,
} from './adminAccount.type';

const PAGE_SIZE = 6;
const ASSIGNABLE_PERMISSION_ROLES: AssignableAccountRole[] = ['CUSTOMER', 'CONTRIBUTOR', 'SHIPPER'];

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

  readonly editModalOpen = signal(false);
  readonly selectedAccount = signal<Account | null>(null);
  readonly savingEdit = signal(false);
  readonly editError = signal('');
  readonly statusBusyId = signal<string | null>(null);

  readonly editForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]],
    address: ['', [Validators.required, Validators.maxLength(255)]],
    gender: ['OTHER' as Gender, Validators.required],
    customer: true,
    contributor: false,
    shipper: false,
    permissionToAdd: '' as AssignableAccountRole | '',
  });

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

  openEditModal(account: Account): void {
    this.selectedAccount.set(account);
    this.editError.set('');
    this.editForm.reset({
      firstName: account.firstName,
      lastName: account.lastName,
      phoneNumber: account.phoneNumber,
      address: account.address,
      gender: account.gender,
      customer: account.roles.includes('CUSTOMER'),
      contributor: account.roles.includes('CONTRIBUTOR'),
      shipper: account.roles.includes('SHIPPER'),
      permissionToAdd: ASSIGNABLE_PERMISSION_ROLES.find((role) => !account.roles.includes(role)) ?? '',
    });
    this.editModalOpen.set(true);
  }

  closeEditModal(): void {
    if (!this.savingEdit()) {
      this.editModalOpen.set(false);
      this.selectedAccount.set(null);
    }
  }

  saveAccount(): void {
    const account = this.selectedAccount();
    if (!account || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const formValue = this.editForm.getRawValue();
    const { customer, contributor, shipper } = formValue;
    const profileRequest = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phoneNumber: formValue.phoneNumber,
      address: formValue.address,
      gender: formValue.gender,
    };
    const roles: AssignableAccountRole[] = [];
    if (customer) roles.push('CUSTOMER');
    if (contributor) roles.push('CONTRIBUTOR');
    if (shipper) roles.push('SHIPPER');
    const permissionsProtected = this.isElevatedAccount(account);
    if (!permissionsProtected && roles.length === 0) {
      this.editError.set('Select at least one permission role.');
      return;
    }

    this.savingEdit.set(true);
    this.editError.set('');
    forkJoin({
      profile: this.adminAccountService.updateAccount(account.id, profileRequest),
      roles: permissionsProtected
        ? of({ isSuccess: true, data: account.roles })
        : this.adminAccountService.updateAccountRoles(account.id, { roles }),
    })
      .pipe(finalize(() => this.savingEdit.set(false)))
      .subscribe({
        next: ({ profile, roles: rolesResponse }) => {
          const updated = profile.data;
          const updatedRoles = rolesResponse.data ?? roles;
          if (updated) {
            this.accounts.update((accounts) =>
              accounts.map((item) =>
                item.id === account.id ? { ...item, ...updated, roles: updatedRoles } : item,
              ),
            );
          }
          this.editModalOpen.set(false);
          this.selectedAccount.set(null);
        },
        error: (error) => {
          this.editError.set(error.error?.message ?? 'Failed to update account.');
        },
      });
  }

  toggleBan(account: Account): void {
    const nextStatus = account.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    const verb = nextStatus === 'BLOCKED' ? 'ban' : 'unban';
    if (!window.confirm(`Are you sure you want to ${verb} ${account.firstName} ${account.lastName}?`)) {
      return;
    }
    this.changeStatus(account, nextStatus);
  }

  toggleLimit(account: Account): void {
    const nextStatus = account.status === 'LIMITED' ? 'ACTIVE' : 'LIMITED';
    const verb = nextStatus === 'LIMITED' ? 'limit' : 'restore full access for';
    if (!window.confirm(`Are you sure you want to ${verb} ${account.firstName} ${account.lastName}?`)) {
      return;
    }
    this.changeStatus(account, nextStatus);
  }

  statusClass(status: AccountStatus): string {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
      case 'LIMITED': return 'bg-amber-100 text-amber-700';
      case 'BLOCKED': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  roleClass(role: AccountRole): string {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-700';
      case 'ADMIN': return 'bg-blue-100 text-blue-700';
      case 'CONTRIBUTOR': return 'bg-cyan-100 text-cyan-700';
      case 'SHIPPER': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  assignedPermissionRoles(): AssignableAccountRole[] {
    return ASSIGNABLE_PERMISSION_ROLES.filter((role) => this.permissionControl(role).value);
  }

  availablePermissionRoles(): AssignableAccountRole[] {
    const assigned = this.assignedPermissionRoles();
    return ASSIGNABLE_PERMISSION_ROLES.filter((role) => !assigned.includes(role));
  }

  addPermission(): void {
    const role = this.editForm.controls.permissionToAdd.value;
    if (!role) {
      return;
    }

    this.setPermission(role, true);
    this.editError.set('');
    this.selectNextAvailablePermission();
  }

  removePermission(role: AssignableAccountRole): void {
    if (this.assignedPermissionRoles().length === 1) {
      this.editError.set('Each account must keep at least one permission role.');
      return;
    }

    this.setPermission(role, false);
    this.editError.set('');
    this.editForm.controls.permissionToAdd.setValue(role);
  }

  permissionDescription(role: AssignableAccountRole): string {
    if (role === 'CUSTOMER') return 'Browse products, buy items, and manage a cart.';
    if (role === 'CONTRIBUTOR') return 'Create shops and manage products for sale.';
    return 'Accept pickup work and complete customer deliveries.';
  }

  isElevatedAccount(account: Account | null): boolean {
    return account?.roles.some((role) => role === 'ADMIN' || role === 'SUPER_ADMIN') ?? false;
  }

  private setPermission(role: AssignableAccountRole, assigned: boolean): void {
    const control = this.permissionControl(role);
    control.setValue(assigned);
    control.markAsDirty();
  }

  private permissionControl(role: AssignableAccountRole) {
    if (role === 'CUSTOMER') return this.editForm.controls.customer;
    if (role === 'CONTRIBUTOR') return this.editForm.controls.contributor;
    return this.editForm.controls.shipper;
  }

  private selectNextAvailablePermission(): void {
    this.editForm.controls.permissionToAdd.setValue(this.availablePermissionRoles()[0] ?? '');
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
          const accounts = (res.data ?? []).map((account) => ({
            ...account,
            status: 'UNKNOWN' as AccountStatus,
            roles: [] as AccountRole[],
          }));
          this.accounts.set(accounts);
          this.totalPages.set(res.metaData?.totalPages ?? 1);
          this.totalItems.set(res.metaData?.totalItems ?? res.data?.length ?? 0);
          this.loadAccountStatuses(accounts);
          this.loadAccountRoles(accounts);
        },
        error: () => {
          this.accounts.set([]);
          this.loadError.set('Failed to load accounts. Please try again.');
        },
      });
  }

  private loadAccountStatuses(accounts: Account[]): void {
    if (accounts.length === 0) {
      return;
    }
    this.adminAccountService.getAccountStatuses(accounts.map((account) => account.id)).subscribe({
      next: (res) => {
        const statuses = res.data ?? {};
        this.accounts.update((items) =>
          items.map((item) => ({ ...item, status: statuses[item.id] ?? 'UNKNOWN' })),
        );
      },
    });
  }

  private loadAccountRoles(accounts: Account[]): void {
    if (accounts.length === 0) {
      return;
    }
    this.adminAccountService.getAccountRoles(accounts.map((account) => account.id)).subscribe({
      next: (res) => {
        const roles = res.data ?? {};
        this.accounts.update((items) =>
          items.map((item) => ({ ...item, roles: roles[item.id] ?? [] })),
        );
      },
    });
  }

  private changeStatus(
    account: Account,
    status: Exclude<AccountStatus, 'UNKNOWN' | 'INACTIVE' | 'CLOSED'>,
  ): void {
    this.statusBusyId.set(account.id);
    this.adminAccountService
      .updateAccountStatus(account.id, status)
      .pipe(finalize(() => this.statusBusyId.set(null)))
      .subscribe({
        next: (res) => {
          const updatedStatus = res.data ?? status;
          this.accounts.update((items) =>
            items.map((item) =>
              item.id === account.id ? { ...item, status: updatedStatus } : item,
            ),
          );
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
