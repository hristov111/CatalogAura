import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ProfileDetailComponent } from './components/profile-detail/profile-detail.component';
import { NotFoundComponent } from './components/not-found/not-found.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'profile/:id', component: ProfileDetailComponent },
  { path: '**', component: NotFoundComponent }
];
