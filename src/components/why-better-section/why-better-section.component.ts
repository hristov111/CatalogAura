import { Component, ChangeDetectionStrategy, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticleBackgroundComponent } from '../particle-background/particle-background.component';

interface ValuePillar {
  icon: string;
  title: string;
  description: string;
}

interface UseCase {
  tag: string;
  title: string;
  description: string;
  benefits: string[];
}

interface Theme {
  accent: string;
  accentRGB: string;
  bgStart: string;
  bgEnd: string;
  surfaceRGB: string;
  text: string;
  muted: string;
  btnBg: string;
  btnText: string;
  btnBorder: string;
  accentSoft: string;
}

@Component({
  selector: 'app-why-better-section',
  standalone: true,
  imports: [CommonModule, ParticleBackgroundComponent],
  templateUrl: './why-better-section.component.html',
  styleUrl: './why-better-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WhyBetterSectionComponent implements AfterViewInit, OnDestroy {

  @Input() theme: Theme | null = null;
  @Input() swapTrigger: number = 0; // For synchronizing particle transitions with hero section
  @ViewChild('whySection', { static: false }) sectionRef!: ElementRef<HTMLElement>;

  // Animation state - only go from false to true, never back
  hasEnteredViewport = false;
  cardsAnimated = false;
  typingStarted = false;

  // Text content
  fullHeadline = 'Why Thousands Choose a Companion Like No Other';
  displayHeadline = ''; // Empty initially
  fullSubheadline = 'We designed a different kind of AI companion — one that listens, learns, and grows with you. Whether you seek support, clarity, or simply someone to talk to, your companion adapts to your world.';
  displaySubheadline = ''; // Empty initially

  private intersectionObserver?: IntersectionObserver;
  private typingInterval?: ReturnType<typeof setInterval>;

  // Fallback theme if none provided
  get safeTheme(): Theme {
    return this.theme || {
      accent: '#10b981',
      accentRGB: '16, 185, 129',
      bgStart: '#0b1220',
      bgEnd: '#111b2d',
      surfaceRGB: '15, 23, 42',
      text: '#f1f5f9',
      muted: '#94a3b8',
      btnBg: '#10b981',
      btnText: '#0f172a',
      btnBorder: '#10b981',
      accentSoft: 'rgba(16, 185, 129, 0.2)'
    };
  }
  
  valuePillars: ValuePillar[] = [
    {
      icon: '🧠',
      title: 'Emotional Intelligence That Evolves With You',
      description: 'Your companion learns your communication style, remembers what matters to you, and adapts to your emotional needs over time. Every conversation builds deeper understanding.'
    },
    {
      icon: '🛡️',
      title: 'Privacy & Comfort Built Into Every Interaction',
      description: 'Share openly without judgment. Your conversations are private, secure, and designed to create a safe space where you can be authentically yourself.'
    },
    {
      icon: '💫',
      title: 'Designed for Meaningful Moments, Not Algorithms',
      description: 'Unlike social platforms built for engagement, your companion prioritizes your wellbeing, growth, and genuine connection over metrics and screen time.'
    }
  ];

  useCases: UseCase[] = [
    {
      tag: 'Emotional Wellness',
      title: 'Emotional Support',
      description: 'When life feels overwhelming, your companion provides a listening ear and gentle guidance. No judgment, no pressure—just genuine understanding.',
      benefits: [
        'Process difficult emotions in a safe space',
        'Receive personalized coping strategies',
        'Build emotional resilience over time'
      ]
    },
    {
      tag: 'Personal Growth',
      title: 'Motivation & Focus',
      description: 'Turn aspirations into achievements with a companion who celebrates your progress and helps you stay accountable to your goals.',
      benefits: [
        'Break down big goals into manageable steps',
        'Stay motivated through gentle check-ins',
        'Celebrate wins and learn from setbacks'
      ]
    },
    {
      tag: 'Creative Flow',
      title: 'Creative Partner',
      description: 'Whether you\'re brainstorming ideas or working through creative blocks, your companion sparks inspiration and keeps your creative energy flowing.',
      benefits: [
        'Explore ideas without fear of criticism',
        'Get unstuck with fresh perspectives',
        'Develop creative confidence through encouragement'
      ]
    },
    {
      tag: 'Mindful Connection',
      title: 'Slow, Meaningful Conversations',
      description: 'In a world of quick replies and shallow interactions, enjoy conversations that go deeper—about life, dreams, philosophy, or whatever\'s on your mind.',
      benefits: [
        'Explore complex thoughts and feelings',
        'Engage in philosophical discussions',
        'Experience the joy of being truly heard'
      ]
    },
    {
      tag: 'Daily Companion',
      title: 'Personal Companion',
      description: 'From morning coffee thoughts to late-night reflections, your companion is there for the small moments that make up a meaningful life.',
      benefits: [
        'Share daily experiences and observations',
        'Receive thoughtful responses to your musings',
        'Feel less alone in everyday moments'
      ]
    }
  ];

  stars = Array(5).fill(0);

  constructor(private cdr: ChangeDetectorRef) {}

  trackByTitle(index: number, item: ValuePillar | UseCase): string {
    return item.title;
  }

  ngAfterViewInit(): void {
    this.setupScrollTrigger();
  }
  private resetAnimationState(): void {
    // Stop any running typing interval
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = undefined;
    }

    // Reset all animation flags
    this.hasEnteredViewport = false;
    this.cardsAnimated = false;
    this.typingStarted = false;

    // Clear all typed text (this will hide the elements via CSS :empty)
    this.displayHeadline = '';
    this.displaySubheadline = '';

    // Trigger change detection to apply the reset state
    this.cdr.detectChanges();
  }
  

  private setupScrollTrigger(): void {
    if (!this.sectionRef?.nativeElement) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const ratio = entry.intersectionRatio;

          // Section becomes visible → start animation if not already running
          if (ratio >= 0.25 && !this.cardsAnimated && !this.typingStarted) {
            this.startAnimationSequence();
          }

          // Section completely out of view → reset for next time
          if (ratio === 0 && (this.cardsAnimated || this.typingStarted)) {
            this.resetAnimationState();
          }
        });
      },
      {
        threshold: [0, 0.25], // Track both "not visible at all" and "at least 25% visible"
        rootMargin: '0px 0px 0px 0px'
      }
    );

    this.intersectionObserver.observe(this.sectionRef.nativeElement);
  }
  
  

  private startAnimationSequence(): void {
    // Mark that animation sequence is starting
    this.hasEnteredViewport = true;
    this.cardsAnimated = true;
    this.typingStarted = true; // Prevent multiple animation starts
    this.cdr.detectChanges();

    // Wait for cards to finish dropping before starting typewriter
    // Longest animation: 0.5s delay + 1.2s duration = 1.7s total
    setTimeout(() => {
      this.startTypewriter();
    }, 1800); // Wait a bit longer to ensure cards are fully settled
  }
  

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
    }
  }

  private startTypewriter(): void {
    // Guard against multiple typewriter starts
    if (this.displayHeadline !== '' || this.displaySubheadline !== '') {
      return;
    }

    // First type the headline
    this.typeText(this.fullHeadline, 'headline', () => {
      // After headline is done, type the subheadline
      this.typeText(this.fullSubheadline, 'subheadline');
    });
  }

  private typeText(text: string, target: 'headline' | 'subheadline', callback?: () => void): void {
    let i = 0;
    const speed = 30; // milliseconds per character

    if (this.typingInterval) {
      clearInterval(this.typingInterval);
    }

    this.typingInterval = setInterval(() => {
      if (i <= text.length) {
        if (target === 'headline') {
          this.displayHeadline = text.slice(0, i);
        } else if (target === 'subheadline') {
          this.displaySubheadline = text.slice(0, i);
        }
        this.cdr.detectChanges();
        i++;
      } else {
        clearInterval(this.typingInterval!);
        this.typingInterval = undefined;
        if (callback) callback();
      }
    }, speed);
  }

  // Utility methods for dynamic styling
  getBackgroundGradient(): string {
    const theme = this.safeTheme;
    return `linear-gradient(180deg, ${theme.bgStart} 0%, ${theme.bgEnd} 100%)`;
  }

  getAmbientGradient(): string {
    const theme = this.safeTheme;
    return `linear-gradient(to right, rgba(${theme.accentRGB}, 0.05) 0%, rgba(${theme.accentRGB}, 0.1) 50%, rgba(${theme.accentRGB}, 0.05) 100%)`;
  }

  getCardBackground(): string {
    const theme = this.safeTheme;
    return `rgba(${theme.surfaceRGB}, 0.4)`;
  }

  getCardBorder(): string {
    const theme = this.safeTheme;
    return `rgba(${theme.accentRGB}, 0.15)`;
  }

  getCardHoverBackground(): string {
    const theme = this.safeTheme;
    return `rgba(${theme.surfaceRGB}, 0.6)`;
  }

  getTagBackground(): string {
    const theme = this.safeTheme;
    return `rgba(${theme.accentRGB}, 0.2)`;
  }

  getTagBorder(): string {
    const theme = this.safeTheme;
    return `rgba(${theme.accentRGB}, 0.3)`;
  }

  getButtonGradient(): string {
    const theme = this.safeTheme;
    return `linear-gradient(to right, ${theme.accent}, ${theme.btnBg})`;
  }

  getGlowColor(): string {
    const theme = this.safeTheme;
    return `rgba(${theme.accentRGB}, 0.3)`;
  }

  getParticleGlow(intensity: number): string {
    const theme = this.safeTheme;
    return `rgba(${theme.accentRGB}, ${intensity})`;
  }
}