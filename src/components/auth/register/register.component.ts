import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  fullName = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  agreeToTerms = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  // Password strength indicators
  passwordStrength = computed(() => {
    const pwd = this.password();
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
    return this.password() && this.confirmPassword() && 
           this.password() === this.confirmPassword();
  });

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    // Validation
    if (!this.fullName() || !this.email() || !this.password() || !this.confirmPassword()) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    if (this.password().length < 8) {
      this.errorMessage.set('Password must be at least 8 characters long');
      return;
    }

    if (!this.agreeToTerms()) {
      this.errorMessage.set('Please agree to the terms of service');
      return;
    }

    if (this.passwordStrength() < 3) {
      this.errorMessage.set('Password is too weak. Please use a stronger password.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const result = await this.authService.register(
      this.email(),
      this.password(),
      this.fullName()
    );

    if (result.success) {
      this.successMessage.set(result.message || 'Registration successful! Please check your email to verify your account.');
      // Optionally redirect to login after a delay
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 3000);
    } else {
      this.errorMessage.set(result.error || 'Registration failed');
      this.isLoading.set(false);
    }
  }

  async registerWithGoogle() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const result = await this.authService.loginWithGoogle();

    if (!result.success) {
      this.errorMessage.set(result.error || 'Google registration failed');
      this.isLoading.set(false);
    }
  }

  async registerWithGithub() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const result = await this.authService.loginWithGithub();

    if (!result.success) {
      this.errorMessage.set(result.error || 'GitHub registration failed');
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


