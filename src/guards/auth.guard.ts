import { Injectable, inject } from '@angular/core';
import { CanActivate, CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Protects routes that require authentication
 * Usage: Add to route definition with canActivate: [authGuard]
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to initialize
  if (authService.isLoading()) {
    // Could show a loading screen here
    return false;
  }

  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  const returnUrl = state.url;
  
  // Redirect to login page with return url
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl }
  });
};

/**
 * Guest Guard - Redirects authenticated users away from auth pages
 * Usage: Add to route definition for login/register pages with canActivate: [guestGuard]
 */
export const guestGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to initialize
  if (authService.isLoading()) {
    return false;
  }

  // If user is authenticated, redirect to home
  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }

  // User is not authenticated, allow access to auth pages
  return true;
};

/**
 * Email Verified Guard - Protects routes that require email verification
 * Usage: Add to route definition with canActivate: [emailVerifiedGuard]
 */
export const emailVerifiedGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to initialize
  if (authService.isLoading()) {
    return false;
  }

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  // Check if email is verified
  const user = authService.getUser();
  if (user && user.emailVerified) {
    return true;
  }

  // Email not verified, redirect to verification page
  return router.createUrlTree(['/auth/verify-email']);
};


