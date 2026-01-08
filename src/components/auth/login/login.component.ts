import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  constructor(
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async onSubmit() {
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const result = await this.authService.login(this.email(), this.password());

    if (result.success) {
      // Check for return URL
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
      this.router.navigate([returnUrl]);
    } else {
      this.errorMessage.set(result.error || 'Login failed');
      this.isLoading.set(false);
    }
  }

  async loginWithGoogle() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const result = await this.authService.loginWithGoogle();

    if (!result.success) {
      this.errorMessage.set(result.error || 'Google login failed');
      this.isLoading.set(false);
    }
    // On success, the user will be redirected to Google
  }

  async loginWithGithub() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const result = await this.authService.loginWithGithub();

    if (!result.success) {
      this.errorMessage.set(result.error || 'GitHub login failed');
      this.isLoading.set(false);
    }
    // On success, the user will be redirected to GitHub
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }
}


