import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { Router } from '@angular/router';

// TODO: Move to environment variables
const SUPABASE_URL = 'https://wgigbvraeojprbndnrmt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnaWdidnJhZW9qcHJibmRucm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MjYwNzgsImV4cCI6MjA4MTMwMjA3OH0.ocoXoi_X_MVOIcA5fyp5jwYyl-yHmC7wb8tC9h1O0g4';

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  fullName?: string;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  readonly currentUser = signal<User | null>(null);
  readonly authUser = signal<AuthUser | null>(null);
  readonly isAuthenticated = signal<boolean>(false);
  readonly isLoading = signal<boolean>(true);

  constructor(private router: Router) {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.init();
  }

  async init() {
    try {
      // Check for existing session
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (session?.user) {
        this.setUser(session.user, session);
      } else {
        this.clearUser();
      }

      // Listen for auth changes
      this.supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          this.setUser(session.user, session);
        } else {
          this.clearUser();
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private setUser(user: User, session: Session) {
    this.currentUser.set(user);
    this.authUser.set({
      id: user.id,
      email: user.email!,
      emailVerified: !!user.email_confirmed_at,
      fullName: user.user_metadata?.['full_name'],
      avatarUrl: user.user_metadata?.['avatar_url'],
    });
    this.isAuthenticated.set(true);
  }

  private clearUser() {
    this.currentUser.set(null);
    this.authUser.set(null);
    this.isAuthenticated.set(false);
  }

  /**
   * Register a new user with email and password
   */
  async register(email: string, password: string, fullName: string) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Registration successful. Please check your email to verify your account.',
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed',
      };
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Login successful',
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Invalid email or password',
      };
    }
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Google login error:', error);
      return {
        success: false,
        error: error.message || 'Google login failed',
      };
    }
  }

  /**
   * Login with GitHub OAuth
   */
  async loginWithGithub() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('GitHub login error:', error);
      return {
        success: false,
        error: error.message || 'GitHub login failed',
      };
    }
  }

  /**
   * Logout from current session
   */
  async logout() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;

      this.clearUser();
      this.router.navigate(['/auth/login']);
      
      return { success: true };
    } catch (error: any) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error.message || 'Logout failed',
      };
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAllDevices() {
    try {
      // This will invalidate all refresh tokens for the user
      const { error } = await this.supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;

      this.clearUser();
      this.router.navigate(['/auth/login']);
      
      return { success: true };
    } catch (error: any) {
      console.error('Logout all devices error:', error);
      return {
        success: false,
        error: error.message || 'Logout failed',
      };
    }
  }

  /**
   * Request password reset email
   */
  async forgotPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send reset email',
      };
    }
  }

  /**
   * Reset password with token (called from reset password page)
   */
  async resetPassword(newPassword: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Password reset successful. You can now login with your new password.',
      };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.message || 'Failed to reset password',
      };
    }
  }

  /**
   * Update password (when already logged in)
   */
  async updatePassword(newPassword: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Password updated successfully',
      };
    } catch (error: any) {
      console.error('Update password error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update password',
      };
    }
  }

  /**
   * Get current session token
   */
  async getToken(): Promise<string | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session?.access_token || null;
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  /**
   * Refresh session
   */
  async refreshSession() {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Refresh session error:', error);
      return {
        success: false,
        error: error.message || 'Failed to refresh session',
      };
    }
  }

  /**
   * Get user object
   */
  getUser() {
    return this.authUser();
  }

  /**
   * Check if user is authenticated
   */
  isAuth(): boolean {
    return this.isAuthenticated();
  }
}

