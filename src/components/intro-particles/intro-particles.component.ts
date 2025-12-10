import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectionStrategy, NgZone, Output, EventEmitter } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-intro-particles',
  template: `<canvas #canvas class="absolute inset-0 w-full h-full pointer-events-none"></canvas>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntroParticlesComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() heartFormed = new EventEmitter<void>();
  @Output() explosionComplete = new EventEmitter<void>();

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private clock!: THREE.Clock;
  private animationFrameId: number | null = null;
  
  private heartPositions: Float32Array = new Float32Array();
  private initialPositions: Float32Array = new Float32Array();
  private velocities: Float32Array = new Float32Array();
  private particleCount = 800;
  
  private animationState = 'forming'; // 'forming' | 'formed' | 'exploding' | 'complete'
  private stateStartTime = 0;
  
  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initScene();
      this.createHeartParticles();
      this.animate();
    });
    window.addEventListener('resize', this.onWindowResize);
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    this.disposeThreeObjects();
  }

  private disposeThreeObjects(): void {
    if (this.particles) {
      this.particles.geometry.dispose();
      (this.particles.material as THREE.PointsMaterial).map?.dispose();
      (this.particles.material as THREE.PointsMaterial).dispose();
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
    this.stateStartTime = this.clock.getElapsedTime();
  }

  private generateParticleTexture(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d')!;
    
    // Create glowing particle texture
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 100, 120, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 50, 80, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 20, 50, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 0, 30, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    
    return canvas;
  }

  private generateHeartShape(): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const scale = 1.2; // Adjust heart size
    
    // Heart equation: (x^2 + y^2 - 1)^3 - x^2*y^3 = 0
    // Parametric form for better distribution
    for (let i = 0; i < this.particleCount; i++) {
      const t = (i / this.particleCount) * Math.PI * 2;
      
      // Parametric heart equations
      const x = 16 * Math.pow(Math.sin(t), 3) * scale * 0.1;
      const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale * 0.1;
      
      // Add some randomness for organic feel
      const randomOffset = 0.15;
      const finalX = x + (Math.random() - 0.5) * randomOffset;
      const finalY = y + (Math.random() - 0.5) * randomOffset;
      
      points.push({ x: finalX, y: finalY });
    }
    
    return points;
  }

  private createHeartParticles(): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    
    // Generate heart shape positions
    const heartPoints = this.generateHeartShape();
    this.heartPositions = new Float32Array(this.particleCount * 3);
    this.initialPositions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      // Starting positions (random around the edges of screen)
      const angle = Math.random() * Math.PI * 2;
      const radius = 8 + Math.random() * 4;
      this.initialPositions[i3] = Math.cos(angle) * radius;
      this.initialPositions[i3 + 1] = Math.sin(angle) * radius;
      this.initialPositions[i3 + 2] = (Math.random() - 0.5) * 4;
      
      // Heart target positions
      this.heartPositions[i3] = heartPoints[i].x;
      this.heartPositions[i3 + 1] = heartPoints[i].y;
      this.heartPositions[i3 + 2] = (Math.random() - 0.5) * 2;
      
      // Set initial positions
      positions[i3] = this.initialPositions[i3];
      positions[i3 + 1] = this.initialPositions[i3 + 1];
      positions[i3 + 2] = this.initialPositions[i3 + 2];
      
      // Red heart colors with slight variations
      const redIntensity = 0.8 + Math.random() * 0.2;
      colors[i3] = redIntensity;     // R
      colors[i3 + 1] = 0.2 + Math.random() * 0.3; // G
      colors[i3 + 2] = 0.3 + Math.random() * 0.2; // B
      
      // Initialize velocities for explosion
      this.velocities[i3] = (Math.random() - 0.5) * 20;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 20;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 20;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      map: new THREE.CanvasTexture(this.generateParticleTexture()),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 1,
      vertexColors: true,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    const elapsedTime = this.clock.getElapsedTime();
    const stateTime = elapsedTime - this.stateStartTime;
    
    this.updateParticlePositions(stateTime);
    this.checkStateTransitions(stateTime);
    
    this.renderer.render(this.scene, this.camera);
  }

  private updateParticlePositions(stateTime: number): void {
    if (!this.particles) return;
    
    const positions = (this.particles.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
    const material = this.particles.material as THREE.PointsMaterial;
    
    switch (this.animationState) {
      case 'forming':
        // Animate particles from initial positions to heart shape
        const formProgress = Math.min(stateTime / 1.5, 1); // 1.5 seconds to form
        const easeProgress = this.easeInOutCubic(formProgress);
        
        for (let i = 0; i < this.particleCount; i++) {
          const i3 = i * 3;
          positions[i3] = THREE.MathUtils.lerp(this.initialPositions[i3], this.heartPositions[i3], easeProgress);
          positions[i3 + 1] = THREE.MathUtils.lerp(this.initialPositions[i3 + 1], this.heartPositions[i3 + 1], easeProgress);
          positions[i3 + 2] = THREE.MathUtils.lerp(this.initialPositions[i3 + 2], this.heartPositions[i3 + 2], easeProgress);
        }
        break;
        
      case 'formed':
        // Small floating animation while heart is visible
        for (let i = 0; i < this.particleCount; i++) {
          const i3 = i * 3;
          const floatOffset = Math.sin(stateTime * 2 + i * 0.1) * 0.05;
          positions[i3] = this.heartPositions[i3];
          positions[i3 + 1] = this.heartPositions[i3 + 1] + floatOffset;
          positions[i3 + 2] = this.heartPositions[i3 + 2];
        }
        break;
        
      case 'exploding':
        // Explosive radial movement with fade
        const explosionProgress = Math.min(stateTime / 1.0, 1); // 1 second explosion
        const fadeProgress = Math.max(0, 1 - explosionProgress);
        
        for (let i = 0; i < this.particleCount; i++) {
          const i3 = i * 3;
          positions[i3] = this.heartPositions[i3] + this.velocities[i3] * explosionProgress;
          positions[i3 + 1] = this.heartPositions[i3 + 1] + this.velocities[i3 + 1] * explosionProgress;
          positions[i3 + 2] = this.heartPositions[i3 + 2] + this.velocities[i3 + 2] * explosionProgress;
        }
        
        material.opacity = fadeProgress;
        break;
    }
    
    (this.particles.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }

  private checkStateTransitions(stateTime: number): void {
    switch (this.animationState) {
      case 'forming':
        if (stateTime >= 1.5) {
          this.animationState = 'formed';
          this.stateStartTime = this.clock.getElapsedTime();
          this.heartFormed.emit();
        }
        break;
        
      case 'formed':
        if (stateTime >= 1.0) { // Heart visible for 1 second
          this.animationState = 'exploding';
          this.stateStartTime = this.clock.getElapsedTime();
        }
        break;
        
      case 'exploding':
        if (stateTime >= 1.0) {
          this.animationState = 'complete';
          this.explosionComplete.emit();
        }
        break;
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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