import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserService, UserProfile, UserSession, AuditLog } from '../../../services/user.service';

type Tab = 'profile' | 'security' | 'activity' | 'account';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  // Expose Object for template use
  Object = Object;
  
  activeTab = signal<Tab>('profile');
  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // Profile form
  fullName = signal('');
  bio = signal('');
  avatarUrl = signal('');

  // Password form
  oldPassword = signal('');
  newPassword = signal('');
  confirmNewPassword = signal('');

  // Sessions
  sessions = signal<UserSession[]>([]);
  
  // Audit logs
  auditLogs = signal<AuditLog[]>([]);

  // Password strength
  passwordStrength = computed(() => {
    const pwd = this.newPassword();
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[@$!%*?&]/.test(pwd)) strength++;
    return strength;
  });

  passwordsMatch = computed(() => {
    return this.newPassword() && this.confirmNewPassword() && 
           this.newPassword() === this.confirmNewPassword();
  });

  constructor(
    public authService: AuthService,
    public userService: UserService
  ) {}

  async ngOnInit() {
    await this.loadProfile();
  }

  switchTab(tab: Tab) {
    this.activeTab.set(tab);
    this.clearMessages();

    // Load data when switching tabs
    if (tab === 'security') {
      this.loadSessions();
    } else if (tab === 'activity') {
      this.loadAuditLogs();
    }
  }

  async loadProfile() {
    const result = await this.userService.getProfile();
    if (result.success && result.profile) {
      this.fullName.set(result.profile.full_name || '');
      this.bio.set(result.profile.bio || '');
      this.avatarUrl.set(result.profile.avatar_url || '');
    }
  }

  async updateProfile() {
    this.isLoading.set(true);
    this.clearMessages();

    const result = await this.userService.updateProfile({
      full_name: this.fullName(),
      bio: this.bio(),
      avatar_url: this.avatarUrl() || undefined,
    });

    if (result.success) {
      this.successMessage.set('Profile updated successfully!');
    } else {
      this.errorMessage.set(result.error || 'Failed to update profile');
    }

    this.isLoading.set(false);
  }

  async changePassword() {
    // Validation
    if (!this.oldPassword() || !this.newPassword() || !this.confirmNewPassword()) {
      this.errorMessage.set('Please fill in all password fields');
      return;
    }

    if (this.newPassword() !== this.confirmNewPassword()) {
      this.errorMessage.set('New passwords do not match');
      return;
    }

    if (this.newPassword().length < 8) {
      this.errorMessage.set('Password must be at least 8 characters long');
      return;
    }

    if (this.passwordStrength() < 3) {
      this.errorMessage.set('Password is too weak');
      return;
    }

    this.isLoading.set(true);
    this.clearMessages();

    const result = await this.userService.changePassword(
      this.oldPassword(),
      this.newPassword()
    );

    if (result.success) {
      this.successMessage.set('Password changed successfully!');
      // Clear form
      this.oldPassword.set('');
      this.newPassword.set('');
      this.confirmNewPassword.set('');
    } else {
      this.errorMessage.set(result.error || 'Failed to change password');
    }

    this.isLoading.set(false);
  }

  async loadSessions() {
    const result = await this.userService.getSessions();
    if (result.success && result.sessions) {
      this.sessions.set(result.sessions);
    }
  }

  async revokeSession(sessionId: string) {
    if (!confirm('Are you sure you want to revoke this session?')) {
      return;
    }

    this.isLoading.set(true);
    const result = await this.userService.revokeSession(sessionId);

    if (result.success) {
      this.successMessage.set('Session revoked successfully');
      await this.loadSessions();
    } else {
      this.errorMessage.set(result.error || 'Failed to revoke session');
    }

    this.isLoading.set(false);
  }

  async logoutAllDevices() {
    if (!confirm('This will log you out from all devices. Continue?')) {
      return;
    }

    this.isLoading.set(true);
    await this.authService.logoutAllDevices();
    // User will be redirected to login by the auth service
  }

  async loadAuditLogs() {
    const result = await this.userService.getAuditLogs(50);
    if (result.success && result.logs) {
      this.auditLogs.set(result.logs);
    }
  }

  formatEventType(eventType: string): string {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEventIcon(eventType: string): string {
    if (eventType.includes('login')) return '🔓';
    if (eventType.includes('logout')) return '🔒';
    if (eventType.includes('password')) return '🔑';
    if (eventType.includes('register')) return '✨';
    if (eventType.includes('profile')) return '👤';
    return '📝';
  }

  clearMessages() {
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}


