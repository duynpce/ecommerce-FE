import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { baseUrlInterceptor } from '../core/interceptor/baseUrl.interceptor';
import { errorInterceptor } from '../core/interceptor/error.interceptor';
import { requestInterceptor } from '../core/interceptor/request.interceptor';
import { successInterceptor } from '../core/interceptor/success.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
      provideBrowserGlobalErrorListeners(),
      provideRouter(routes),
      provideAnimations(),
      provideToastr({ positionClass: 'toast-top-right' }),     
      provideHttpClient(
      withInterceptors([
        baseUrlInterceptor,
        requestInterceptor,
        errorInterceptor,
        successInterceptor  
      ])
    )
     ],
};

