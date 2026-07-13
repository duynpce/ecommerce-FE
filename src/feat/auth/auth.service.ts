import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { ResponseDto } from '../../shared/dto/response.dto';
import { SKIP_GLOBAL_ERROR_HANDLER } from '../../core/interceptor/error.interceptor';
import { getStoredAuthServer } from './auth.type';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  isLoggedIn(): Observable<boolean> {
    if(!getStoredAuthServer()) {
      return of(false);
    }

    return this.http
      .get<ResponseDto<boolean>>(
        `/v1/auth/${getStoredAuthServer()}/me`,
      )
      .pipe(
        map((res) => res.isSuccess && res.data === true),
        catchError(() => of(false))
      );
  }

  
}