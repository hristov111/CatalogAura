
import { Component, ChangeDetectionStrategy, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { ProfileCardComponent } from './components/profile-card/profile-card.component';
import { ProfileDetailComponent } from './components/profile-detail/profile-detail.component';
import { ParticleBackgroundComponent } from './components/particle-background/particle-background.component';
import { IntroParticlesComponent } from './components/intro-particles/intro-particles.component';
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
  imports: [CommonModule, NgOptimizedImage, HeaderComponent, ProfileCardComponent, ProfileDetailComponent, ParticleBackgroundComponent, IntroParticlesComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  
  readonly profiles = signal<Profile[]>(MOCK_PROFILES);
  readonly selectedProfile = signal<Profile | null>(null);
  readonly promptText = signal('');
  readonly showHeroGallery = signal(false);
  readonly isTransitioning = signal(false);
  readonly particleTrigger = signal(0);
  readonly activeGalleryIndex = signal(0);
  
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
    if (this.isTransitioning()) return;
    
    this.isTransitioning.set(true);
    this.particleTrigger.update(v => v + 1);
    
    setTimeout(() => {
      this.featuredIndex.update(current => (current + 1) % this.profiles().length);
      this.activeGalleryIndex.set(0); // Reset gallery
      this.isTransitioning.set(false);
    }, 600);
  }

  prevProfile(): void {
    if (this.isTransitioning()) return;
    
    this.isTransitioning.set(true);
    this.particleTrigger.update(v => v + 1);

    setTimeout(() => {
      this.featuredIndex.update(current => (current - 1 + this.profiles().length) % this.profiles().length);
      this.activeGalleryIndex.set(0); // Reset gallery
      this.isTransitioning.set(false);
    }, 600);
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
    // Start fade transition to hero
    setTimeout(() => {
      this.introActive.set(false);
      
      // Trigger card sweep animation slightly after hero appears
      setTimeout(() => {
        this.cardsLoaded.set(true);
      }, 500);

      // Wake up CTA after 3 seconds
      setTimeout(() => {
        this.ctaAwake.set(true);
      }, 3000);
      
    }, 200); // Small delay for smooth transition
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
    extendedBio: "When I'm not lost in the galleries of the Louvre or sipping espresso at a corner café, you'll find me sailing along the Seine at sunset, sketching the city's skyline. My evenings are often spent at intimate jazz clubs where the music flows like conversation. I've traveled through 23 countries, collecting stories and perspectives that shape how I see the world. What draws me to meaningful connections is the ability to share these experiences with someone who appreciates depth over surface-level chatter. I'm fluent in three languages, hold a degree in Art History, and believe that every person has a story worth hearing.",
    passions: ['Oil Painting', 'Classic French Cinema', 'Urban Exploration'],
    values: ['Authenticity', 'Intellectual Curiosity', 'Kindness'],
    gallery: ['https://picsum.photos/seed/gal1/600/400', 'https://picsum.photos/seed/gal2/600/400', 'https://picsum.photos/seed/gal3/600/400', 'https://picsum.photos/seed/gal4/600/400'],
    status: 'online',
    availability: 'Available for chat',
    personalityLine: "Soft-spoken. Curious. Always present when you need someone real.",
    verified: true,
    responseTime: '2-5 minutes',
    specialOffer: 'First 30 minutes free for new connections this week',
    testimonials: [
      "Elara has this incredible way of making you feel heard. Our conversations flow effortlessly, and she remembers every detail. Truly special.",
      "The most genuine person I've connected with here. Her passion for art and life is contagious.",
      "Intelligent, warm, and absolutely captivating. Worth every moment."
    ],
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
    extendedBio: "I've spent the last decade studying traditional Japanese arts while working as a mindfulness coach and ceramic artist. My studio overlooks a zen garden where I create pieces that blend ancient techniques with contemporary aesthetics. I practice daily meditation at 5 AM, hike through the mountains every weekend, and host intimate tea ceremonies for friends. My approach to connection is thoughtful and intentional—I believe in quality over quantity. I'm looking for someone who values presence, can appreciate silence as much as conversation, and isn't afraid to explore life's deeper questions together.",
    passions: ['Ikebana (Flower Arranging)', 'Tea Ceremonies', 'Writing Haikus'],
    values: ['Mindfulness', 'Respect for Nature', 'Growth'],
    gallery: ['https://picsum.photos/seed/gal5/600/400', 'https://picsum.photos/seed/gal6/600/400', 'https://picsum.photos/seed/gal7/600/400'],
    status: 'online',
    availability: 'Available for chat',
    personalityLine: "A calm presence with a surprisingly playful side. Ready for a deep conversation.",
    verified: true,
    responseTime: '3-7 minutes',
    specialOffer: 'Exclusive virtual tea ceremony experience included',
    testimonials: [
      "Seraphina brings such peace and wisdom to every conversation. She's helped me see things from perspectives I never considered.",
      "Authentic, grounded, and incredibly insightful. Her presence alone is calming.",
      "The most thoughtful and present person I've met. Every chat feels like a gift."
    ],
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
    extendedBio: "I'm a marine biologist by day and a free spirit by night. When I'm not researching coral reefs or teaching scuba diving, you'll find me at Bondi Beach catching waves before sunrise or around a bonfire with friends, guitar in hand. I've surfed breaks from Bali to Portugal, documented over 200 species of marine life, and never turn down a spontaneous road trip. My energy is infectious, my stories are endless, and my loyalty runs deep. I'm seeking someone who can match my adventurous spirit, isn't intimidated by my independence, and knows how to have fun while keeping things real. Life's too short for boring conversations.",
    passions: ['Marine Biology', 'Acoustic Guitar', 'Road Trips'],
    values: ['Freedom', 'Spontaneity', 'Loyalty'],
    gallery: ['https://picsum.photos/seed/gal8/600/400', 'https://picsum.photos/seed/gal9/600/400'],
    status: 'offline',
    availability: 'Busy',
    personalityLine: "Full of energy and stories. Can make any night feel like an adventure.",
    verified: true,
    responseTime: '5-10 minutes',
    specialOffer: 'Share your favorite adventure story and get priority response',
    testimonials: [
      "Isla is pure energy and joy. Every conversation feels like an adventure. She's genuine, fun, and absolutely unforgettable.",
      "The most spontaneous and exciting person I've connected with. She makes life feel like a celebration.",
      "Her passion for life is contagious. She's helped me see the world through fresh eyes."
    ],
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
    extendedBio: "I'm a full-stack developer by day and a techno DJ by night, living at the intersection of code and creativity. My weekends are spent exploring Berlin's underground club scene, discovering new street art, and building side projects that merge technology with art. I've DJ'd at Berghain, launched two successful startups, and curated art installations that blend digital and physical worlds. I'm fluent in four programming languages and three spoken languages. My ideal connection is someone who can discuss algorithms over breakfast and dance until sunrise. I value authenticity, intellectual curiosity, and people who aren't afraid to challenge the status quo.",
    passions: ['DJing', 'Coding', 'Vintage Fashion'],
    values: ['Innovation', 'Expression', 'Community'],
    gallery: ['https://picsum.photos/seed/gal10/600/400', 'https://picsum.photos/seed/gal11/600/400', 'https://picsum.photos/seed/gal12/600/400'],
    status: 'online',
    availability: 'Available for chat',
    personalityLine: "Thoughtful, playful, and always awake when you need someone.",
    verified: true,
    responseTime: '1-4 minutes',
    specialOffer: 'Get a custom playlist curated just for you',
    testimonials: [
      "Lyra is brilliant, creative, and endlessly fascinating. Our conversations range from tech to art to life philosophy. She's the real deal.",
      "The most interesting person I've met here. Her energy is magnetic and her mind is sharp.",
      "She's authentic, intelligent, and knows how to have a good time. Perfect balance of depth and fun."
    ],
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
    extendedBio: "I'm an art historian and culinary enthusiast who's made Florence my home for the past eight years. My days are spent researching Renaissance art at the Uffizi Gallery, and my evenings are dedicated to recreating 15th-century recipes in my kitchen overlooking the Arno River. I speak five languages, have a master's degree in Art History, and I'm currently writing a book about the intersection of food and art in Renaissance Italy. I attend opera performances monthly, host intimate dinner parties for friends, and believe that life's greatest pleasures come from slowing down and savoring each moment. I'm seeking someone who appreciates sophistication, can engage in deep conversations about culture and history, and isn't afraid to indulge in life's luxuries.",
    passions: ['Sculpture', 'Wine Tasting', 'Learning Languages'],
    values: ['Beauty', 'Knowledge', 'Passion'],
    gallery: ['https://picsum.photos/seed/gal13/600/400', 'https://picsum.photos/seed/gal14/600/400'],
    status: 'online',
    availability: 'Available for chat',
    personalityLine: "Soft voice. Sharp mind. No rush. For the man who appreciates the finer things.",
    verified: true,
    responseTime: '4-8 minutes',
    specialOffer: 'Exclusive Renaissance recipe collection included',
    testimonials: [
      "Aria is elegance personified. Her knowledge and passion are matched only by her warmth and grace. Truly exceptional.",
      "The most cultured and refined person I've connected with. Every conversation is like attending a masterclass.",
      "She's sophisticated, intelligent, and has this incredible ability to make you feel special. A rare find."
    ],
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
    extendedBio: "I'm a playwright and podcast host living in the heart of Manhattan, where every street corner tells a story. My work has been featured off-Broadway, I host a weekly podcast about urban narratives, and I moonlight as a mixologist at a secret speakeasy in the East Village. I've written three plays, interviewed over 200 fascinating people, and know every hidden gem in NYC. My apartment is filled with vintage architecture books, play scripts, and cocktail recipes from the 1920s. I'm ambitious, quick-witted, and believe that the best connections happen when you're both fully present and genuinely curious about each other. I'm looking for someone who can keep up with my energy, appreciates good storytelling, and isn't intimidated by a woman who knows what she wants.",
    passions: ['Playwriting', 'Contemporary Dance', 'Podcasting'],
    values: ['Ambition', 'Humor', 'Connection'],
    gallery: ['https://picsum.photos/seed/gal15/600/400', 'https://picsum.photos/seed/gal16/600/400', 'https://picsum.photos/seed/gal17/600/400', 'https://picsum.photos/seed/gal18/600/400'],
    status: 'offline',
    availability: 'Busy',
    personalityLine: "Witty, ambitious, and knows all the best spots in the city. Your guide to an unforgettable night.",
    verified: true,
    responseTime: '6-12 minutes',
    specialOffer: 'Get featured in my next podcast episode',
    testimonials: [
      "Nova is brilliant, hilarious, and absolutely magnetic. Our conversations are always engaging and full of laughter.",
      "The most dynamic person I've met here. She's ambitious, witty, and knows how to make every moment count.",
      "She's sharp, creative, and has this incredible ability to make you feel like the most interesting person in the room."
    ],
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
    extendedBio: "I'm a herbalist and potter living in a small cottage on the edge of Portland, surrounded by my garden where I grow medicinal herbs and vegetables. My mornings start with meditation in my garden, followed by hours in my pottery studio creating functional art pieces. I've hiked every major trail in the Pacific Northwest, brew my own kombucha, and host monthly folk music gatherings around a fire pit. I'm passionate about sustainable living, have a degree in Environmental Science, and believe that the best conversations happen when you're fully present and unplugged. I'm seeking someone who values authenticity over pretense, appreciates nature's rhythms, and isn't afraid of deep, meaningful conversations about life, purpose, and connection.",
    passions: ['Herbalism', 'Pottery', 'Folk Music'],
    values: ['Sustainability', 'Compassion', 'Simplicity'],
    gallery: ['https://picsum.photos/seed/gal19/600/400', 'https://picsum.photos/seed/gal20/600/400'],
    status: 'online',
    availability: 'Available for chat',
    personalityLine: "Loves slow conversations, bold questions, and a good cup of coffee.",
    verified: true,
    responseTime: '3-6 minutes',
    specialOffer: 'Receive a handmade pottery piece with your first connection',
    testimonials: [
      "Juniper is the most grounded and authentic person I've met. Her presence is calming and her wisdom is profound.",
      "She's genuine, thoughtful, and has this incredible ability to make you feel truly seen and heard.",
      "The most peaceful and present person I've connected with. Every conversation feels like a breath of fresh air."
    ],
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
    extendedBio: "I'm a political correspondent for a major publication and a fashion consultant, living between London and Paris. My days are spent covering Westminster politics, attending fashion weeks, and riding my horse through Hyde Park at dawn. I've interviewed prime ministers, styled A-list celebrities, and competed in equestrian events across Europe. I hold degrees in Political Science and Journalism, speak four languages fluently, and have a wardrobe that's been featured in Vogue. I'm direct, ambitious, and unapologetically myself. I value intelligence, confidence, and people who aren't intimidated by a strong woman. I'm seeking someone who can match my intensity, engage in stimulating debates, and appreciate the finer things in life without losing sight of what truly matters.",
    passions: ['Debate', 'Modern Art', 'Traveling First Class'],
    values: ['Intellect', 'Power', 'Elegance'],
    gallery: ['https://picsum.photos/seed/gal21/600/400', 'https://picsum.photos/seed/gal22/600/400', 'https://picsum.photos/seed/gal23/600/400'],
    status: 'online',
    availability: 'Busy',
    personalityLine: "Direct, intelligent, and not afraid to challenge you. This is where you find real chemistry.",
    verified: true,
    responseTime: '2-5 minutes',
    specialOffer: 'Exclusive access to my fashion week insights',
    testimonials: [
      "Sloane is sharp, sophisticated, and absolutely captivating. Our conversations are intellectually stimulating and full of wit.",
      "The most confident and intelligent person I've connected with. She challenges you to be your best self.",
      "She's powerful, elegant, and knows exactly what she wants. A force to be reckoned with in the best way."
    ],
    theme: { accent: '#e5e7eb', accentRGB: '229, 231, 235', bgStart: '#1f2937', bgEnd: '#020617', surfaceRGB: '17, 24, 39', text: '#f9fafb', muted: '#d1d5db', btnBg: '#e5e7eb', btnText: '#1f2937', btnBorder: '#e5e7eb', accentSoft: 'rgba(229, 231, 235, 0.2)' }
  }
];
