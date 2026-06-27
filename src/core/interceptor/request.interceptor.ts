import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { TokenService } from "../token.service";

export const requestInterceptor : HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const token = tokenService.get();

  if (!token) {
    return next(
      req.clone({
        withCredentials: true,
      })
    );
  }

  const clonedReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
    withCredentials: true
  });

  return next(clonedReq);
}