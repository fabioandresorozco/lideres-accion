import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideToastr } from 'ngx-toastr';
import { environment } from '../environment';
import { provideServiceWorker } from '@angular/service-worker';


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideToastr(environment.alerts),
    provideClientHydration(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideAnimationsAsync(),
    provideServiceWorker('ngsw-worker.js', {
      // Se activa en cualquier entorno desplegado (prod, dev, medellin).
      // isDevMode() no aplica aquí porque los builds de Firebase con
      // --configuration=development también tienen optimization:false,
      // lo que hace que isDevMode() retorne true y deshabilite el SW.
      enabled: environment.enableServiceWorker ?? !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
};
