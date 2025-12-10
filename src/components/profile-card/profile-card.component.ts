
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Profile } from '../../profile.model';

@Component({
  selector: 'app-profile-card',
  template: `
    @if(profile(); as p) {
      <div 
        (click)="selectProfile.emit(p.id)"
        class="profile-card group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 ring-1 ring-[var(--accent-soft)] hover:ring-[var(--accent)]">
        <img [ngSrc]="p.imageUrl" [alt]="p.name" width="500" height="700" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
        
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        <div class="absolute bottom-0 left-0 p-5 text-white w-full">
          <div class="flex justify-between items-center">
            <h3 class="text-2xl font-medium tracking-tight text-[var(--text)]">{{ p.name }}, {{ p.age }}</h3>
            @if (p.status === 'online') {
              <div class="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
            }
          </div>
          <p class="font-light text-[var(--muted)]">{{ p.city }}</p>
        </div>
        
        <!-- Hover Overlay for Interests -->
        <div class="profile-image-overlay absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-300 flex items-center justify-center p-4">
            <div class="flex flex-wrap gap-2 justify-center">
                @for(interest of p.interests; track interest) {
                    <span class="bg-white/10 text-white text-xs font-medium px-3 py-1 rounded-full">{{ interest }}</span>
                }
            </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgOptimizedImage],
})
export class ProfileCardComponent {
  profile = input.required<Profile>();
  selectProfile = output<number>();
}
