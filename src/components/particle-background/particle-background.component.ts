
import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectionStrategy, NgZone } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-particle-background',
  template: `<canvas #canvas class="absolute inset-0 w-full h-full pointer-events-none -z-10"></canvas>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticleBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private clock!: THREE.Clock;
  private animationFrameId: number | null = null;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initScene();
      this.createParticles();
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

    const palette = [
        new THREE.Color('#22d3ee'), // cyan
        new THREE.Color('#fb7185'), // pink
        new THREE.Color('#a78bfa')  // purple
    ];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      const radius = (Math.random() ** 2) * 8 + 1;
      const angle = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * 12;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = Math.sin(angle) * radius * 0.6; // Create an elliptical shape
      positions[i3 + 2] = z;

      const color = palette[Math.floor(Math.random() * palette.length)];
      color.toArray(colors, i3);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      map: new THREE.CanvasTexture(this.generateParticleTexture()),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const elapsedTime = this.clock.getElapsedTime();
    this.particles.rotation.y = elapsedTime * 0.05;
    this.particles.rotation.z = elapsedTime * 0.03;

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
