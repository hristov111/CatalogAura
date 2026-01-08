import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserService, UserProfile, UserStats } from '../../../services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profile = signal<UserProfile | null>(null);
  stats = signal<UserStats | null>(null);
  isLoading = signal(true);
  error = signal('');
  avatarError = signal(false);

  constructor(
    public authService: AuthService,
    private userService: UserService
  ) {}

  async ngOnInit() {
    await this.loadProfileData();
  }

  async loadProfileData() {
    this.isLoading.set(true);
    this.error.set('');

    try {
      // Load profile
      const profileResult = await this.userService.getProfile();
      if (profileResult.success && profileResult.profile) {
        this.profile.set(profileResult.profile);
      } else {
        this.error.set(profileResult.error || 'Failed to load profile');
      }

      // Load stats
      const statsResult = await this.userService.getStats();
      if (statsResult.success && statsResult.stats) {
        this.stats.set(statsResult.stats);
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      this.error.set('Failed to load profile data');
    } finally {
      this.isLoading.set(false);
    }
  }

  hasValidAvatar(): boolean {
    const profileAvatar = this.profile()?.avatar_url;
    const authAvatar = this.authService.getUser()?.avatarUrl;
    
    if (!profileAvatar && !authAvatar) return false;
    
    const avatarUrl = profileAvatar || authAvatar;
    return avatarUrl ? avatarUrl.trim().length > 0 : false;
  }

  onAvatarError(): void {
    this.avatarError.set(true);
  }

  getInitials(fullName: string | undefined): string {
    if (!fullName) {
      // Fallback to email first letter
      const email = this.authService.getUser()?.email;
      return email ? email[0].toUpperCase() : '?';
    }
    
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}


