
import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectionStrategy, NgZone, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-particle-background',
  template: `<canvas #canvas class="absolute inset-0 w-full h-full pointer-events-none z-0"></canvas>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticleBackgroundComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() accent: string = '#a78bfa';
  @Input() accentRgb: string = '167, 139, 250';
  @Input() swapTrigger: number = 0; // bump this when hero changes to animate
  @Input() mode: 'hero' | 'section' = 'hero';
  @Input() fitMode: 'viewport' | 'container' = 'viewport';

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private sparkles!: THREE.Points;
  private clock!: THREE.Clock;
  private animationFrameId: number | null = null;
  private colorIndices!: Uint8Array;
  private palette: THREE.Color[] = [];
  private baseOpacity = 0.35;
  private swapState: { active: boolean; start: number; duration: number } = { active: false, start: 0, duration: 0.9 };
  private parallax = new THREE.Vector2(0, 0);
  private parallaxTarget = new THREE.Vector2(0, 0);
  private resizeObserver?: ResizeObserver;

  // New floating and breathing animation properties
  private particleVelocities!: Float32Array; // Y velocities for upward floating
  private particlePhases!: Float32Array;    // Phase offsets for breathing/twinkling
  private particleSizes!: Float32Array;     // Individual particle sizes
  private originalColors!: Float32Array;    // Store original colors for breathing effect
  private particleCount!: number;          // Dynamic based on mode
  private sparkleCount!: number;           // Dynamic based on mode
  private modeConfig = {
    hero: {
      particleCount: 10000,
      sparkleCount: 220,
      baseOpacity: 0.35,
      velocityScale: 1.0,
      twinkleAmplitude: 0.4
    },
    section: {
      particleCount: 6000,
      sparkleCount: 120,
      baseOpacity: 0.25,
      velocityScale: 0.6,
      twinkleAmplitude: 0.3
    }
  };

  constructor(private ngZone: NgZone) {}

  /**
   * Get canvas dimensions based on fitMode
   */
  private getCanvasDimensions(): { width: number; height: number } {
    if (this.fitMode === 'viewport') {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      };
    } else {
      // Container mode: use the parent element's dimensions
      const parentElement = this.canvasRef.nativeElement.parentElement;
      if (parentElement) {
        const rect = parentElement.getBoundingClientRect();
        return {
          width: rect.width || window.innerWidth,
          height: rect.height || window.innerHeight
        };
      } else {
        // Fallback to viewport if no parent
        return {
          width: window.innerWidth,
          height: window.innerHeight
        };
      }
    }
  }

  /**
   * Setup resize handling based on fitMode
   */
  private setupResizeHandling(): void {
    if (this.fitMode === 'container') {
      // Set up ResizeObserver for container mode to watch parent element size changes
      const parentElement = this.canvasRef.nativeElement.parentElement;
      if (parentElement && 'ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver((entries) => {
          // Debounce resize events to avoid excessive updates
          if (this.animationFrameId) {
            this.onWindowResize();
          }
        });
        this.resizeObserver.observe(parentElement);
      }
    }
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initScene();
      this.createParticles();
      this.createSparkles();
      this.animate();
      this.setupResizeHandling();
    });
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('mousemove', this.onPointerMove, { passive: true });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['accent'] || changes['accentRgb']) && this.particles) {
      this.updatePalette();
      this.recolorParticles();
      this.recolorSparkles(); // Also update sparkles with new theme
    }
    if (changes['swapTrigger'] && !changes['swapTrigger'].firstChange && this.particles) {
      this.triggerSwap();
    }
    if (changes['mode'] && !changes['mode'].firstChange && this.particles) {
      // Recreate particles with new mode settings
      this.scene.remove(this.particles);
      this.scene.remove(this.sparkles);
      this.disposeParticleGeometries();
      this.createParticles();
      this.createSparkles();
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('mousemove', this.onPointerMove);
    
    // Clean up ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
    
    this.disposeThreeObjects();
  }
  
  private disposeThreeObjects(): void {
    this.disposeParticleGeometries();
    if (this.renderer) {
        this.renderer.dispose();
    }
  }

  private disposeParticleGeometries(): void {
    if (this.particles) {
        this.particles.geometry.dispose();
        (this.particles.material as THREE.PointsMaterial).map?.dispose();
        (this.particles.material as THREE.PointsMaterial).dispose();
    }
    if (this.sparkles) {
        this.sparkles.geometry.dispose();
        (this.sparkles.material as THREE.PointsMaterial).map?.dispose();
        (this.sparkles.material as THREE.PointsMaterial).dispose();
    }
  }

  private initScene(): void {
    const dimensions = this.getCanvasDimensions();
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, dimensions.width / dimensions.height, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(dimensions.width, dimensions.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    this.clock = new THREE.Clock();
  }
  
  private generateParticleTexture(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    return canvas;
  }

  private createParticles(): void {
    // Get mode-specific configuration
    const config = this.modeConfig[this.mode];
    this.particleCount = config.particleCount;
    this.baseOpacity = config.baseOpacity;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);
    
    // Initialize animation data arrays
    this.particleVelocities = new Float32Array(this.particleCount);
    this.particlePhases = new Float32Array(this.particleCount);
    this.particleSizes = new Float32Array(this.particleCount);
    this.originalColors = new Float32Array(this.particleCount * 3);
    
    this.updatePalette();
    this.colorIndices = new Uint8Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      // Particle positioning (keep original elliptical distribution)
      const radius = (Math.random() ** 2) * 8 + 1;
      const angle = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * 12;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = Math.sin(angle) * radius * 0.6; // Elliptical shape
      positions[i3 + 2] = z;

      // Color assignment
      const paletteIndex = Math.floor(Math.random() * this.palette.length);
      this.colorIndices[i] = paletteIndex;
      this.palette[paletteIndex].toArray(colors, i3);
      this.palette[paletteIndex].toArray(this.originalColors, i3); // Store original colors

      // Floating motion: random upward velocity (0.1 to 0.8 units per second)
      this.particleVelocities[i] = (Math.random() * 0.7 + 0.1) * config.velocityScale;
      
      // Breathing/twinkling: random phase offset for each particle
      this.particlePhases[i] = Math.random() * Math.PI * 2;
      
      // Size variation: base size with some variation
      const baseSize = 0.06 + Math.random() * 0.06; // 0.06 to 0.12
      this.particleSizes[i] = baseSize;
      sizes[i] = baseSize;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.09, // This becomes the base size, individual sizes will vary
      map: new THREE.CanvasTexture(this.generateParticleTexture()),
      blending: THREE.NormalBlending,
      depthWrite: false,
      transparent: true,
      opacity: this.baseOpacity,
      vertexColors: true,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  private createSparkles(): void {
    // Get mode-specific configuration
    const config = this.modeConfig[this.mode];
    this.sparkleCount = config.sparkleCount;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.sparkleCount * 3);
    const colors = new Float32Array(this.sparkleCount * 3);

    this.generateSparkleColors(colors);

    for (let i = 0; i < this.sparkleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 14;
      positions[i3 + 1] = (Math.random() - 0.5) * 9;
      positions[i3 + 2] = (Math.random() - 0.5) * 8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: this.mode === 'hero' ? 0.2 : 0.15, // Slightly smaller sparkles in section mode
      transparent: true,
      opacity: this.mode === 'hero' ? 0.7 : 0.5, // Dimmer sparkles in section mode
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      map: new THREE.CanvasTexture(this.generateParticleTexture()),
      sizeAttenuation: true,
    });

    this.sparkles = new THREE.Points(geometry, material);
    this.scene.add(this.sparkles);
  }

  private generateSparkleColors(colors: Float32Array): void {
    // Use theme-aware sparkle palette with brighter accent tones
    const base = new THREE.Color(this.accent || '#a78bfa');
    const bright = base.clone().lerp(new THREE.Color('#ffffff'), 0.4); // Brighter than regular palette
    const sparklePalette = [base, bright, new THREE.Color('#ffffff')];

    for (let i = 0; i < this.sparkleCount; i++) {
      const i3 = i * 3;
      const colorIndex = Math.floor(Math.random() * sparklePalette.length);
      sparklePalette[colorIndex].toArray(colors, i3);
    }
  }

  private recolorSparkles(): void {
    if (!this.sparkles) return;
    const colors = (this.sparkles.geometry.getAttribute('color') as THREE.BufferAttribute).array as Float32Array;
    this.generateSparkleColors(colors);
    (this.sparkles.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
  }

  private updatePalette(): void {
    const base = new THREE.Color(this.accent || '#a78bfa');
    const rgbParts = (this.accentRgb || '').split(',').map(p => Number(p.trim()));
    const alt = rgbParts.length === 3 ? new THREE.Color(rgbParts[0] / 255, rgbParts[1] / 255, rgbParts[2] / 255) : base.clone();

    const soft = base.clone().lerp(new THREE.Color('#0f172a'), 0.55); // darken for readability
    const bright = base.clone().lerp(new THREE.Color('#ffffff'), 0.25);

    this.palette = [base, alt, bright, soft];
  }

  private recolorParticles(): void {
    if (!this.particles || !this.originalColors) return;
    
    const colors = (this.particles.geometry.getAttribute('color') as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < this.colorIndices.length; i++) {
      const i3 = i * 3;
      const paletteIndex = this.colorIndices[i] % this.palette.length;
      
      // Update both current colors and original colors for breathing effect
      this.palette[paletteIndex].toArray(colors, i3);
      this.palette[paletteIndex].toArray(this.originalColors, i3);
    }
    (this.particles.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
  }

  private triggerSwap(): void {
    this.swapState = { active: true, start: performance.now() / 1000, duration: 0.9 };
  }

  private onPointerMove = (event: MouseEvent): void => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = (event.clientY / window.innerHeight) * 2 - 1;
    this.parallaxTarget.set(x, -y);
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const deltaTime = this.clock.getDelta(); // Use delta time for frame-rate independent animation
    const elapsedTime = this.clock.getElapsedTime();
    
    // Original rotation animation
    this.particles.rotation.y = elapsedTime * 0.05;
    this.particles.rotation.z = elapsedTime * 0.03;

    // Parallax ease
    this.parallax.lerp(this.parallaxTarget, 0.06);
    this.scene.position.x = this.parallax.x * 0.5;
    this.scene.position.y = this.parallax.y * 0.35;

    // Update floating particle motion and breathing effects
    this.updateParticleFloating(deltaTime, elapsedTime);

    // Original swap animation (preserve existing functionality)
    if (this.swapState.active) {
      const now = performance.now() / 1000;
      const t = (now - this.swapState.start) / this.swapState.duration;
      const mat = this.particles.material as THREE.PointsMaterial;
      if (t <= 1) {
        // first half: push right and fade; second half: return and restore
        const phase = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
        const direction = t < 0.5 ? 1 : -1;
        const offset = direction * THREE.MathUtils.lerp(0, 5, phase);
        this.particles.position.x = offset;
        const targetOpacity = t < 0.5
          ? THREE.MathUtils.lerp(this.baseOpacity, 0.05, phase)
          : THREE.MathUtils.lerp(0.05, this.baseOpacity, phase);
        mat.opacity = targetOpacity;
      } else {
        this.particles.position.x = 0;
        mat.opacity = this.baseOpacity;
        this.swapState.active = false;
      }
    }

    // Enhanced sparkle animation with parallax
    if (this.sparkles) {
      const mat = this.sparkles.material as THREE.PointsMaterial;
      const baseSparkleOpacity = this.mode === 'hero' ? 0.7 : 0.5;
      mat.opacity = baseSparkleOpacity * (0.6 + Math.sin(elapsedTime * 1.8) * 0.4);
      this.sparkles.rotation.z = elapsedTime * 0.02;
      
      // Additional sparkle parallax (subtle)
      this.sparkles.position.x = this.parallax.x * 0.2;
      this.sparkles.position.y = this.parallax.y * 0.15;
    }

    this.renderer.render(this.scene, this.camera);
  }

  private updateParticleFloating(deltaTime: number, elapsedTime: number): void {
    if (!this.particles || !this.particleVelocities) return;

    const positions = (this.particles.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
    const colors = (this.particles.geometry.getAttribute('color') as THREE.BufferAttribute).array as Float32Array;
    const config = this.modeConfig[this.mode];

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const posY = i3 + 1; // Y position index

      // 1. Floating motion: move particles upward
      positions[posY] += this.particleVelocities[i] * deltaTime;

      // 2. Respawn particles that float too high
      if (positions[posY] > 6) { // Upper boundary
        // Reset to bottom with new random properties
        const radius = (Math.random() ** 2) * 8 + 1;
        const angle = Math.random() * Math.PI * 2;
        
        positions[i3] = Math.cos(angle) * radius;     // X position
        positions[posY] = -4 - Math.random() * 2;     // Y position (bottom)
        positions[i3 + 2] = (Math.random() - 0.5) * 12; // Z position
        
        // Assign new velocity and phase
        this.particleVelocities[i] = (Math.random() * 0.7 + 0.1) * config.velocityScale;
        this.particlePhases[i] = Math.random() * Math.PI * 2;
        
        // Assign new color
        const paletteIndex = Math.floor(Math.random() * this.palette.length);
        this.colorIndices[i] = paletteIndex;
        this.palette[paletteIndex].toArray(this.originalColors, i3);
      }

      // 3. Breathing/twinkling effect: modulate color brightness
      const twinklePhase = elapsedTime * 0.8 + this.particlePhases[i]; // Slow twinkling
      const brightness = 0.6 + config.twinkleAmplitude * Math.sin(twinklePhase);
      
      // Apply brightness to original color
      colors[i3] = this.originalColors[i3] * brightness;         // R
      colors[i3 + 1] = this.originalColors[i3 + 1] * brightness; // G
      colors[i3 + 2] = this.originalColors[i3 + 2] * brightness; // B
    }

    // Mark attributes as needing update
    (this.particles.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.particles.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
  }

  private onWindowResize = (): void => {
    this.ngZone.runOutsideAngular(() => {
        const dimensions = this.getCanvasDimensions();
        this.camera.aspect = dimensions.width / dimensions.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(dimensions.width, dimensions.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }
}
