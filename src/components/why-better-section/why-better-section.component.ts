import { Component, ChangeDetectionStrategy, Input, ViewChild, ViewChildren, QueryList, ElementRef, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticleBackgroundComponent } from '../particle-background/particle-background.component';

interface ValuePillar {
  icon: string;
  title: string;
  description: string;
  sentences: string[];
}

interface UseCase {
  tag: string;
  title: string;
  description: string;
  benefits: string[];
  CTA:string;
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
  @ViewChild('useCaseGrid', { static: false }) useCaseGridRef!: ElementRef<HTMLElement>;
  @ViewChild('ctaSection', { static: false }) ctaSectionRef!: ElementRef<HTMLElement>;
  @ViewChildren('videoPlayer') videoPlayers!: QueryList<ElementRef<HTMLVideoElement>>;
  @ViewChildren('useCaseTag') useCaseTags!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('useCaseTitle') useCaseTitles!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('cardCanvas') cardCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  // Animation state - only go from false to true, never back
  hasEnteredViewport = false;
  cardsAnimated = false;
  cardsSettled = false;
  typingStarted = false;
  headlineTypingComplete = false;
  subheadlineTypingComplete = false;
  useCasesAnimated = false;
  flipAnimated = false;
  
  // Interaction state
  clickedCardIndex: number | null = null;

  // Text content
  fullHeadline = 'Why Thousands Choose a Companion Like No Other';
  displayHeadline = ''; // Empty initially
  fullSubheadline = 'We designed a different kind of AI companion — one that listens, learns, and grows with you. Whether you seek support, clarity, or simply someone to talk to, your companion adapts to your world.';
  displaySubheadline = ''; // Empty initially

  private intersectionObserver?: IntersectionObserver;
  private typingInterval?: ReturnType<typeof setInterval>;
  private flipInterval?: ReturnType<typeof setInterval>;
  
  // Scramble effect state
  private scrambleIntervals = new WeakMap<HTMLElement, any>();
  private readonly scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

  // Review Carousel State
  reviews = [
    { text: "More present and comforting than any AI companion I’ve tried.", author: "Verified User" },
    { text: "It feels like someone is actually listening, not just responding.", author: "Verified User" },
    { text: "I can be honest here without feeling judged or rushed.", author: "Verified User" },
    { text: "The support is gentle, but it really helps me stay grounded.", author: "Verified User" },
    { text: "It feels like someone is actually listening, not just responding.", author: "Verified User" }
  ];
  currentReviewIndex = 0;
  private reviewInterval?: ReturnType<typeof setInterval>;
  isReviewHovered = false;

  // SVG Stroke Animation State
  isStrokeAnimating = false;
  private strokeInterval?: ReturnType<typeof setInterval>;

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
      description: 'Your companion learns your communication style, remembers what matters to you, and adapts to your emotional needs over time. Every conversation builds deeper understanding.',
      sentences: [
        'Your companion learns your communication style, remembers what matters to you, and adapts to your emotional needs over time.',
        'Every conversation builds deeper understanding.'
      ]
    },
    {
      icon: '🛡️',
      title: 'Privacy & Comfort Built Into Every Interaction',
      description: 'Share openly without judgment. Your conversations are private, secure, and designed to create a safe space where you can be authentically yourself.',
      sentences: [
        'Share openly without judgment.',
        'Your conversations are private, secure, and designed to create a safe space where you can be authentically yourself.'
      ]
    },
    {
      icon: '💫',
      title: 'Designed for Meaningful Moments, Not Algorithms',
      description: 'Unlike social platforms built for engagement, your companion prioritizes your wellbeing, growth, and genuine connection over metrics and screen time.',
      sentences: [
        'Unlike social platforms built for engagement, your companion prioritizes your wellbeing, growth, and genuine connection over metrics and screen time.'
      ]
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
      ], 
      CTA: 'Try it now'
    },
    {
      tag: 'Personal Growth',
      title: 'Motivation & Focus',
      description: 'Turn aspirations into achievements with a companion who celebrates your progress and helps you stay accountable to your goals.',
      benefits: [
        'Break down big goals into manageable steps',
        'Stay motivated through gentle check-ins',
        'Celebrate wins and learn from setbacks'
      ],
      CTA: 'Take a moment'
    },
    {
      tag: 'Creative Flow',
      title: 'Creative Partner',
      description: 'Whether you\'re brainstorming ideas or working through creative blocks, your companion sparks inspiration and keeps your creative energy flowing.',
      benefits: [
        'Explore ideas without fear of criticism',
        'Get unstuck with fresh perspectives',
        'Develop creative confidence through encouragement'
      ],
      CTA: 'Let’s talk'
    },
    {
      tag: 'Mindful Connection',
      title: 'Slow, Meaningful Conversations',
      description: 'In a world of quick replies and shallow interactions, enjoy conversations that go deeper—about life, dreams, philosophy, or whatever\'s on your mind.',
      benefits: [
        'Explore complex thoughts and feelings',
        'Engage in philosophical discussions',
        'Experience the joy of being truly heard'
      ],
      CTA: 'Discover emotional support'
    },
    {
      tag: 'Daily Companion',
      title: 'Personal Companion',
      description: 'From morning coffee thoughts to late-night reflections, your companion is there for the small moments that make up a meaningful life.',
      benefits: [
        'Share daily experiences and observations',
        'Receive thoughtful responses to your musings',
        'Feel less alone in everyday moments'
      ],
      CTA: 'See how it helps'

    }
  ];

  stars = Array(5).fill(0);

  private animationFrameId?: number;
  private particles: Array<{
    x: number;
    y: number;
    radius: number;
    alpha: number;
    speedX: number;
    speedY: number;
    baseX: number;
    baseY: number;
    angle: number;
    angleSpeed: number;
  }[]> = [];

  private tracers: Array<{
    distance: number;
    totalLength: number;
    points: {x: number, y: number}[];
  }> = [];

  constructor(private cdr: ChangeDetectorRef) {}

  trackByTitle(index: number, item: ValuePillar | UseCase): string {
    return item.title;
  }

  ngAfterViewInit(): void {
    this.setupScrollTrigger();
    // Initialize particles after view check
    setTimeout(() => {
        this.initCardParticles();
        this.animateParticles();
        this.startFlipTimer();
        this.startReviewCarousel();
        this.startStrokeAnimation();
    }, 100);
  }

  private startFlipTimer(): void {
    if (this.flipInterval) clearInterval(this.flipInterval);
    
    this.flipInterval = setInterval(() => {
      this.flipAnimated = !this.flipAnimated;
      this.cdr.detectChanges();
    }, 4000);
  }

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
    }
    if (this.flipInterval) {
      clearInterval(this.flipInterval);
    }
    this.stopReviewCarousel();
    this.stopStrokeAnimation();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    // Cleanup scramble intervals
    // (WeakMap cleans itself up, but good to be mindful)
  }

  // --- Particle System ---
  private initCardParticles(): void {
    if (!this.cardCanvases) return;

    this.particles = [];
    this.tracers = [];
    
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.cardCanvases.forEach(canvasRef => {
        const canvas = canvasRef.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set correct resolution
        const rect = canvas.parentElement!.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Create particles for this canvas
        const cardParticles = [];
        const particleCount = 30; // Lightweight

        for (let i = 0; i < particleCount; i++) {
            cardParticles.push(this.createParticle(canvas.width, canvas.height));
        }
        this.particles.push(cardParticles);

        // Init Tracer
        // Approximate rounded rect perimeter: 2*(w-2r) + 2*(h-2r) + 2*PI*r
        // r = 16 (rounded-2xl)
        const r = 16;
        const w = canvas.width;
        const h = canvas.height;
        const perimeter = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
        
        this.tracers.push({
          distance: 0,
          totalLength: perimeter,
          points: [] // Store trail points if needed, or calc on fly
        });
    });
  }

  private createParticle(w: number, h: number) {
      return {
          x: Math.random() * w,
          y: Math.random() * h,
          baseX: Math.random() * w, // Center of rotation
          baseY: Math.random() * h,
          radius: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.5 + 0.1,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2,
          angle: Math.random() * Math.PI * 2,
          angleSpeed: (Math.random() - 0.5) * 0.002 // Slow rotation
      };
  }

  private animateParticles(): void {
      if (!this.cardCanvases || this.cardCanvases.length === 0) return;

      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.cardCanvases.forEach((canvasRef, index) => {
          const canvas = canvasRef.nativeElement;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          const particles = this.particles[index];
          if (!particles) return;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw Particles
          particles.forEach(p => {
              // Update
              p.angle += p.angleSpeed;
              // Circular motion + gentle drift
              p.x += Math.cos(p.angle) * 0.2 + p.speedX;
              p.y += Math.sin(p.angle) * 0.2 + p.speedY;

              // Wrap around
              if (p.x < 0) p.x = canvas.width;
              if (p.x > canvas.width) p.x = 0;
              if (p.y < 0) p.y = canvas.height;
              if (p.y > canvas.height) p.y = 0;
              
              // Fade
              p.alpha += (Math.random() - 0.5) * 0.01;
              if (p.alpha < 0.1) p.alpha = 0.1;
              if (p.alpha > 0.6) p.alpha = 0.6;

              // Draw
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
              // Use safeTheme for color
              ctx.fillStyle = `rgba(${this.safeTheme.accentRGB}, ${p.alpha})`;
              ctx.fill();
          });

          // Draw Border Tracer (skip if reduced motion)
          if (!isReducedMotion && this.tracers[index]) {
            this.drawTracer(ctx, this.tracers[index], canvas.width, canvas.height);
          }
      });

      this.animationFrameId = requestAnimationFrame(() => this.animateParticles());
  }

  private drawTracer(ctx: CanvasRenderingContext2D, tracer: any, w: number, h: number): void {
    const r = 16; // Border radius
    // Ensure we don't divide by zero if small
    if (w < 2 * r || h < 2 * r) return;

    // --- 1. Calculate Speed & Update Distance ---
    // We want speed high in middle of sides, low at corners.
    // Determine which segment we are on.
    // Segments: Top(0), Right(1), Bottom(2), Left(3). (Simplification: Corners are part of flow)
    
    // Let's get current coordinates to determine segment roughly or use distance.
    // Easier: Map distance to segment.
    // Lengths:
    // Top: w - 2r (Line) + corner (PI*r/2) ~ actually corner is after line.
    // Sequence: Top Line -> TR Corner -> Right Line -> BR Corner -> Bottom Line -> BL Corner -> Left Line -> TL Corner
    const lineH = w - 2 * r;
    const lineV = h - 2 * r;
    const arcLen = Math.PI * r / 2;
    
    const seg1 = lineH;
    const seg2 = seg1 + arcLen;
    const seg3 = seg2 + lineV;
    const seg4 = seg3 + arcLen;
    const seg5 = seg4 + lineH;
    const seg6 = seg5 + arcLen;
    const seg7 = seg6 + lineV;
    const total = tracer.totalLength;

    // Normalize dist
    let d = tracer.distance % total;
    if (d < 0) d += total;

    // Determine current speed based on 'd'
    // Base speed
    const baseSpeed = 1.5;
    const maxSpeedAdd = 2.5; // Max speed = 4
    let speedFactor = 0.2; // Min speed factor

    // Check proximity to midpoints of Lines.
    // Midpoints:
    const midTop = lineH / 2;
    const midRight = seg2 + lineV / 2;
    const midBottom = seg4 + lineH / 2;
    const midLeft = seg6 + lineV / 2;

    // Distances to nearest midpoint
    const dists = [
      Math.abs(d - midTop),
      Math.abs(d - midRight),
      Math.abs(d - midBottom),
      Math.abs(d - midLeft)
    ];
    // Also check wrap-around for Left edge midpoint if close to end/start
    // Actually, simple sine wave over the linear segments might be enough?
    // Let's use a simple distance-based falloff from line centers.
    
    // Find closest edge center
    let closestMidDist = Math.min(...dists);
    // Rough logic: max speed at midTop, midRight, etc.
    // The curve: 1.0 at mid, drops to 0.0 at corners.
    // Max distance from mid is ~ (Line/2 + Arc).
    
    // Gaussian-like or simple linear falloff
    // Valid range for high speed is within the line segment.
    
    let isLine = false;
    let distFromMid = 0;
    let currentLineLen = 0;

    if (d < seg1) { isLine = true; distFromMid = Math.abs(d - midTop); currentLineLen = lineH; }
    else if (d > seg2 && d < seg3) { isLine = true; distFromMid = Math.abs(d - midRight); currentLineLen = lineV; }
    else if (d > seg4 && d < seg5) { isLine = true; distFromMid = Math.abs(d - midBottom); currentLineLen = lineH; }
    else if (d > seg6 && d < seg7) { isLine = true; distFromMid = Math.abs(d - midLeft); currentLineLen = lineV; }

    if (isLine) {
        // Normalize dist from mid (0 to Len/2)
        // 0 -> Factor 1.0
        // Len/2 -> Factor 0.0
        const norm = 1 - (distFromMid / (currentLineLen / 2));
        // Ease In/Out: cubic or sine
        speedFactor = 0.2 + 0.8 * (norm * norm); // Square for smoother ease
    } else {
        speedFactor = 0.2; // Slow on corners
    }

    tracer.distance += (baseSpeed + maxSpeedAdd * speedFactor);

    // --- 2. Draw Tracer Tail ---
    // We calculate N points backwards from current distance
    const tailSteps = 30; // Increased steps for smoother thick line
    const tailLen = 140; // Slightly longer tail
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < tailSteps; i++) {
        const tParams = (i / tailSteps); // 0 (head) to 1 (tail end)
        const backDist = tracer.distance - (tParams * tailLen);
        
        const pos = this.getPointOnRect(backDist, w, h, r, total);
        const nextPos = this.getPointOnRect(backDist - (tailLen/tailSteps), w, h, r, total); // Segment start

        // Slower fade out for better visibility
        const alpha = 1 - Math.pow(tParams, 1.5); 
        // Thicker line: starts at 4px
        const width = 4 * (1 - tParams * 0.6); 

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(nextPos.x, nextPos.y);
        
        // Color: Theme Accent with fade
        ctx.strokeStyle = `rgba(${this.safeTheme.accentRGB}, ${alpha})`;
        ctx.lineWidth = width;
        
        // Enhanced glow effect
        if (i < 12) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = `rgba(${this.safeTheme.accentRGB}, 1.0)`;
        } else {
            ctx.shadowBlur = 0;
        }
        
        ctx.stroke();
    }
    // Reset shadow
    ctx.shadowBlur = 0;
  }

  private getPointOnRect(dist: number, w: number, h: number, r: number, total: number) {
      let d = dist % total;
      if (d < 0) d += total;

      // Segments again
      const lineH = w - 2 * r;
      const lineV = h - 2 * r;
      const arcLen = Math.PI * r / 2;

      // 1. Top Line (Starts after TL corner, i.e., at x=r, y=0)
      if (d < lineH) {
          return { x: r + d, y: 0 };
      }
      d -= lineH;

      // 2. TR Corner (Center at w-r, r)
      if (d < arcLen) {
          const angle = -Math.PI / 2 + (d / arcLen) * (Math.PI / 2);
          return {
              x: (w - r) + r * Math.cos(angle),
              y: r + r * Math.sin(angle)
          };
      }
      d -= arcLen;

      // 3. Right Line
      if (d < lineV) {
          return { x: w, y: r + d };
      }
      d -= lineV;

      // 4. BR Corner (Center at w-r, h-r)
      if (d < arcLen) {
          const angle = 0 + (d / arcLen) * (Math.PI / 2);
          return {
              x: (w - r) + r * Math.cos(angle),
              y: (h - r) + r * Math.sin(angle)
          };
      }
      d -= arcLen;

      // 5. Bottom Line (Right to Left)
      if (d < lineH) {
          return { x: (w - r) - d, y: h };
      }
      d -= lineH;

      // 6. BL Corner (Center at r, h-r)
      if (d < arcLen) {
          const angle = Math.PI / 2 + (d / arcLen) * (Math.PI / 2);
          return {
              x: r + r * Math.cos(angle),
              y: (h - r) + r * Math.sin(angle)
          };
      }
      d -= arcLen;

      // 7. Left Line (Bottom to Top)
      if (d < lineV) {
          return { x: 0, y: (h - r) - d };
      }
      d -= lineV;

      // 8. TL Corner (Center at r, r)
      // Remaining d should be < arcLen
      const angle = Math.PI + (d / arcLen) * (Math.PI / 2);
      return {
          x: r + r * Math.cos(angle),
          y: r + r * Math.sin(angle)
      };
  }

  onCardClick(index: number): void {
    // Trigger animation state
    this.clickedCardIndex = index;
    
    // Haptic feedback for mobile
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }

    // Reset state after animation completes (400ms match CSS)
    setTimeout(() => {
      this.clickedCardIndex = null;
      this.cdr.detectChanges();
    }, 400);
  }
  
  // Scramble text effect
  scrambleText(event: MouseEvent, originalText: string): void {
    const target = event.target as HTMLElement;
    this.runScrambleEffect(target, originalText);
  }

  runScrambleEffect(target: HTMLElement, originalText: string): void {
    // Safety check
    if (!target) return;

    // Prevent re-triggering if already running
    if (this.scrambleIntervals.has(target)) {
      return;
    }

    // Lock dimensions to prevent layout shift
    const rect = target.getBoundingClientRect();
    target.style.width = `${rect.width}px`;
    target.style.height = `${rect.height}px`;
    target.style.display = 'inline-block';
    target.style.whiteSpace = 'nowrap';

    let iterations = 0;
    const interval = setInterval(() => {
      target.innerText = originalText
        .split("")
        .map((letter, index) => {
          if (index < iterations) {
            return originalText[index];
          }
          return this.scrambleChars[Math.floor(Math.random() * this.scrambleChars.length)];
        })
        .join("");

      if (iterations >= originalText.length) {
        clearInterval(interval);
        this.scrambleIntervals.delete(target);
        // Ensure exact original text is restored at the end
        target.innerText = originalText;
        // Unlock dimensions
        target.style.width = '';
        target.style.height = '';
        target.style.display = '';
        target.style.whiteSpace = '';
      }
      
      iterations += 1/3;
    }, 30);
    
    this.scrambleIntervals.set(target, interval);
  }

  // Interaction handlers removed to enforce viewport-only control
  // Videos are now controlled by the animation sequence

  private resetAnimationState(): void {
    // Stop any running typing interval
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = undefined;
    }

    // Reset all animation flags
    this.hasEnteredViewport = false;
    this.cardsAnimated = false;
    this.cardsSettled = false;
    this.typingStarted = false;

    this.headlineTypingComplete = false;
    this.subheadlineTypingComplete = false;
    this.useCasesAnimated = false;

    // Reset videos
    if (this.videoPlayers) {
      this.videoPlayers.forEach(player => {
        const video = player.nativeElement;
        video.pause();
        video.currentTime = 0;
      });
    }

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
          const isIntersecting = entry.isIntersecting;

          // Section becomes visible → start animation if not already running
          if ((ratio >= 0.1 || isIntersecting) && !this.cardsAnimated && !this.typingStarted) {
            this.startAnimationSequence();
          }

          // Section completely out of view → reset for next time
          if (ratio === 0 && !isIntersecting) {
            if (entry.target === this.sectionRef.nativeElement && (this.cardsAnimated || this.typingStarted)) {
              this.resetAnimationState();
            } else if (entry.target === this.useCaseGridRef?.nativeElement && this.useCasesAnimated) {
              this.useCasesAnimated = false;
            }
          }

          // Use Case Grid specific logic
          if (this.useCaseGridRef && entry.target === this.useCaseGridRef.nativeElement) {
            if ((ratio >= 0.1 || isIntersecting) && !this.useCasesAnimated) {
              this.startUseCaseAnimation();
            }
          }
        });
      },
      {
        threshold: [0, 0.1], // Trigger earlier
        rootMargin: '0px 0px -10% 0px' // Trigger when 10% from bottom
      }
    );

    this.intersectionObserver.observe(this.sectionRef.nativeElement);
    if (this.useCaseGridRef?.nativeElement) {
      this.intersectionObserver.observe(this.useCaseGridRef.nativeElement);
    }
  }

  private startUseCaseAnimation(): void {
    this.useCasesAnimated = true;
    
    // Stagger the scramble effect to match or follow card fade-ins
    // Cards have animation-delay: 0.1s, 0.2s, 0.3s...
    // We'll wait a bit for the cards to start appearing before scrambling
    
    const baseDelay = 300; // Start after cards begin to appear
    const stagger = 150;
    
    this.useCases.forEach((useCase, index) => {
      setTimeout(() => {
        // Find corresponding elements
        const tagEl = this.useCaseTags.get(index)?.nativeElement;
        const titleEl = this.useCaseTitles.get(index)?.nativeElement;
        
        if (tagEl) {
          this.runScrambleEffect(tagEl, useCase.tag);
        }
        
        if (titleEl) {
          // Slight delay between tag and title
          setTimeout(() => {
            this.runScrambleEffect(titleEl, useCase.title);
          }, 100);
        }
      }, baseDelay + (index * stagger));
    });
  }
  
  

  private startAnimationSequence(): void {
    // Mark that animation sequence is starting
    this.hasEnteredViewport = true;
    this.cardsAnimated = true;
    this.typingStarted = true; // Prevent multiple animation starts
    this.cdr.detectChanges();

    // Trigger cards settled state (media/text reveal) after cards have dropped
    setTimeout(() => {
      this.cardsSettled = true;
      
      // Play videos
      if (this.videoPlayers) {
        this.videoPlayers.forEach(player => {
          const video = player.nativeElement;
          video.muted = true;
          video.play().catch(() => {
            // Handle autoplay blocking if necessary
          });
        });
      }
      this.cdr.detectChanges();
    }, 1500);

    // Wait for cards to finish dropping before starting typewriter
    // Longest animation: 0.5s delay + 1.2s duration = 1.7s total
    setTimeout(() => {
      this.startTypewriter();
    }, 1800); // Wait a bit longer to ensure cards are fully settled
  }
  

  private startTypewriter(): void {
    // Guard against multiple typewriter starts
    if (this.displayHeadline !== '' || this.displaySubheadline !== '') {
      return;
    }

    // First type the headline
    this.typeText(this.fullHeadline, 'headline', () => {
      this.headlineTypingComplete = true;
      this.cdr.detectChanges();
      // After headline is done, type the subheadline
      this.typeText(this.fullSubheadline, 'subheadline', () => {
        this.subheadlineTypingComplete = true;
        this.cdr.detectChanges();
      });
    });
  }

  private typeText(text: string, target: 'headline' | 'subheadline', callback?: () => void): void {
    let i = 0;
    const speed = 40; // slower speed (was 30)

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

  getHighlightHue(): string {
    // Extract hue from accent color RGB
    const rgb = this.safeTheme.accentRGB.split(',').map(v => parseInt(v.trim()));
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let hue = 0;
    if (delta !== 0) {
      if (max === r) {
        hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
      } else if (max === g) {
        hue = ((b - r) / delta + 2) / 6;
      } else {
        hue = ((r - g) / delta + 4) / 6;
      }
    }
    
    return `${Math.round(hue * 360)}deg`;
  }

  // --- Review Carousel Methods ---
  startReviewCarousel(): void {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion) return;

    this.stopReviewCarousel();
    this.reviewInterval = setInterval(() => {
      if (!this.isReviewHovered) {
        this.currentReviewIndex = (this.currentReviewIndex + 1) % this.reviews.length;
        this.cdr.detectChanges();
      }
    }, 8000);
  }

  stopReviewCarousel(): void {
    if (this.reviewInterval) {
      clearInterval(this.reviewInterval);
      this.reviewInterval = undefined;
    }
  }

  onReviewHover(): void {
    this.isReviewHovered = true;
  }

  onReviewLeave(): void {
    this.isReviewHovered = false;
  }

  // --- SVG Stroke Animation ---
  private startStrokeAnimation(): void {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion) return;

    // Run immediately? No, wait for the first interval as per requirement "every 5 seconds"
    // Or run once initially? Usually animations start after a delay.
    // Let's set the interval.
    
    // Clear any existing
    this.stopStrokeAnimation();

    this.strokeInterval = setInterval(() => {
      this.triggerStrokeAnimation();
    }, 5000);
  }

  private triggerStrokeAnimation(): void {
    if (this.isStrokeAnimating) return;
    
    this.isStrokeAnimating = true;
    this.cdr.detectChanges();

    // Reset after animation duration (assume ~4s total for safety)
    setTimeout(() => {
      this.isStrokeAnimating = false;
      this.cdr.detectChanges();
    }, 4500); 
  }

  private stopStrokeAnimation(): void {
    if (this.strokeInterval) {
      clearInterval(this.strokeInterval);
      this.strokeInterval = undefined;
    }
  }
}
