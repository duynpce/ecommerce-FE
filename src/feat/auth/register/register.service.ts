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
		authServer: AuthServer,
		payload: RegisterRequest
	): Observable<ResponseDto<string>> {
		return this.http.post<ResponseDto<string>>(`/v1/auth/${authServer}/register`, payload, {
			context: new HttpContext().set(TOAST_ON_SUCCESS, true),
		});
	}

	checkAuthFieldExists(
		authServer: AuthServer,
		paramName: 'username' | 'email',
		value: string
	): Observable<boolean> {
		return this.http
			.get<ResponseDto<boolean> | ResponseDto<{ exists: boolean }> | { exists: boolean }>(
				`/v1/auth/${authServer}/${paramName}/${encodeURIComponent(value)}`
			)
			.pipe(map((res) => this.normalizeExists(res)));
	}

	checkUserFieldExists(paramName: 'phoneNumber', value: string): Observable<boolean> {
		return this.http
			.get<ResponseDto<boolean> | ResponseDto<{ exists: boolean }> | { exists: boolean }>(
				`/v1/users/${paramName}/${encodeURIComponent(value)}`
			)
			.pipe(map((res) => this.normalizeExists(res)));
	}

	private normalizeExists(
		res: ResponseDto<boolean> | ResponseDto<{ exists: boolean }> | { exists: boolean }
	): boolean {
		if ('data' in res) {
			if (typeof res.data === 'boolean') {
				return res.data;
			}

			if (res.data && typeof res.data === 'object' && 'exists' in res.data) {
				return Boolean(res.data.exists);
			}

			return false;
		}

		return Boolean(res.exists);
	}
}
