import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

/**
 * JWT Authentication Service
 * Works with your custom auth endpoints:
 * - POST /auth/token - Create/get JWT token
 * - POST /auth/validate - Validate JWT token
 * 
 * Handles automatic token management:
 * - Token creation on first use
 * - Token validation
 * - Token refresh before expiry
 * - Token storage in localStorage
 */

export interface JWTToken {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
  user_id: string;
  expires_at?: string; // ISO timestamp
  issued_at?: string; // ISO timestamp
}

export interface TokenValidation {
  valid: boolean;
  user_id: string | null;
  expires_at?: string;
  issued_at?: string;
  error?: string;
}

export interface User {
  id: string;
  email?: string;
  name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JwtAuthService {
  private readonly TOKEN_STORAGE_KEY = 'jwt_token';
  private readonly USER_ID_STORAGE_KEY = 'user_id';
  private readonly TOKEN_ISSUED_AT_KEY = 'token_issued_at';

  // State
  readonly currentToken = signal<JWTToken | null>(null);
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);

  // Computed
  readonly userId = computed(() => this.currentUser()?.id || null);

  constructor(private router: Router) {
    this.loadTokenFromStorage();
  }

  /**
   * Load token from localStorage on init
   */
  private loadTokenFromStorage(): void {
    const tokenStr = localStorage.getItem(this.TOKEN_STORAGE_KEY);
    const userId = localStorage.getItem(this.USER_ID_STORAGE_KEY);
    const issuedAt = localStorage.getItem(this.TOKEN_ISSUED_AT_KEY);

    if (tokenStr && userId && issuedAt) {
      try {
        const token = JSON.parse(tokenStr) as JWTToken;
        
        // Check if token is expired
        const issuedTime = parseInt(issuedAt);
        const expiresIn = token.expires_in * 1000; // Convert to ms
        const expiryTime = issuedTime + expiresIn;
        
        if (Date.now() < expiryTime) {
          this.setToken(token);
          this.setUser({ id: userId });
          console.log('✅ Loaded valid token from storage');
        } else {
          console.log('⚠️ Stored token expired, clearing...');
          this.clearToken();
        }
      } catch (error) {
        console.error('Error loading token:', error);
        this.clearToken();
      }
    }
  }

  /**
   * Set token and update state
   */
  private setToken(token: JWTToken): void {
    this.currentToken.set(token);
    this.isAuthenticated.set(true);
    
    // Save to localStorage
    localStorage.setItem(this.TOKEN_STORAGE_KEY, JSON.stringify(token));
    localStorage.setItem(this.USER_ID_STORAGE_KEY, token.user_id);
    localStorage.setItem(this.TOKEN_ISSUED_AT_KEY, Date.now().toString());
  }

  /**
   * Set user and update state
   */
  private setUser(user: User): void {
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  /**
   * Clear token and state
   */
  private clearToken(): void {
    this.currentToken.set(null);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    localStorage.removeItem(this.USER_ID_STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_ISSUED_AT_KEY);
  }

  /**
   * Create or get a JWT token for a user
   */
  async createToken(userId: string, expiresInHours: number = 24): Promise<JWTToken> {
    this.isLoading.set(true);

    try {
      const response = await fetch(`${environment.authUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          expires_in_hours: expiresInHours,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create token: ${response.status} ${errorText}`);
      }

      const token: JWTToken = await response.json();
      
      console.log('✅ Token created:', token.user_id);
      
      // Save token and user
      this.setToken(token);
      this.setUser({ id: token.user_id });

      return token;
    } catch (error) {
      console.error('Error creating token:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Validate a JWT token
   */
  async validateToken(token?: string): Promise<TokenValidation> {
    const tokenToValidate = token || this.currentToken()?.access_token;

    if (!tokenToValidate) {
      return {
        valid: false,
        user_id: null,
        error: 'No token provided',
      };
    }

    try {
      const response = await fetch(`${environment.authUrl}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: tokenToValidate,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token validation failed:', errorText);
        return {
          valid: false,
          user_id: null,
          error: errorText,
        };
      }

      const validation: TokenValidation = await response.json();
      
      if (!validation.valid) {
        console.log('⚠️ Token is invalid:', validation.error);
        this.clearToken();
      }

      return validation;
    } catch (error) {
      console.error('Error validating token:', error);
      return {
        valid: false,
        user_id: null,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Get current valid token, creating one if needed
   */
  async getValidToken(userId?: string): Promise<string | null> {
    // Check if we have a current token
    let token = this.currentToken();

    // If no token and userId provided, create one
    if (!token && userId) {
      console.log('🔑 No token found, creating new token for:', userId);
      token = await this.createToken(userId);
      return token.access_token;
    }

    // If no token and no userId, can't proceed
    if (!token) {
      console.log('⚠️ No token and no user ID provided');
      return null;
    }

    // Check if token is expired or expiring soon (5 minutes buffer)
    const issuedAtStr = localStorage.getItem(this.TOKEN_ISSUED_AT_KEY);
    if (issuedAtStr) {
      const issuedAt = parseInt(issuedAtStr);
      const expiresIn = token.expires_in * 1000;
      const expiryTime = issuedAt + expiresIn;
      const timeUntilExpiry = expiryTime - Date.now();
      const REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes

      // If expiring soon or expired, refresh
      if (timeUntilExpiry < REFRESH_BUFFER) {
        console.log('🔄 Token expiring soon, refreshing...');
        
        // Validate first to make sure it's still valid
        const validation = await this.validateToken();
        
        if (validation.valid) {
          // Token still valid but expiring - create new one
          const newToken = await this.createToken(token.user_id);
          return newToken.access_token;
        } else {
          // Token invalid - create new one
          console.log('❌ Token invalid, creating new one');
          if (userId) {
            const newToken = await this.createToken(userId);
            return newToken.access_token;
          }
          return null;
        }
      }
    }

    // Token is valid and not expiring soon
    return token.access_token;
  }

  /**
   * Check if token is valid and refresh if needed (for background monitoring)
   */
  async checkAndRefreshToken(userId?: string): Promise<void> {
    const token = this.currentToken();
    
    if (!token) {
      console.log('⚠️ No token to check');
      return;
    }

    // Check expiry time
    const issuedAtStr = localStorage.getItem(this.TOKEN_ISSUED_AT_KEY);
    if (!issuedAtStr) return;

    const issuedAt = parseInt(issuedAtStr);
    const expiresIn = token.expires_in * 1000;
    const expiryTime = issuedAt + expiresIn;
    const timeUntilExpiry = expiryTime - Date.now();
    const REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes

    if (timeUntilExpiry < REFRESH_BUFFER) {
      console.log(`🔄 Token expiring in ${Math.floor(timeUntilExpiry / 1000)}s, refreshing...`);
      
      try {
        // Validate first
        const validation = await this.validateToken();
        
        if (validation.valid) {
          // Create new token
          await this.createToken(token.user_id);
          console.log('✅ Token refreshed successfully');
        } else {
          console.log('❌ Token invalid during refresh check');
          this.clearToken();
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    }
  }

  /**
   * Login with user ID (creates token)
   */
  async login(userId: string, expiresInHours: number = 24): Promise<{ success: boolean; error?: string }> {
    try {
      await this.createToken(userId, expiresInHours);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Logout (clear token)
   */
  logout(): void {
    console.log('👋 Logging out');
    this.clearToken();
  }

  /**
   * Get current token string
   */
  getToken(): string | null {
    return this.currentToken()?.access_token || null;
  }

  /**
   * Get current user
   */
  getUser(): User | null {
    return this.currentUser();
  }

  /**
   * Check if user is authenticated
   */
  isAuth(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Get token expiry info
   */
  getTokenExpiry(): { expiresAt: number; timeRemaining: number } | null {
    const token = this.currentToken();
    const issuedAtStr = localStorage.getItem(this.TOKEN_ISSUED_AT_KEY);

    if (!token || !issuedAtStr) {
      return null;
    }

    const issuedAt = parseInt(issuedAtStr);
    const expiresIn = token.expires_in * 1000;
    const expiresAt = issuedAt + expiresIn;
    const timeRemaining = expiresAt - Date.now();

    return { expiresAt, timeRemaining };
  }
}


