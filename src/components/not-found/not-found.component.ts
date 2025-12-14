import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 class="text-6xl font-bold mb-4">404</h1>
      <p class="text-xl mb-8">Page not found</p>
      <a routerLink="/" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors">
        Go Home
      </a>
    </div>
  `,
  imports: [RouterLink],
  standalone: true
})
export class NotFoundComponent {}
