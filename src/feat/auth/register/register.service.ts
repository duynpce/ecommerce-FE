import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TOAST_ON_SUCCESS } from '../../../core/interceptor/success.interceptor';
import type { ResponseDto } from '../../../shared/dto/response.dto';
import type { AuthServer, RegisterRequest } from '../auth.type';

@Injectable({ providedIn: 'root' })
export class RegisterService {
	private readonly http = inject(HttpClient);

	register(
		payload: RegisterRequest
	): Observable<ResponseDto<string>> {
		return this.http.post<ResponseDto<string>>(`/v1/auth/local/register`, payload, {
			context: new HttpContext().set(TOAST_ON_SUCCESS, true),
		});
	}

	checkAuthFieldExists(
		authServer: AuthServer,
		paramName: 'username' | 'email',
		value: string
	): Observable<boolean> {
		return this.http
			.get<ResponseDto<boolean>>(
				`/v1/auth/local/${paramName}/${encodeURIComponent(value)}`
			)
			.pipe(map((res) => res.data ?? false));
	}

	checkUserFieldExists(paramName: 'phoneNumber', value: string): Observable<boolean> {
		return this.http
			.get<ResponseDto<boolean>>(
				`/v1/users/${paramName}/${encodeURIComponent(value)}`
			)
			.pipe(map((res) => res.data ?? false));
	}

}
