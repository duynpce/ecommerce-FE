export type ExportFormat = 'PDF' | 'XLSX';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

// ── Account report ────────────────────────────────────────────────────────────

export interface AccountReportFilter {
  exportFileName: ExportFormat;   // required by the API
  page:           number;         // required
  limit:          number;         // required
  firstName?:     string;
  lastName?:      string;
  gender?:        Gender;
  phoneNumber?:   string;
  createdFrom?:   string;         // ISO date yyyy-MM-dd
  createdTo?:     string;
}

// ── Transaction report ────────────────────────────────────────────────────────

import type { TransactionStatus } from './transaction.service.type';

export interface TransactionReportFilter {
  exportFileName: ExportFormat;   // added on the Angular side; mapped to format param
  page:           number;
  limit:          number;
  productId?:     string;
  status?:        TransactionStatus;
  createdFrom?:   string;
  createdTo?:     string;
}
