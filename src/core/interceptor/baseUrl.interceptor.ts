import { HttpInterceptorFn } from "@angular/common/http";
import { environment } from "../../environments/environment";

export const baseUrlInterceptor :HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('http://') && !req.url.startsWith('https://')) {
    const clonedReq = req.clone({
      url: `${environment.ROOT_API_URL}${req.url}`, withCredentials: true
    });
    return next(clonedReq);
  }
  
  return next(req);
  
}