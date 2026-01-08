import { Component, ChangeDetectionStrategy, input, inject, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { ProfileChatComponent } from './profile-chat/profile-chat.component';

@Component({
  selector: 'app-profile-detail',
  templateUrl: './profile-detail.component.html',
  styleUrl: './profile-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgOptimizedImage, RouterLink, ProfileChatComponent],
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
