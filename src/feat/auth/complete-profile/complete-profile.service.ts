import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TOAST_ON_SUCCESS } from '../../../core/interceptor/success.interceptor';
import type { ResponseDto } from '../../../shared/dto/response.dto';

export interface CompleteProfileRequest {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

@Injectable({ providedIn: 'root' })
export class CompleteProfileService {
  private readonly http = inject(HttpClient);

  completeProfile(payload: CompleteProfileRequest): Observable<ResponseDto<void>> {
    return this.http.post<ResponseDto<void>>(
      `/v1/auth/remote/complete-profile`,
      payload,
      {
        context: new HttpContext().set(TOAST_ON_SUCCESS, true),
      }
    );
  }

  checkUsernameExists(value: string): Observable<boolean> {
    return this.http
      .get<ResponseDto<boolean>>(
        `/v1/auth/local/username/${encodeURIComponent(value)}`
      )
      .pipe(map((res) => res.data ?? false));
  }

  checkPhoneNumberExists(value: string): Observable<boolean> {
    return this.http
      .get<ResponseDto<boolean>>(
        `/v1/users/account-profiles/phone-number/${encodeURIComponent(value)}`
      )
      .pipe(map((res) => res.data ?? false));
  }
}
