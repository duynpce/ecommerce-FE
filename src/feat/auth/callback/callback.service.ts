import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { TokenService } from '../../../core/token.service';
import { TOAST_ON_SUCCESS } from '../../../core/interceptor/success.interceptor';
import type { ResponseDto } from '../../../shared/dto/response.dto';
import type { AuthServer, CallbackRequest, TokenResponse } from '../auth.type';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class CallbackService {
	private readonly http = inject(HttpClient);
	private readonly toastr = inject(ToastrService);
	private readonly tokenService = inject(TokenService);

	callback(
		authServer: AuthServer,
		payload: CallbackRequest
	): Observable<ResponseDto<TokenResponse>> {
		return this.http
			.post<ResponseDto<TokenResponse>>(`/v1/auth/${authServer}/callback`, payload, {
				context: new HttpContext().set(TOAST_ON_SUCCESS, true),
			})
			.pipe(
				tap((res) => {
					const accessToken = res.data?.accessToken;
					if (accessToken) {
					this.tokenService.set(accessToken);
						this.toastr.success(`Login successful: ${accessToken}`);
					}
				})
			);
	}
}
