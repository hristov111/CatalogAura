import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  template: `
    <div class="callback-container">
      <div class="callback-card">
        <div class="spinner"></div>
        <p>Completing authentication...</p>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .callback-card {
      background: white;
      border-radius: 16px;
      padding: 3rem;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .spinner {
      width: 50px;
      height: 50px;
      margin: 0 auto 1.5rem;
      border: 4px solid rgba(102, 126, 234, 0.2);
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    p {
      color: #333;
      font-size: 1.125rem;
      font-weight: 500;
    }
  `]
})
export class CallbackComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    // Wait a moment for Supabase to process the OAuth callback
    // The auth state change listener in AuthService will handle the user session
    
    // Give it 2 seconds to process, then redirect to home
    setTimeout(() => {
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['/']);
      } else {
        // If authentication failed, redirect to login
        this.router.navigate(['/auth/login']);
      }
    }, 2000);
  }
}


