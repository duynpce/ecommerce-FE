import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TOAST_ON_SUCCESS } from '../../../../core/interceptor/success.interceptor';
import type { ResponseDto } from '../../../../shared/dto/response.dto';
import type {
  Account,
  AccountStatus,
  AccountRole,
  AccountReportQuery,
  ExportAccountsRequest,
  UpdateAccountRequest,
  UpdateAccountRolesRequest,
} from './adminAccount.type';  

@Injectable({ providedIn: 'root' })
export class AdminAccountService {
  private readonly http = inject(HttpClient);

  /** user-service: GET /accounts/report — paginated account list for the admin dashboard */
  getAccounts(query: AccountReportQuery): Observable<ResponseDto<Account[]>> {
    return this.http.get<ResponseDto<Account[]>>('/v1/users/account-profiles/report', {
      params: this.buildFilterParams(query),
    });
  }

  getAccountStatuses(accountIds: string[]): Observable<ResponseDto<Record<string, AccountStatus>>> {
    let params = new HttpParams();
    for (const id of accountIds) {
      params = params.append('ids', id);
    }
    return this.http.get<ResponseDto<Record<string, AccountStatus>>>(
      '/v1/auth/local/admin/accounts/statuses',
      { params },
    );
  }

  getAccountRoles(accountIds: string[]): Observable<ResponseDto<Record<string, AccountRole[]>>> {
    let params = new HttpParams();
    for (const id of accountIds) {
      params = params.append('ids', id);
    }
    return this.http.get<ResponseDto<Record<string, AccountRole[]>>>(
      '/v1/auth/local/admin/accounts/roles',
      { params },
    );
  }

  updateAccount(accountId: string, request: UpdateAccountRequest): Observable<ResponseDto<Account>> {
    return this.http.put<ResponseDto<Account>>(
      `/v1/users/account-profiles/admin/${accountId}`,
      request,
      { context: new HttpContext().set(TOAST_ON_SUCCESS, true) },
    );
  }

  updateAccountStatus(
    accountId: string,
    status: Exclude<AccountStatus, 'UNKNOWN'>,
  ): Observable<ResponseDto<AccountStatus>> {
    return this.http.put<ResponseDto<AccountStatus>>(
      `/v1/auth/local/admin/accounts/${accountId}/status`,
      { status },
      { context: new HttpContext().set(TOAST_ON_SUCCESS, true) },
    );
  }

  updateAccountRoles(
    accountId: string,
    request: UpdateAccountRolesRequest,
  ): Observable<ResponseDto<AccountRole[]>> {
    return this.http.put<ResponseDto<AccountRole[]>>(
      `/v1/auth/local/admin/accounts/${accountId}/roles`,
      request,
      { context: new HttpContext().set(TOAST_ON_SUCCESS, false) },
    );
  }

  /** report-service: GET /accounts/export — generates and streams back the export file as a blob */
  exportAccounts(request: ExportAccountsRequest): Observable<Blob> {
    const params = this.buildFilterParams(request).set('exportFileName', request.exportFileName);

    return this.http.get('/v1/reports/account-profiles/export', {
      params,
      responseType: 'blob',
      context: new HttpContext().set(TOAST_ON_SUCCESS, false),
    });
  }

  /**
   * UI pagination is 1-based ("Page 1 of N") but the API's `page` field is
   * 0-based (AccountReportFilter.page has minimum: 0, so the first page is 0).
   * Without this conversion, requesting UI "page 1" actually asks the API
   * for its *second* page, which can come back empty even though
   * metaData.totalItems correctly reports records exist.
   */
  private buildFilterParams(query: AccountReportQuery): HttpParams {
    const apiPage = Math.max(query.page - 1, 0);
  
    let params = new HttpParams().set('page', apiPage).set('limit', query.limit);

    if (query.firstName) {
      params = params.set('firstName', query.firstName);
    }

    if (query.lastName) {
      params = params.set('lastName', query.lastName);
    }

    if (query.phoneNumber) {
      params = params.set('phoneNumber', query.phoneNumber);
    }

    if (query.gender) {
      params = params.set('gender', query.gender);
    }

    if (query.createdFrom) {
      params = params.set('createdFrom', query.createdFrom);
    }

    if (query.createdTo) {
      params = params.set('createdTo', query.createdTo);
    }

    return params;
  }
}
