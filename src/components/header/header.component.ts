
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-header',
  template: `
    <header class="fixed top-0 left-0 right-0 z-50">
      <div class="absolute inset-0 glass-panel"></div>
      <nav class="relative container mx-auto px-4 md:px-8 lg:px-12 py-5 flex justify-between items-center">
        <div class="text-xl font-light tracking-[0.3em] text-[var(--text)] uppercase">AURA</div>
        <div class="hidden md:flex items-center space-x-8 text-xs uppercase tracking-widest">
            <a href="#" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">Discover</a>
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
          <a href="#" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">
            <svg class="w-5 h-5" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path></svg>
          </a>
        </div>
      </nav>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {}
