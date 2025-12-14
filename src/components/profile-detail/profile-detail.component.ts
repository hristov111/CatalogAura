import { Component, ChangeDetectionStrategy, input, inject, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-profile-detail',
  template: `
    @if (profile(); as p) {
      <!-- Dynamic style wrapper using binding instead of style tag -->
      <div 
        class="min-h-screen"
        [style.--accent]="p.theme.accent"
        [style.--accent-rgb]="p.theme.accentRGB"
        [style.--bg-start]="p.theme.bgStart"
        [style.--bg-end]="p.theme.bgEnd"
        [style.--surface-rgb]="p.theme.surfaceRGB"
        [style.--text]="p.theme.text"
        [style.--muted]="p.theme.muted"
        [style.--btn-bg]="p.theme.btnBg"
        [style.--btn-text]="p.theme.btnText"
        [style.--btn-border]="p.theme.btnBorder"
        [style.--accent-soft]="p.theme.accentSoft"
        style="background: linear-gradient(160deg, var(--bg-start), var(--bg-end));">
        
        <div class="max-w-6xl mx-auto animate-fade-in p-4 pt-8">
          <!-- Back Button -->
          <a routerLink="/" class="mb-8 flex items-center gap-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors group cursor-pointer w-fit">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 transition-transform group-hover:-translate-x-1">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              Back to Discovery
          </a>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column -->
            <div class="lg:col-span-1 space-y-8">
              <div class="relative">
                <img [ngSrc]="p.imageUrl" [alt]="p.name" width="500" height="700" class="rounded-2xl w-full object-cover shadow-2xl" priority>
                <div class="absolute bottom-4 left-4 right-4 glass-panel rounded-xl p-4">
                    <h1 class="text-3xl font-bold tracking-tight text-[var(--text)]">{{ p.name }}, {{p.age}}</h1>
                    <p class="text-[var(--muted)]">{{p.city}}</p>
                    <div class="flex items-center gap-2 mt-2 text-sm" [class.text-green-400]="p.status === 'online'" [class.text-slate-400]="p.status === 'offline'">
                      <span class="w-2 h-2 rounded-full" [class.bg-green-400]="p.status === 'online'" [class.bg-slate-500]="p.status === 'offline'"></span>
                      {{ p.availability }}
                    </div>
                </div>
              </div>
              
              <div class="glass-panel p-6 rounded-2xl">
                  <h3 class="font-semibold text-lg text-[var(--text)] mb-3">Passions</h3>
                  <div class="flex flex-wrap gap-2">
                      @for(passion of p.passions; track passion) {
                          <span class="bg-white/10 text-[var(--text)] text-sm px-3 py-1 rounded-full">{{passion}}</span>
                      }
                  </div>
              </div>

              <div class="glass-panel p-6 rounded-2xl">
                  <h3 class="font-semibold text-lg text-[var(--text)] mb-3">Values</h3>
                  <div class="flex flex-wrap gap-2">
                      @for(value of p.values; track value) {
                          <span class="bg-white/10 text-[var(--text)] text-sm px-3 py-1 rounded-full">{{value}}</span>
                      }
                  </div>
              </div>
            </div>
            
            <!-- Right Column -->
            <div class="lg:col-span-2 space-y-8">
              <div class="glass-panel p-6 rounded-2xl">
                <h2 class="text-2xl font-light text-[var(--text)] mb-4">About {{p.name}}</h2>
                <p class="text-[var(--muted)] leading-relaxed whitespace-pre-line">{{p.bio}}</p>
              </div>
              
              <div class="glass-panel p-6 rounded-2xl">
                <h2 class="text-2xl font-light text-[var(--text)] mb-4">Lifestyle</h2>
                <div class="grid grid-cols-2 gap-4">
                  @for(image of p.gallery; track image) {
                    <img [ngSrc]="image" alt="Gallery image" width="600" height="400" class="rounded-lg object-cover w-full aspect-[3/2]">
                  }
                </div>
              </div>

              <div class="glass-panel rounded-2xl">
                <div class="p-6">
                   <h2 class="text-2xl font-light text-[var(--text)]">Connect with {{p.name}}</h2>
                </div>
                <!-- Chat UI -->
                <div class="bg-black/20 p-6 h-96 flex flex-col">
                  <div class="flex-grow space-y-4 overflow-y-auto">
                      <!-- Received Message -->
                      <div class="flex items-start gap-3">
                          <img [src]="p.imageUrl" alt="Avatar" class="w-8 h-8 rounded-full object-cover">
                          <div class="bg-black/20 p-3 rounded-lg rounded-tl-none max-w-xs">
                              <p class="text-sm text-[var(--text)]">Hey there! It's lovely to meet you. What caught your eye?</p>
                          </div>
                      </div>
                       <!-- Sent Message -->
                      <div class="flex items-start gap-3 justify-end">
                          <div class="bg-[var(--accent)] p-3 rounded-lg rounded-br-none max-w-xs">
                              <p class="text-sm text-[var(--btn-text)] font-medium">Your profile is so inspiring! I was really drawn to your passion for art.</p>
                          </div>
                      </div>
                  </div>
                  <div class="mt-4 relative">
                      <input type="text" placeholder="Send a message..." class="w-full bg-black/20 border border-[var(--accent-soft)] rounded-full py-3 pl-5 pr-14 text-[var(--text)] placeholder-[var(--muted)] focus:outline-none transition duration-300 dynamic-focus-ring">
                      <button class="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[var(--accent)] rounded-full text-[var(--btn-text)] hover:opacity-90 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                          </svg>
                      </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="flex items-center justify-center min-h-screen text-white bg-gray-900">
        <div class="text-center">
          <h2 class="text-2xl font-bold mb-4">Profile Not Found</h2>
          <a routerLink="/" class="text-blue-400 hover:underline">Return to Home</a>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fade-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
        animation: fade-in 0.5s ease-out forwards;
    }
    .glass-panel {
        background: rgba(var(--surface-rgb), 0.4);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgOptimizedImage, RouterLink],
})
export class ProfileDetailComponent {
  private profileService = inject(ProfileService);
  
  // Input binding from router
  id = input<string>(); 

  profile = computed(() => {
    const profileId = Number(this.id());
    if (isNaN(profileId)) return undefined;
    return this.profileService.getProfileById(profileId);
  });
}
