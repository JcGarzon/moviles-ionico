import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'tabs',
    loadChildren: () =>
      import('./tabs/tabs.routes').then((m) => m.routes),
    canActivate: [AuthGuard]
  },  {
    path: 'tab4',
    loadComponent: () => import('./tab4/tab4.page').then( m => m.Tab4Page)
  },
  {
    path: 'tab5',
    loadComponent: () => import('./tab5/tab5.page').then( m => m.Tab5Page)
  },
  {
    path: 'tab6',
    loadComponent: () => import('./tab6/tab6.page').then( m => m.Tab6Page)
  },
  {
    path: 'tab7',
    loadComponent: () => import('./tab7/tab7.page').then( m => m.Tab7Page)
  },
  {
    path: 'tab8',
    loadComponent: () => import('./tab8/tab8.page').then( m => m.Tab8Page)
  },

];
