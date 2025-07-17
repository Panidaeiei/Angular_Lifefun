import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import localeTh from '@angular/common/locales/th';

// ลงทะเบียน locale ไทย
registerLocaleData(localeTh);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(), // ให้ HttpClient ทำงานได้ทั่วทั้งแอป
    provideAnimations(),
    provideAnimationsAsync(),
  ],
};
