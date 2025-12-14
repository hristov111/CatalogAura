import { Component, ChangeDetectionStrategy, signal, computed, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { ParticleBackgroundComponent } from '../particle-background/particle-background.component';
import { IntroParticlesComponent } from '../intro-particles/intro-particles.component';
import { WhyBetterSectionComponent } from '../why-better-section/why-better-section.component';
import { PricingComponent } from '../pricing/pricing.component';
import { FaqComponent } from '../faq/faq.component';
import { FooterComponent } from '../footer/footer.component';
import { ProfileService } from '../../services/profile.service';
import { Profile } from '../../profile.model';

const HERO_COPY_SETS = [
  { headline: 'She’s Not Just a Profile. She’s a Feeling.', ctaTemplate: 'Start a Connection with {name}' },
  { headline: 'You Don’t Find Her. She Appears.', ctaTemplate: 'Reveal the Moment with {name}' },
  { headline: 'Built for Men Who Know What They Want.', ctaTemplate: 'Enter {name}\'s Experience' },
  { headline: 'Tonight Doesn’t Have to Be Quiet.', ctaTemplate: 'Talk With {name}' },
  { headline: 'Not Everyone Gets Access.', ctaTemplate: 'Unlock {name}\'s Room' },
  { headline: 'No Pressure. Just Presence.', ctaTemplate: 'Begin Gently with {name}' },
  { headline: 'Someone Is Online Right Now.', ctaTemplate: 'Join {name} Now' },
  { headline: 'Every Swipe Changes the Mood.', ctaTemplate: 'See Who {name} Is' },
  { headline: 'It Starts With a Message.', ctaTemplate: 'Say Hello to {name}' },
  { headline: 'Attention. Warmth. Tension.', ctaTemplate: 'Step Inside with {name}' }
];

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, HeaderComponent, ProfileCardComponent, ParticleBackgroundComponent, IntroParticlesComponent, WhyBetterSectionComponent, PricingComponent, FaqComponent, FooterComponent],
})
export class HomeComponent implements OnInit, OnDestroy {
  private profileService = inject(ProfileService);
  private router = inject(Router);

  readonly profiles = this.profileService.profiles;
  readonly promptText = signal('');
  readonly showHeroGallery = signal(false);
  readonly isTransitioning = signal(false);
  readonly transitionState = signal<'idle' | 'exit-next' | 'exit-prev' | 'enter-next' | 'enter-prev'>('idle');
  readonly particleTrigger = signal(0);
  readonly activeGalleryIndex = signal(0);
  readonly isLightboxOpen = signal(false);
  
  // Intro animation state
  readonly introActive = signal(true);
  readonly heartFormed = signal(false);
  readonly ctaAwake = signal(false);
  readonly cardsLoaded = signal(false);

  readonly featuredIndex = signal(0);
  private sliderInterval: any;

  readonly featuredProfile = computed(() => this.profiles()[this.featuredIndex()]);
  
  readonly currentGalleryImages = computed(() => {
    const profile = this.featuredProfile();
    if (!profile) return [];
    return [profile.imageUrl, ...profile.gallery];
  });
  
  readonly filteredProfiles = computed(() => {
    const search = this.promptText().toLowerCase().trim();
    if (!search) {
      return this.profiles();
    }
    return this.profiles().filter(p => 
      p.name.toLowerCase().includes(search) ||
      p.city.toLowerCase().includes(search) ||
      p.interests.some(i => i.toLowerCase().includes(search))
    );
  });

  readonly prevProfileName = computed(() => {
    const prevIndex = (this.featuredIndex() - 1 + this.profiles().length) % this.profiles().length;
    return this.profiles()[prevIndex].name;
  });

  readonly nextProfileName = computed(() => {
    const nextIndex = (this.featuredIndex() + 1) % this.profiles().length;
    return this.profiles()[nextIndex].name;
  });

  readonly dynamicHeroContent = computed(() => {
    const profile = this.featuredProfile();
    if (!profile) {
        return { identity: '', headline: '', subline: '', cta: '' };
    }
    
    const copySet = HERO_COPY_SETS[this.featuredIndex() % HERO_COPY_SETS.length];
    
    return {
        identity: `FEATURED PROFILE • ${profile.name.toUpperCase()}, ${profile.age} — ${profile.city.toUpperCase()}`,
        headline: copySet.headline,
        subline: profile.personalityLine,
        cta: copySet.ctaTemplate.replace('{name}', profile.name)
    };
  });

  readonly dynamicHeroStats = computed(() => {
    const profile = this.featuredProfile();
    if (!profile) {
      return { rating: '4.8', replyMinutes: 5, recentChats: 320 };
    }
    const base = profile.id;
    const rating = (4.6 + ((base % 4) * 0.1)).toFixed(1);
    const replyMinutes = 3 + (base % 4);
    const recentChats = 180 + base * 40;
    return { rating, replyMinutes, recentChats };
  });

  ngOnInit(): void {
    this.startSlider();
  }

  ngOnDestroy(): void {
    this.stopSlider();
  }

  startSlider(): void {
    this.stopSlider(); 
    this.sliderInterval = setInterval(() => {
      this.nextProfile();
    }, 5000);
  }

  stopSlider(): void {
    if (this.sliderInterval) {
      clearInterval(this.sliderInterval);
    }
  }

  nextProfile(): void {
    if (this.isTransitioning()) return;
    
    this.isTransitioning.set(true);
    this.transitionState.set('exit-next');
    this.particleTrigger.update(v => v + 1);
    
    setTimeout(() => {
      this.featuredIndex.update(current => (current + 1) % this.profiles().length);
      this.activeGalleryIndex.set(0); 
      
      this.transitionState.set('enter-next');
      
      setTimeout(() => {
        this.transitionState.set('idle');
        this.isTransitioning.set(false);
      }, 500);
    }, 400); 
  }

  prevProfile(): void {
    if (this.isTransitioning()) return;
    
    this.isTransitioning.set(true);
    this.transitionState.set('exit-prev');
    this.particleTrigger.update(v => v + 1);

    setTimeout(() => {
      this.featuredIndex.update(current => (current - 1 + this.profiles().length) % this.profiles().length);
      this.activeGalleryIndex.set(0); 
      
      this.transitionState.set('enter-prev');
      
      setTimeout(() => {
        this.transitionState.set('idle');
        this.isTransitioning.set(false);
      }, 500); 
    }, 400); 
  }

  setGalleryImage(index: number): void {
    this.activeGalleryIndex.set(index);
  }

  nextGalleryImage(event?: Event): void {
    if (event) event.stopPropagation();
    const images = this.currentGalleryImages();
    this.activeGalleryIndex.update(i => (i + 1) % images.length);
  }

  prevGalleryImage(event?: Event): void {
    if (event) event.stopPropagation();
    const images = this.currentGalleryImages();
    this.activeGalleryIndex.update(i => (i - 1 + images.length) % images.length);
  }

  onHeartFormed(): void {
    this.heartFormed.set(true);
  }

  onExplosionComplete(): void {
    setTimeout(() => {
      this.introActive.set(false);
      setTimeout(() => {
        this.cardsLoaded.set(true);
      }, 500);
      setTimeout(() => {
        this.ctaAwake.set(true);
      }, 3000);
    }, 200); 
  }
  
  handlePromptChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.promptText.set(input.value);
  }

  selectProfile(profileId: number): void {
    this.router.navigate(['/profile', profileId]);
  }

  onCallClick(profile: Profile): void {
    console.log('Call clicked for:', profile.name);
  }

  openHeroGallery(): void {
    this.showHeroGallery.set(true);
    this.stopSlider();
  }

  closeHeroGallery(): void {
    this.showHeroGallery.set(false);
    this.startSlider();
  }

  openLightbox(): void {
    this.isLightboxOpen.set(true);
    this.stopSlider();
  }

  openLightboxWithImage(image: string): void {
    const images = this.currentGalleryImages();
    const index = images.indexOf(image);
    if (index !== -1) {
      this.activeGalleryIndex.set(index);
      this.openLightbox();
    }
  }

  closeLightbox(): void {
    this.isLightboxOpen.set(false);
    if (!this.showHeroGallery()) {
      this.startSlider();
    }
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.isLightboxOpen()) {
      this.closeLightbox();
    }
  }
}
