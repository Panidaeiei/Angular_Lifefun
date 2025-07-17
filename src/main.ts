import { registerLocaleData } from '@angular/common';
import localeTh from '@angular/common/locales/th';
registerLocaleData(localeTh, 'th');
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));