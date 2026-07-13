import { HttpClient, HttpContext } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { SKIP_GLOBAL_ERROR_HANDLER } from "../../../core/interceptor/error.interceptor";
import { ResponseDto } from "../../../shared/dto/response.dto";
import { LoginRequest } from "../auth.type";

@Injectable({ providedIn: 'root' })
export class LoginService {
  private http = inject(HttpClient);
  
  login(loginRequest: LoginRequest): Observable<ResponseDto<Set<string>>> {
    return this.http.post<ResponseDto<Set<string>>>(
      `/v1/auth/local/login`,
      loginRequest,
      { context: new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLER, true) }
    );
  }
}