import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = signal('');
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(private authService: AuthService) {}

  async onSubmit() {
    if (!this.email()) {
      this.errorMessage.set('Please enter your email address');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const result = await this.authService.forgotPassword(this.email());

    if (result.success) {
      this.successMessage.set(result.message || 'If an account with that email exists, a password reset link has been sent.');
      this.email.set(''); // Clear the form
    } else {
      this.errorMessage.set(result.error || 'Failed to send reset email');
    }

    this.isLoading.set(false);
  }
}


