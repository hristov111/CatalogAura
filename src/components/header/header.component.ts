
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="fixed top-0 left-0 right-0 z-50">
      <div class="absolute inset-0 glass-panel"></div>
      <nav class="relative container mx-auto px-4 md:px-8 lg:px-12 py-5 flex justify-between items-center">
        <a routerLink="/" class="text-xl font-light tracking-[0.3em] text-[var(--text)] uppercase cursor-pointer hover:opacity-80 transition-opacity">AURA</a>
        <div class="hidden md:flex items-center space-x-8 text-xs uppercase tracking-widest">
            <a routerLink="/" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">Discover</a>
            <a href="#" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">Journal</a>
            <a href="#" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">Connections</a>
        </div>
        <div class="flex items-center space-x-5">
          <a href="#" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">
            <svg class="w-5 h-5" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </a>
          <a href="#" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">
            <svg class="w-5 h-5" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"></path></svg>
          </a>
          
          @if (authService.isAuthenticated()) {
            <!-- Logged in: Show user info with profile and logout -->
            <div class="flex items-center space-x-3 ml-2">
              <!-- User info section -->
              <a routerLink="/user/profile" class="flex items-center space-x-3 hover:opacity-80 transition-opacity group">
                <!-- Avatar -->
                @if (hasValidAvatar()) {
                  <img [src]="authService.authUser()!.avatarUrl!" 
                       [alt]="authService.authUser()!.fullName || authService.authUser()!.email"
                       (error)="onAvatarError($event)"
                       class="w-8 h-8 rounded-full ring-2 ring-[var(--accent-soft)] group-hover:ring-[var(--accent)] transition-all object-cover">
                } @else {
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-soft)] flex items-center justify-center ring-2 ring-[var(--accent-soft)] group-hover:ring-[var(--accent)] transition-all">
                    <span class="text-xs font-semibold text-white uppercase">
                      {{ getUserInitials() }}
                    </span>
                  </div>
                }
                
                <!-- Name/Email -->
                <div class="hidden lg:flex flex-col items-start">
                  @if (authService.authUser()?.fullName) {
                    <span class="text-sm font-medium text-[var(--text)] leading-tight">
                      {{ authService.authUser()!.fullName }}
                    </span>
                    <span class="text-xs text-[var(--muted)] leading-tight">
                      {{ authService.authUser()!.email }}
                    </span>
                  } @else {
                    <span class="text-sm font-medium text-[var(--text)]">
                      {{ authService.authUser()!.email }}
                    </span>
                  }
                </div>
              </a>
              
              <!-- Logout button -->
              <button (click)="logout()" 
                      class="text-[var(--muted)] hover:text-[var(--text)] transition-colors bg-transparent border-none cursor-pointer p-1" 
                      title="Logout">
                <svg class="w-5 h-5" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"></path></svg>
              </button>
            </div>
          } @else {
            <!-- Not logged in: Show login link -->
            <a routerLink="/auth/login" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors" title="Login">
              <svg class="w-5 h-5" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path></svg>
            </a>
          }
        </div>
      </nav>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private avatarLoadError = signal(false);

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}
  
  hasValidAvatar(): boolean {
    const user = this.authService.authUser();
    if (!user || !user.avatarUrl || this.avatarLoadError()) {
      return false;
    }
    // Check if avatarUrl is not just whitespace
    return user.avatarUrl.trim().length > 0;
  }
  
  onAvatarError(event: Event): void {
    // Hide the broken image and show initials instead
    this.avatarLoadError.set(true);
  }
  
  getUserInitials(): string {
    const user = this.authService.authUser();
    if (!user) return '?';
    
    if (user.fullName) {
      const names = user.fullName.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    
    // Fallback to email
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    
    return '?';
  }
  
  async logout() {
    await this.authService.logout();
    this.router.navigate(['/']);
  }
}
