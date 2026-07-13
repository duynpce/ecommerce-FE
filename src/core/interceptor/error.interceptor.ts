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
import { clearStoredAuthServer, getStoredAuthServer } from "../../feat/auth/auth.type";
import type { ResponseDto } from "../../shared/dto/response.dto";

export const SKIP_GLOBAL_ERROR_HANDLER = new HttpContextToken<boolean>(() => false);

let isRefreshing = new BehaviorSubject<boolean>(false);
const refreshDone$ = new BehaviorSubject<boolean | null>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  const router = inject(Router);
  const http = inject(HttpClient);

  if (req.url.includes('/auth/local/refresh') || req.url.includes('/auth/remote/refresh')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (req.context.get(SKIP_GLOBAL_ERROR_HANDLER)) {
        return throwError(() => error);
      }

      return handleError(error, req, next, toastr, router, http);
    })
  );
};

function handleError(
  error: HttpErrorResponse,
  req: any,
  next: any,
  toastr: ToastrService,
  router: Router,
  http: HttpClient
): Observable<any> {

  if (error.status === 401) {
    return handle401(error, req, next, toastr, router, http);
  }

  if (error.status === 403 && !error.error?.message) {
    toastr.error("You don't have permission to access this resource.", undefined, {
      toastClass: "forbidden-error",
    });
    router.navigate(["/home"]);
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
): Observable<any> {

  if (isRefreshing.value) {
  
    return refreshDone$.pipe(
      filter((done) => done !== null),
      take(1),
      switchMap((success) => {
        if (success) {

          return next(req.clone({ withCredentials: true }));
        }
        return throwError(() => error);
      })
    );
  }

  const authServer = getStoredAuthServer();

  if (!authServer) {
    handleSessionExpired(toastr, router);
    return throwError(() => error);
  }

  isRefreshing.next(true);
  refreshDone$.next(null); 

  return http
    .post<ResponseDto<Set<string>>>(
      `/v1/auth/${authServer}/refresh`,
      null,
      { withCredentials: true }
    )
    .pipe(
      switchMap((res) => {
        isRefreshing.next(false);
        refreshDone$.next(true); 
        return next(req.clone({ withCredentials: true })); 
      }),
      catchError((refreshError) => {
        isRefreshing.next(false);
        refreshDone$.next(false); 
        handleSessionExpired(toastr, router);
        return throwError(() => refreshError);
      })
    );
}

function handleSessionExpired(toastr: ToastrService, router: Router): void {
  clearStoredAuthServer();
  sessionStorage.setItem("previousPath", window.location.pathname);
  toastr.error("Session expired or not logged in");
  setTimeout(() => router.navigate(["/login"]), 2000);
}