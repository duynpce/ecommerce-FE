import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TOAST_ON_SUCCESS } from '../../../../core/interceptor/success.interceptor';
import type { ResponseDto } from '../../../../shared/dto/response.dto';
import type {
  Account,
  AccountReportQuery,
  ExportAccountsRequest,
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
