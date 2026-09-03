import { z } from 'zod';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type AccountStatus = 'ACTIVE' | 'LIMITED' | 'BLOCKED' | 'INACTIVE' | 'CLOSED' | 'UNKNOWN';
export type AccountRole = 'CUSTOMER' | 'CONTRIBUTOR' | 'SHIPPER' | 'ADMIN' | 'SUPER_ADMIN';
export type AssignableAccountRole = Extract<AccountRole, 'CUSTOMER' | 'CONTRIBUTOR' | 'SHIPPER'>;

/** Matches AccountReportResponsive from the user-service OpenAPI spec */
export interface Account {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  gender: Gender;
  status: AccountStatus;
  roles: AccountRole[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAccountRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  gender: Gender;
}

export interface UpdateAccountRolesRequest {
  roles: AssignableAccountRole[];
}

export const accountFilterSchema = z.object({
  firstName: z.string().trim().max(100, 'First name is too long.'),
  lastName: z.string().trim().max(100, 'Last name is too long.'),
  phoneNumber: z.string().trim().max(20, 'Phone number is too long.'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', '']),
  createdFrom: z.string(),
  createdTo: z.string(),
});

export type AccountFilterValue = z.infer<typeof accountFilterSchema>;

/** Matches AccountReportFilter (user-service): page/limit required, rest optional */
export interface AccountReportQuery {
  page: number;
  limit: number;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  gender?: Gender | '';
  createdFrom?: string;
  createdTo?: string;
}

/** Matches AccountReportFilter.exportFileName enum (report-service) */
export const EXPORT_FILE_TYPES = ['PDF', 'XLSX'] as const;
export type ExportFileType = (typeof EXPORT_FILE_TYPES)[number];

export interface ExportAccountsRequest extends AccountReportQuery {
  exportFileName: ExportFileType;
}

export const EXPORT_FILE_NAME: Record<ExportFileType, string> = {
  PDF: 'accounts.pdf',
  XLSX: 'accounts.xlsx',
};
