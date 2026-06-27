import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpClient,
  HttpContextToken,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { catchError, filter, switchMap, take } from "rxjs/operators";
import { environment } from "../../environments/environment";
import { TokenService } from "../token.service";
import { clearStoredAuthServer, getStoredAuthServer } from "../../feat/auth/auth.type";
import type { ResponseDto } from "../../shared/dto/response.dto";
import type { TokenResponse } from "../../feat/auth/auth.type";

// ─── Context tokens (thay thế cho skipGlobalErrorHandler trong axios config) ──
export const SKIP_GLOBAL_ERROR_HANDLER = new HttpContextToken<boolean>(() => false);

// ─── Refresh token state ──────────────────────────────────────────────────────
// Dùng module-level variable để share state giữa các request concurrent
let isRefreshing = false;
const refreshToken$ = new BehaviorSubject<string | null>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  const router = inject(Router);
  const http = inject(HttpClient);
  const tokenService = inject(TokenService);

  // Skip global error handling for refresh request itself to avoid loops.
  if (/\/v1\/auth\/(local|remote)\/refresh$/.test(req.url)) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (req.context.get(SKIP_GLOBAL_ERROR_HANDLER)) {
        return throwError(() => error);
      }

      return handleError(error, req, next, toastr, router, http, tokenService);
    })
  );
};

function handleError(
  error: HttpErrorResponse,
  req: any,
  next: any,
  toastr: ToastrService,
  router: Router,
  http: HttpClient,
  tokenService: TokenService
): Observable<any> {

  if (error.status === 401) {
    return handle401(error, req, next, toastr, router, http, tokenService);
  }

  if (error.status === 403 && !error.error?.message) {
    toastr.error("You don't have permission to access this resource.", undefined, {
      toastClass: "forbidden-error",
    });
    return throwError(() => error);
  }

  if (error.status === 408) {
    toastr.error("Request timeout. Please try again.", undefined, {
      toastClass: "timeout-error",
    });
    return throwError(() => error);
  }

  if (error.status === 0) {
    toastr.error("Please check your connection.", undefined, {
      toastClass: "network-error",
    });
    return throwError(() => error);
  }

  toastr.error(
    error.error?.message ?? "An error occurred. Please try again.",
    undefined,
    { toastClass: "generic-error" }
  );
  return throwError(() => error);
}

function handle401(
  error: HttpErrorResponse,
  req: any,
  next: any,
  toastr: ToastrService,
  router: Router,
  http: HttpClient,
  tokenService: TokenService
): Observable<any> {
  toastr.info("Session expired. Attempting to refresh token...", undefined, {
    toastClass: "refreshing-token",
  });
  
  if (isRefreshing) {
    return refreshToken$.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token) =>
        next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
      )
    );
  }

  const authServer = getStoredAuthServer();

  if (!authServer) {
    handleSessionExpired(toastr, router, tokenService);
    return throwError(() => error);
  }

  isRefreshing = true;
  refreshToken$.next(null);

  return http
    .post<ResponseDto<TokenResponse>>(
      `${environment.ROOT_API_URL}/v1/auth/${authServer}/refresh`,
      null,
      { withCredentials: true }
    )
    .pipe(
      switchMap((res) => {
        const accessToken = res.data?.accessToken;
  
        if (!accessToken) {
          throw new Error("Refresh did not return access token");
        }

        isRefreshing = false;
        tokenService.set(accessToken);

        refreshToken$.next(accessToken);
        return next(
          req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
        );
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        handleSessionExpired(toastr, router, tokenService);
        return throwError(() => refreshError);
      })
    );
}

// ─── Xử lý session hết hạn ───────────────────────────────────────────────────
function handleSessionExpired(toastr: ToastrService, router: Router, tokenService: TokenService): void {
  tokenService.set(null);
  clearStoredAuthServer();
  sessionStorage.setItem("previousPath", window.location.pathname);
  toastr.error("Session expired or not logged in");
  // setTimeout(() => router.navigate(["/login"]), 2000);
}