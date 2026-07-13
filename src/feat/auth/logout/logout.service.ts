import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { TOAST_ON_SUCCESS } from '../../../core/interceptor/success.interceptor';
import type { ResponseDto } from '../../../shared/dto/response.dto';
import { clearStoredAuthServer, type AuthServer } from '../auth.type';

@Injectable({ providedIn: 'root' })
export class LogoutService {
	private readonly http = inject(HttpClient);

	logout(authServer: AuthServer): Observable<ResponseDto<unknown>> {
		return this.http
			.post<ResponseDto<unknown>>(`/v1/auth/${authServer}/logout`, null, {
				context: new HttpContext().set(TOAST_ON_SUCCESS, true),
			})
			.pipe(finalize(() => { 
				this.clearClientAuthState(); 
				window.location.reload();
			}));
	}

	clearClientAuthState(): void {
		sessionStorage.removeItem('idToken');
		clearStoredAuthServer();
	}
}
