import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { ResponseDto } from '../../shared/dto/response.dto';
import { getStoredAuthServer } from './auth.type';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  isLoggedIn(): Observable<boolean> {
    if (!getStoredAuthServer()) {
      return of(false);
    }

    if(!this.isActive()) {
      this.toastr.warning('Please complete your profile before proceeding.');
      this.router.navigate(['/complete-profile']);
    }

    return this.http
      .get<ResponseDto<boolean>>(`/v1/auth/${getStoredAuthServer()}/me`)
      .pipe(
        map((res) => {
          localStorage.setItem('userId', res.data.toString());
          return res.isSuccess;
        }),
        catchError(() => of(false))
      );
  }

  /**
   * Returns whether the current user has completed their profile.
   * Reads the value persisted by CallbackComponent.
   * Defaults to true so that local-auth users (who never go through callback)
   * are never sent to the complete-profile page.
   */
  isActive(): boolean {
    const stored = localStorage.getItem('isActive');
    // absent → local auth user, treat as active
    if (stored === null) return true;
    return stored === 'true';
  }
}
