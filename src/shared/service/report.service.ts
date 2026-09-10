import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AccountReportFilter,
  TransactionReportFilter,
} from './report.service.type';

export type { ExportFormat, AccountReportFilter, TransactionReportFilter } from './report.service.type';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http        = inject(HttpClient);
  private readonly reportBase  = '/v1/reports';
  private readonly productBase = '/v1/products';

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Triggers a browser download from a raw Blob.
   * @param blob     the file bytes returned by the API
   * @param format   'PDF' | 'XLSX' — determines the file extension
   * @param baseName file stem, e.g. 'account_report'
   */
  download(blob: Blob, format: 'PDF' | 'XLSX', baseName: string): void {
    const ext      = format === 'PDF' ? 'pdf' : 'xlsx';
    const url      = URL.createObjectURL(blob);
    const anchor   = document.createElement('a');
    anchor.href     = url;
    anchor.download = `${baseName}.${ext}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  // ── Account report ─────────────────────────────────────────────────────────

  /**
   * GET /api/v1/reports/accounts/export
   * Returns raw bytes — caller should pass to `download()`.
   */
  exportAccountReport(filter: AccountReportFilter): Observable<Blob> {
    let params = new HttpParams()
      .set('exportFileName', filter.exportFileName)
      .set('page',           filter.page)
      .set('limit',          filter.limit);

    if (filter.firstName)   params = params.set('firstName',   filter.firstName);
    if (filter.lastName)    params = params.set('lastName',    filter.lastName);
    if (filter.gender)      params = params.set('gender',      filter.gender);
    if (filter.phoneNumber) params = params.set('phoneNumber', filter.phoneNumber);
    if (filter.createdFrom) params = params.set('createdFrom', filter.createdFrom);
    if (filter.createdTo)   params = params.set('createdTo',   filter.createdTo);

    return this.http.get(`${this.reportBase}/accounts/export`, {
      params,
      responseType: 'blob',     // <-- critical: tells HttpClient not to parse JSON
    });
  }

  // ── Transaction report ─────────────────────────────────────────────────────

  /**
   * GET /api/v1/reports/transactions/export
   * Returns raw bytes — caller should pass to `download()`.
   */
  exportTransactionReport(filter: TransactionReportFilter): Observable<Blob> {
    let params = new HttpParams()
      .set('exportFileName', filter.exportFileName)
      .set('page',           filter.page)
      .set('limit',          filter.limit);

    if (filter.productId)   params = params.set('productId',   filter.productId);
    if (filter.status)      params = params.set('status',      filter.status);
    if (filter.createdFrom) params = params.set('createdFrom', filter.createdFrom);
    if (filter.createdTo)   params = params.set('createdTo',   filter.createdTo);

    return this.http.get(`${this.reportBase}/transactions/export`, {
      params,
      responseType: 'blob',
    });
  }
}
