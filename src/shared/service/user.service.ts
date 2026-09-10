import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/response.dto';
import {
  AccountProfileResponse,
  UpdateAccountProfileRequest,
  ChangePasswordRequest,
  ContributorProfileResponse,
  UpdateContributorProfileRequest,
} from './user.service.type';

export type {
  Gender,
  AccountProfileResponse,
  UpdateAccountProfileRequest,
  ChangePasswordRequest,
  ContributorProfileResponse,
  UpdateContributorProfileRequest,
} from './user.service.type';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  /** Base path for the user-service account-profile endpoints */
  private readonly base = '/v1/users/account-profiles';

  // ── Profile ──────────────────────────────────────────────────────────────

  /** GET /v1/users/account-profiles/me — fetch the logged-in user's profile */
  getMyProfile(): Observable<ResponseDto<AccountProfileResponse>> {
    return this.http.get<ResponseDto<AccountProfileResponse>>(`${this.base}/me`);
  }

  /** PUT /v1/users/account-profiles/me — update the logged-in user's profile */
  updateMyProfile(
    body: UpdateAccountProfileRequest,
  ): Observable<ResponseDto<AccountProfileResponse>> {
    return this.http.put<ResponseDto<AccountProfileResponse>>(`${this.base}/me`, body);
  }

  // ── Contributor Profile ──────────────────────────────────────────────────

  /** GET /v1/users/contributor-profiles/me — fetch logged-in contributor's profile */
  getMyContributorProfile(): Observable<ResponseDto<ContributorProfileResponse>> {
    return this.http.get<ResponseDto<ContributorProfileResponse>>('/v1/users/contributor-profiles/me');
  }

  /** PUT /v1/users/contributor-profiles/me — update logged-in contributor's profile */
  updateMyContributorProfile(
    body: UpdateContributorProfileRequest,
  ): Observable<ResponseDto<ContributorProfileResponse>> {
    return this.http.put<ResponseDto<ContributorProfileResponse>>('/v1/users/contributor-profiles/me', body);
  }

  // ── Credentials ───────────────────────────────────────────────────────────

  /**
   * PUT /v1/auth/local/password — change password for local-auth users.
   * Sends { currentPassword, newPassword }.
   */
  changePassword(body: ChangePasswordRequest): Observable<ResponseDto<void>> {
    return this.http.put<ResponseDto<void>>('/v1/auth/local/password', body);
  }
}
