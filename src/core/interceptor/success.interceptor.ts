import {
  HttpInterceptorFn,
  HttpEvent,
  HttpResponse,
  HttpContextToken,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { tap } from "rxjs/operators";
import type { ResponseDto } from "../../shared/dto/response.dto";

// ─── Context token ────────────────────────────────────────────────────────────
// Thay thế cho toastMessageWhenSuccess trong axios config
// string  → toast đúng string đó
// true    → toast message từ response
// null    → không toast gì cả (default)
export const TOAST_ON_SUCCESS = new HttpContextToken<boolean | string | null>(
  () => null
);

export const successInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);

  return next(req).pipe(
    tap((event: HttpEvent<unknown>) => {
    if (!(event instanceof HttpResponse)) return;

    const body = event.body as ResponseDto<unknown> | null;
    const toastOpt = req.context.get(TOAST_ON_SUCCESS);
    if (!toastOpt) return;

    const message =
      typeof toastOpt === "string"
        ? toastOpt
        : (body?.message ?? null);

    if (message) toastr.success(message);
  })
  );
};