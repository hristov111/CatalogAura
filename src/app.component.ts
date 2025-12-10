
import { Component, ChangeDetectionStrategy, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { ProfileCardComponent } from './components/profile-card/profile-card.component';
import { ProfileDetailComponent } from './components/profile-detail/profile-detail.component';
import { ParticleBackgroundComponent } from './components/particle-background/particle-background.component';
import { Profile } from './profile.model';

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
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgOptimizedImage, HeaderComponent, ProfileCardComponent, ProfileDetailComponent, ParticleBackgroundComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  
  readonly profiles = signal<Profile[]>(MOCK_PROFILES);
  readonly selectedProfile = signal<Profile | null>(null);
  readonly promptText = signal('');
  readonly showHeroGallery = signal(false);

  readonly featuredIndex = signal(0);
  private sliderInterval: any;

  readonly featuredProfile = computed(() => this.profiles()[this.featuredIndex()]);
  
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
    this.stopSlider(); // Ensure no multiple intervals are running
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
    this.featuredIndex.update(current => (current + 1) % this.profiles().length);
  }

  prevProfile(): void {
    this.featuredIndex.update(current => (current - 1 + this.profiles().length) % this.profiles().length);
  }
  
  handlePromptChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.promptText.set(input.value);
  }

  selectProfile(profileId: number): void {
    const profile = this.profiles().find(p => p.id === profileId);
    if (profile) {
      this.selectedProfile.set(profile);
      window.scrollTo(0, 0);
    }
  }

  deselectProfile(): void {
    this.selectedProfile.set(null);
  }

  openHeroGallery(): void {
    this.showHeroGallery.set(true);
    this.stopSlider();
  }

  closeHeroGallery(): void {
    this.showHeroGallery.set(false);
    this.startSlider();
  }
}

const MOCK_PROFILES: Profile[] = [
  {
    id: 1,
    name: 'Elara',
    age: 28,
    city: 'Paris',
    imageUrl: 'https://picsum.photos/seed/woman1/500/700',
    interests: ['Art', 'Philosophy', 'Jazz', 'Sailing'],
    bio: "A connoisseur of moments, finding poetry in the mundane. My world is painted in strokes of curiosity and wonder. I believe the best conversations happen over a glass of wine, under a sky full of stars. Looking for a connection that feels like a classic novel – timeless and deeply moving.",
    passions: ['Oil Painting', 'Classic French Cinema', 'Urban Exploration'],
    values: ['Authenticity', 'Intellectual Curiosity', 'Kindness'],
    gallery: ['https://picsum.photos/seed/gal1/600/400', 'https://picsum.photos/seed/gal2/600/400', 'https://picsum.photos/seed/gal3/600/400', 'https://picsum.photos/seed/gal4/600/400'],
    status: 'online',
    availability: 'Available for chat',
    personalityLine: "Soft-spoken. Curious. Always present when you need someone real.",
    theme: { accent: '#f59e0b', accentRGB: '245, 158, 11', bgStart: '#111827', bgEnd: '#422006', surfaceRGB: '17, 24, 39', text: '#f3f4f6', muted: '#9ca3af', btnBg: '#f59e0b', btnText: '#111827', btnBorder: '#f59e0b', accentSoft: 'rgba(245, 158, 11, 0.2)' }
  },
  {
    id: 2,
    name: 'Seraphina',
    age: 31,
    city: 'Kyoto',
    imageUrl: 'https://picsum.photos/seed/woman2/500/700',
    interests: ['Meditation', 'Ceramics', 'Hiking'],
    bio: "Seeking harmony in the dance between tradition and modernity. I find peace in the quiet rustle of a bamboo forest and excitement in the vibrant energy of a bustling city. Let's share stories and discover the beauty in our differences.",
    passions: ['Ikebana (Flower Arranging)', 'Tea Ceremonies', 'Writing Haikus'],
    values: ['Mindfulness', 'Respect for Nature', 'Growth'],
    gallery: ['https://picsum.photos/seed/gal5/600/400', 'https://picsum.photos/seed/gal6/600/400', 'https://picsum.photos/seed/gal7/600/400'],
    status: 'online',
    availability: 'Available for chat',
    personalityLine: "A calm presence with a surprisingly playful side. Ready for a deep conversation.",
    theme: { accent: '#22d3ee', accentRGB: '34, 211, 238', bgStart: '#083344', bgEnd: '#020617', surfaceRGB: '3, 7, 18', text: '#ecfeff', muted: '#99f6e4', btnBg: '#22d3ee', btnText: '#083344', btnBorder: '#22d3ee', accentSoft: 'rgba(34, 211, 238, 0.2)' }
  },
  {
    id: 3,
    name: 'Isla',
    age: 25,
    city: 'Sydney',
    imageUrl: 'https://picsum.photos/seed/woman3/500/700',
    interests: ['Surfing', 'Bonfires', 'Photography'],
    bio: "Salt in my hair, sun on my skin. I live for the thrill of catching the perfect wave and the peace of a sunset by the shore. My life is an adventure, and I'm looking for a co-pilot who isn't afraid to get their feet wet.",
    passions: ['Marine Biology', 'Acoustic Guitar', 'Road Trips'],
    values: ['Freedom', 'Spontaneity', 'Loyalty'],
    gallery: ['https://picsum.photos/seed/gal8/600/400', 'https://picsum.photos/seed/gal9/600/400'],
    status: 'offline',
    availability: 'Busy',
    personalityLine: "Full of energy and stories. Can make any night feel like an adventure.",
    theme: { accent: '#fb7185', accentRGB: '251, 113, 133', bgStart: '#4c0519', bgEnd: '#1f2937', surfaceRGB: '31, 41, 55', text: '#ffe4e6', muted: '#fda4af', btnBg: '#fb7185', btnText: '#4c0519', btnBorder: '#fb7185', accentSoft: 'rgba(251, 113, 133, 0.2)' }
  },
  {
    id: 4,
    name: 'Lyra',
    age: 29,
    city: 'Berlin',
    imageUrl: 'https://picsum.photos/seed/woman4/500/700',
    interests: ['Techno', 'Street Art', 'Startups'],
    bio: "Fueled by creativity and caffeine. I thrive in the organized chaos of Berlin's art scene and tech world. My rhythm is the 4/4 beat of a kick drum. Seeking someone who can appreciate both the grit and the glamour of life.",
    passions: ['DJing', 'Coding', 'Vintage Fashion'],
    values: ['Innovation', 'Expression', 'Community'],
    gallery: ['https://picsum.photos/seed/gal10/600/400', 'https://picsum.photos/seed/gal11/600/400', 'https://picsum.photos/seed/gal12/600/400'],
    status: 'online',
    availability: 'Available for chat',
    personalityLine: "Thoughtful, playful, and always awake when you need someone.",
    theme: { accent: '#a78bfa', accentRGB: '167, 139, 250', bgStart: '#2e1065', bgEnd: '#020617', surfaceRGB: '2, 6, 23', text: '#f5f3ff', muted: '#ddd6fe', btnBg: '#a78bfa', btnText: '#2e1065', btnBorder: '#a78bfa', accentSoft: 'rgba(167, 139, 250, 0.2)' }
  },
  {
    id: 5,
    name: 'Aria',
    age: 33,
    city: 'Florence',
    imageUrl: 'https://picsum.photos/seed/woman5/500/700',
    interests: ['History', 'Cooking', 'Opera'],
    bio: "I walk through life as if it were a grand museum, marveling at the art, history, and culture around me. Passionate about recreating Renaissance recipes and getting lost in the libretto of an opera. Let's create our own masterpiece.",
    passions: ['Sculpture', 'Wine Tasting', 'Learning Languages'],
    values: ['Beauty', 'Knowledge', 'Passion'],
    gallery: ['https://picsum.photos/seed/gal13/600/400', 'https://picsum.photos/seed/gal14/600/400'],
    status: 'online',
    availability: 'Available for chat',
    personalityLine: "Soft voice. Sharp mind. No rush. For the man who appreciates the finer things.",
    theme: { accent: '#fca5a5', accentRGB: '252, 165, 165', bgStart: '#450a0a', bgEnd: '#020617', surfaceRGB: '28, 25, 23', text: '#fef2f2', muted: '#fecaca', btnBg: '#fca5a5', btnText: '#450a0a', btnBorder: '#fca5a5', accentSoft: 'rgba(252, 165, 165, 0.2)' }
  },
  {
    id: 6,
    name: 'Nova',
    age: 27,
    city: 'New York',
    imageUrl: 'https://picsum.photos/seed/woman6/500/700',
    interests: ['Theater', 'Mixology', 'Architecture'],
    bio: "A city soul with a heart for stories. From Broadway stages to hidden speakeasies, I'm captivated by the narratives that shape our lives. I'm ambitious, witty, and believe the best view of the skyline is from a rooftop bar at midnight.",
    passions: ['Playwriting', 'Contemporary Dance', 'Podcasting'],
    values: ['Ambition', 'Humor', 'Connection'],
    gallery: ['https://picsum.photos/seed/gal15/600/400', 'https://picsum.photos/seed/gal16/600/400', 'https://picsum.photos/seed/gal17/600/400', 'https://picsum.photos/seed/gal18/600/400'],
    status: 'offline',
    availability: 'Busy',
    personalityLine: "Witty, ambitious, and knows all the best spots in the city. Your guide to an unforgettable night.",
    theme: { accent: '#93c5fd', accentRGB: '147, 197, 253', bgStart: '#1e3a8a', bgEnd: '#020617', surfaceRGB: '30, 41, 59', text: '#eff6ff', muted: '#dbeafe', btnBg: '#93c5fd', btnText: '#1e3a8a', btnBorder: '#93c5fd', accentSoft: 'rgba(147, 197, 253, 0.2)' }
  },
  {
    id: 7,
    name: 'Juniper',
    age: 26,
    city: 'Portland',
    imageUrl: 'https://picsum.photos/seed/woman7/500/700',
    interests: ['Nature', 'Craft Beer', 'Reading'],
    bio: "An old soul with a love for the great outdoors. You can find me hiking through misty forests, tending to my garden, or curled up in a cozy bookstore. Seeking a gentle, thoughtful connection with someone who appreciates the simple things.",
    passions: ['Herbalism', 'Pottery', 'Folk Music'],
    values: ['Sustainability', 'Compassion', 'Simplicity'],
    gallery: ['https://picsum.photos/seed/gal19/600/400', 'https://picsum.photos/seed/gal20/600/400'],
    status: 'online',
    availability: 'Available for chat',
    personalityLine: "Loves slow conversations, bold questions, and a good cup of coffee.",
    theme: { accent: '#4ade80', accentRGB: '74, 222, 128', bgStart: '#052e16', bgEnd: '#020617', surfaceRGB: '4, 19, 14', text: '#f0fdf4', muted: '#bbf7d0', btnBg: '#4ade80', btnText: '#052e16', btnBorder: '#4ade80', accentSoft: 'rgba(74, 222, 128, 0.2)' }
  },
  {
    id: 8,
    name: 'Sloane',
    age: 30,
    city: 'London',
    imageUrl: 'https://picsum.photos/seed/woman8/500/700',
    interests: ['Fashion', 'Politics', 'Equestrian'],
    bio: "Sharp, ambitious, and unapologetically direct. I navigate the worlds of high fashion and political journalism with equal parts grace and tenacity. I appreciate intelligence, wit, and a well-tailored suit. Not for the faint of heart.",
    passions: ['Debate', 'Modern Art', 'Traveling First Class'],
    values: ['Intellect', 'Power', 'Elegance'],
    gallery: ['https://picsum.photos/seed/gal21/600/400', 'https://picsum.photos/seed/gal22/600/400', 'https://picsum.photos/seed/gal23/600/400'],
    status: 'online',
    availability: 'Busy',
    personalityLine: "Direct, intelligent, and not afraid to challenge you. This is where you find real chemistry.",
    theme: { accent: '#e5e7eb', accentRGB: '229, 231, 235', bgStart: '#1f2937', bgEnd: '#020617', surfaceRGB: '17, 24, 39', text: '#f9fafb', muted: '#d1d5db', btnBg: '#e5e7eb', btnText: '#1f2937', btnBorder: '#e5e7eb', accentSoft: 'rgba(229, 231, 235, 0.2)' }
  }
];
