import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ProfileDetailComponent } from './components/profile-detail/profile-detail.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { authGuard } from './guards/auth.guard';

// Lazy-loaded auth components
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
import { CallbackComponent } from './components/auth/callback/callback.component';

// Lazy-loaded user components
import { ProfileComponent } from './components/user/profile/profile.component';
import { SettingsComponent } from './components/user/settings/settings.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'profile/:id', component: ProfileDetailComponent },
  
  // Auth routes (accessible to everyone)
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent },
      { path: 'callback', component: CallbackComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  
  // User routes (protected, require authentication)
  {
    path: 'user',
    canActivate: [authGuard],
    children: [
      { path: 'profile', component: ProfileComponent },
      { path: 'settings', component: SettingsComponent },
      { path: '', redirectTo: 'profile', pathMatch: 'full' }
    ]
  },
  
  { path: '**', component: NotFoundComponent }
];
