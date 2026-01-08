import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  newPassword = signal('');
  confirmPassword = signal('');
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  token = signal('');

  // Password strength indicators
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

  passwordStrengthLabel = computed(() => {
    const strength = this.passwordStrength();
    if (strength === 0) return '';
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Fair';
    if (strength <= 4) return 'Good';
    return 'Strong';
  });

  passwordStrengthClass = computed(() => {
    const strength = this.passwordStrength();
    if (strength <= 2) return 'weak';
    if (strength <= 3) return 'fair';
    if (strength <= 4) return 'good';
    return 'strong';
  });

  passwordsMatch = computed(() => {
    return this.newPassword() && this.confirmPassword() && 
           this.newPassword() === this.confirmPassword();
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get the token from URL fragment (Supabase uses hash-based routing)
    const fragment = window.location.hash;
    if (fragment) {
      const params = new URLSearchParams(fragment.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        this.token.set(accessToken);
      }
    }
  }

  async onSubmit() {
    // Validation
    if (!this.newPassword() || !this.confirmPassword()) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    if (this.newPassword() !== this.confirmPassword()) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    if (this.newPassword().length < 8) {
      this.errorMessage.set('Password must be at least 8 characters long');
      return;
    }

    if (this.passwordStrength() < 3) {
      this.errorMessage.set('Password is too weak. Please use a stronger password.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const result = await this.authService.resetPassword(this.newPassword());

    if (result.success) {
      this.successMessage.set(result.message || 'Password reset successful! Redirecting to login...');
      // Redirect to login after a delay
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 2000);
    } else {
      this.errorMessage.set(result.error || 'Failed to reset password');
      this.isLoading.set(false);
    }
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }
}


