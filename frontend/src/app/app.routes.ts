import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/user', pathMatch: 'full' },
  { path: 'feed', loadComponent: () => import('./feed/feed').then(m => m.Feed) },
  { path: 'user', loadComponent: () => import('./user/user').then(m => m.User) },
  { path: 'upload', loadComponent: () => import('./upload/upload').then(m => m.Upload) },
  { path: '', redirectTo: '/user' }
];
