import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { baseUrlInterceptor } from '../core/interceptor/baseUrl.interceptor';
import { errorInterceptor } from '../core/interceptor/error.interceptor';
import { successInterceptor } from '../core/interceptor/success.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
      provideBrowserGlobalErrorListeners(),
      provideRouter(routes),
      provideAnimations(),
      provideToastr(),
     
      provideHttpClient(
      withInterceptors([
        baseUrlInterceptor,
        errorInterceptor,
        successInterceptor  
      ])
    )
     ],
};

