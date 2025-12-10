
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

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initScene();
      this.createParticles();
      this.createSparkles();
      this.animate();
    });
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('mousemove', this.onPointerMove, { passive: true });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['accent'] || changes['accentRgb']) && this.particles) {
      this.updatePalette();
      this.recolorParticles();
    }
    if (changes['swapTrigger'] && !changes['swapTrigger'].firstChange && this.particles) {
      this.triggerSwap();
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('mousemove', this.onPointerMove);
    this.disposeThreeObjects();
  }
  
  private disposeThreeObjects(): void {
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
    if (this.renderer) {
        this.renderer.dispose();
    }
  }

  private initScene(): void {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
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
    const particleCount = 10000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    this.updatePalette();
    this.colorIndices = new Uint8Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      const radius = (Math.random() ** 2) * 8 + 1;
      const angle = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * 12;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = Math.sin(angle) * radius * 0.6; // Create an elliptical shape
      positions[i3 + 2] = z;

      const paletteIndex = Math.floor(Math.random() * this.palette.length);
      this.colorIndices[i] = paletteIndex;
      this.palette[paletteIndex].toArray(colors, i3);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.09,
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
    const sparkleCount = 220;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkleCount * 3);
    const colors = new Float32Array(sparkleCount * 3);

    const sparklePalette = [
      new THREE.Color(this.accent || '#a78bfa'),
      new THREE.Color('#ffffff')
    ];

    for (let i = 0; i < sparkleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 14;
      positions[i3 + 1] = (Math.random() - 0.5) * 9;
      positions[i3 + 2] = (Math.random() - 0.5) * 8;
      sparklePalette[Math.floor(Math.random() * sparklePalette.length)].toArray(colors, i3);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.2,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      map: new THREE.CanvasTexture(this.generateParticleTexture()),
      sizeAttenuation: true,
    });

    this.sparkles = new THREE.Points(geometry, material);
    this.scene.add(this.sparkles);
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
    const colors = (this.particles.geometry.getAttribute('color') as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < this.colorIndices.length; i++) {
      const i3 = i * 3;
      const paletteIndex = this.colorIndices[i] % this.palette.length;
      this.palette[paletteIndex].toArray(colors, i3);
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

    const elapsedTime = this.clock.getElapsedTime();
    this.particles.rotation.y = elapsedTime * 0.05;
    this.particles.rotation.z = elapsedTime * 0.03;

    // Parallax ease
    this.parallax.lerp(this.parallaxTarget, 0.06);
    this.scene.position.x = this.parallax.x * 0.5;
    this.scene.position.y = this.parallax.y * 0.35;

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

    // Sparkle twinkle
    if (this.sparkles) {
      const mat = this.sparkles.material as THREE.PointsMaterial;
      mat.opacity = 0.4 + Math.sin(elapsedTime * 1.8) * 0.25;
      this.sparkles.rotation.z = elapsedTime * 0.02;
    }

    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize = (): void => {
    this.ngZone.runOutsideAngular(() => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }
}
