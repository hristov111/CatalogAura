import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

export interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  message_count: number;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface AuditLog {
  id: string;
  eventType: string;
  ipAddress: string;
  userAgent: string;
  metadata: any;
  createdAt: string;
}

export interface UserStats {
  messageCount: number;
  activeSessions: number;
  accountAge: string;
  lastLogin: string;
  memberSince: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  
  readonly profile = signal<UserProfile | null>(null);
  readonly sessions = signal<UserSession[]>([]);
  readonly auditLogs = signal<AuditLog[]>([]);
  readonly stats = signal<UserStats | null>(null);
  readonly isLoading = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private async getAuthHeaders(): Promise<HttpHeaders> {
    const token = await this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Fetch user profile
   */
  async getProfile(): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      this.isLoading.set(true);
      const headers = await this.getAuthHeaders();
      
      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/user/profile`, { headers })
      );

      this.profile.set(response.profile);
      return { success: true, profile: response.profile };
    } catch (error: any) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: error.error?.error || 'Failed to fetch profile',
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<UserProfile>): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      this.isLoading.set(true);
      const headers = await this.getAuthHeaders();
      
      const response: any = await firstValueFrom(
        this.http.put(`${this.apiUrl}/user/profile`, data, { headers })
      );

      this.profile.set(response.profile);
      return { success: true, profile: response.profile };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.error?.error || 'Failed to update profile',
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.isLoading.set(true);
      const headers = await this.getAuthHeaders();
      
      await firstValueFrom(
        this.http.put(
          `${this.apiUrl}/user/password`,
          { oldPassword, newPassword },
          { headers }
        )
      );

      return { success: true };
    } catch (error: any) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: error.error?.error || 'Failed to change password',
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get active sessions
   */
  async getSessions(): Promise<{ success: boolean; sessions?: UserSession[]; error?: string }> {
    try {
      this.isLoading.set(true);
      const headers = await this.getAuthHeaders();
      
      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/user/sessions`, { headers })
      );

      this.sessions.set(response.sessions);
      return { success: true, sessions: response.sessions };
    } catch (error: any) {
      console.error('Get sessions error:', error);
      return {
        success: false,
        error: error.error?.error || 'Failed to fetch sessions',
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.isLoading.set(true);
      const headers = await this.getAuthHeaders();
      
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/user/sessions/${sessionId}`, { headers })
      );

      // Refresh sessions list
      await this.getSessions();
      
      return { success: true };
    } catch (error: any) {
      console.error('Revoke session error:', error);
      return {
        success: false,
        error: error.error?.error || 'Failed to revoke session',
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(limit: number = 50): Promise<{ success: boolean; logs?: AuditLog[]; error?: string }> {
    try {
      this.isLoading.set(true);
      const headers = await this.getAuthHeaders();
      
      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/user/audit-logs?limit=${limit}`, { headers })
      );

      this.auditLogs.set(response.logs);
      return { success: true, logs: response.logs };
    } catch (error: any) {
      console.error('Get audit logs error:', error);
      return {
        success: false,
        error: error.error?.error || 'Failed to fetch audit logs',
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get user statistics
   */
  async getStats(): Promise<{ success: boolean; stats?: UserStats; error?: string }> {
    try {
      this.isLoading.set(true);
      const headers = await this.getAuthHeaders();
      
      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/user/stats`, { headers })
      );

      this.stats.set(response.stats);
      return { success: true, stats: response.stats };
    } catch (error: any) {
      console.error('Get stats error:', error);
      return {
        success: false,
        error: error.error?.error || 'Failed to fetch stats',
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Upload avatar (placeholder - implement based on your storage solution)
   */
  async uploadAvatar(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // This is a placeholder. You'll need to implement actual file upload
      // either to Supabase Storage or another service
      
      // For now, return an error
      return {
        success: false,
        error: 'Avatar upload not yet implemented',
      };
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload avatar',
      };
    }
  }

  /**
   * Clear local profile data
   */
  clearProfile() {
    this.profile.set(null);
    this.sessions.set([]);
    this.auditLogs.set([]);
    this.stats.set(null);
  }
}


