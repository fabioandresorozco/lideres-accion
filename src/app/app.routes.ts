import { Routes } from '@angular/router';
import { canActivate, redirectUnauthorizedTo } from '@angular/fire/auth-guard';

export const routes: Routes = [
    {
        path: 'private',
        loadChildren: () => import('./ui/pages/private/private.routes').then((m) => m.routes),
        ...canActivate(() => redirectUnauthorizedTo(['./public/login'])),
    },
    {
        path: 'public',
        loadChildren: () => import('./ui/pages/public/public.routes').then((m) => m.routes)
    },
    {
        path: '',
        redirectTo: 'private/home',
        pathMatch: 'prefix'
      },
      {
        path: '**',
        redirectTo: 'private/home',
        pathMatch: 'prefix'
      }

];
