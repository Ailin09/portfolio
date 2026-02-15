import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, signal } from '@angular/core';
import * as THREE from 'three';
import { PortfolioStateService } from '../../core/portfolio-state.service';

@Component({
  selector: 'app-entry',
  standalone: true,
  template: `
    <div class="entry-screen" [class.night]="state.lightMode() === 'night'">
      <canvas #canvas class="entry-canvas"></canvas>
      <div class="entry-vignette"></div>
      @if (hoverTooltip()) {
        <div
          class="entry-tooltip"
          [class.night]="state.lightMode() === 'night'"
          [style.left.px]="hoverTooltip()!.x"
          [style.top.px]="hoverTooltip()!.y"
        >
          {{ hoverTooltip()!.label }}
        </div>
      }
    </div>
  `,
  styles: [`
    .entry-screen {
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at 50% 18%, #f9f7f2 0%, #f2eee5 48%, #e6e1d6 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 100;
      overflow: hidden;
    }

    .entry-screen.night {
      background: radial-gradient(circle at 50% 18%, #1a1627 0%, #120f1c 48%, #0b0912 100%);
    }

    .entry-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      cursor: pointer;
    }

    .entry-vignette {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(circle at 50% 58%, rgba(255, 255, 255, 0) 34%, rgba(180, 196, 218, 0.08) 100%),
        linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(186, 174, 156, 0.07) 100%);
    }

    .entry-screen.night .entry-vignette {
      background:
        radial-gradient(circle at 18% 42%, rgba(124, 92, 255, 0.1), transparent 28%),
        radial-gradient(circle at 82% 42%, rgba(142, 118, 255, 0.08), transparent 30%),
        radial-gradient(circle at 50% 76%, rgba(157, 134, 255, 0.1), transparent 26%),
        radial-gradient(circle at 50% 58%, rgba(0, 0, 0, 0.02) 24%, rgba(0, 0, 0, 0.42) 100%),
        linear-gradient(180deg, rgba(9, 17, 31, 0.08) 0%, rgba(9, 17, 31, 0.42) 100%);
    }

    .entry-tooltip {
      position: absolute;
      transform: translate(-50%, -130%);
      padding: 0.35rem 0.55rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.92);
      color: #1c1c1c;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.7rem;
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0.01em;
      white-space: nowrap;
      pointer-events: none;
      z-index: 4;
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
      border: 1px solid rgba(220, 215, 205, 0.95);
      backdrop-filter: blur(2px);
    }

    .entry-tooltip.night {
      background: rgba(16, 22, 33, 0.92);
      color: #eaf5ff;
      border-color: rgba(178, 156, 255, 0.4);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }

  `]
})
export class EntryComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  protected isEntering = false;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private ambientLight!: THREE.AmbientLight;
  private spotLight!: THREE.SpotLight;
  private fillLight!: THREE.PointLight;
  private doorAccentLight!: THREE.PointLight;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private doorPivot!: THREE.Group;
  private doorHitbox!: THREE.Mesh;
  private switchButton!: THREE.Mesh;
  private switchHitbox!: THREE.Mesh;
  private animationId = 0;
  private transitionStartedAt = 0;
  private introStartedAt = 0;
  private hasTriggeredEnter = false;
  private switchPressedUntil = 0;
  private baseExposure = 1.06;
  private entryRevealProgress = 0;
  private rgbLights: THREE.PointLight[] = [];
  private rgbPulseTime = 0;
  private idleProgress = 0;
  private readonly idleDurationMs = 6500;
  private idleZoomLocked = false;
  private readonly introLookAt = new THREE.Vector3(0.1, 1.2, -2.5);
  private readonly entryStartPos = new THREE.Vector3();
  private readonly entryStartLookAt = new THREE.Vector3();
  protected readonly hoverTooltip = signal<{ label: string; x: number; y: number } | null>(null);

  private floorMaterial!: THREE.MeshStandardMaterial;
  private wallMaterial!: THREE.MeshStandardMaterial;
  private frontWallMaterial!: THREE.MeshStandardMaterial;
  private ceilingMaterial!: THREE.MeshStandardMaterial;
  private backWallMaterial!: THREE.MeshStandardMaterial;
  private frameMaterial!: THREE.MeshStandardMaterial;
  private doorMaterial!: THREE.MeshStandardMaterial;
  private knobMaterial!: THREE.MeshStandardMaterial;
  private doorMoldingMaterial!: THREE.MeshStandardMaterial;
  private switchPlateMaterial!: THREE.MeshStandardMaterial;
  private switchButtonMaterial!: THREE.MeshStandardMaterial;
  private ledStripMaterials: THREE.MeshStandardMaterial[] = [];
  private ledGlowLights: THREE.PointLight[] = [];
  private floorTexture: THREE.CanvasTexture | null = null;
  private previewWallMaterial!: THREE.MeshStandardMaterial;
  private previewFloorMaterial!: THREE.MeshStandardMaterial;
  private previewDeskMaterial!: THREE.MeshStandardMaterial;
  private previewChairMaterial!: THREE.MeshStandardMaterial;
  private previewPlantMaterial!: THREE.MeshStandardMaterial;
  private previewScreenMaterial!: THREE.MeshStandardMaterial;
  private previewCpuMaterial!: THREE.MeshStandardMaterial;
  private previewPhoneMaterial!: THREE.MeshStandardMaterial;
  private previewAccentMaterial!: THREE.MeshStandardMaterial;
  private previewTrimMaterial!: THREE.MeshStandardMaterial;
  private previewGlowLight!: THREE.PointLight;

  private readonly resizeHandler = () => this.handleResize();
  private readonly clickHandler = (event: MouseEvent) => this.onCanvasClick(event);
  private readonly moveHandler = (event: MouseEvent) => this.onPointerMove(event);
  private readonly leaveHandler = () => this.onPointerLeave();

  constructor(protected state: PortfolioStateService) {
    effect(() => {
      const mode = this.state.lightMode();
      if (this.scene) this.applyIntroLightMode(mode);
    });
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0c1422, 4.2, 12.5);
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
    const introConfig = this.getIntroCameraConfig();
    this.camera.fov = introConfig.fov;
    this.camera.position.set(...introConfig.startPosition);
    this.introLookAt.set(...introConfig.lookAt);
    this.camera.lookAt(this.introLookAt);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.baseExposure;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.buildCorridor();
    this.applyIntroLightMode(this.state.lightMode());
    this.setupEvents(canvas);
    this.handleResize();
    this.introStartedAt = performance.now();
    this.animate();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      canvas.removeEventListener('click', this.clickHandler);
      canvas.removeEventListener('mousemove', this.moveHandler);
      canvas.removeEventListener('mouseleave', this.leaveHandler);
    }
    cancelAnimationFrame(this.animationId);
    this.floorTexture?.dispose();
    this.renderer?.dispose();
  }

  protected startEntry(): void {
    if (this.isEntering) return;
    this.hoverTooltip.set(null);
    this.isEntering = true;
    this.entryRevealProgress = 0;
    this.transitionStartedAt = performance.now();
    this.entryStartPos.copy(this.camera.position);
    this.entryStartLookAt.copy(this.introLookAt);
  }

  private buildCorridor(): void {
    this.scene.background = new THREE.Color(0xf6f4ef);

    this.ambientLight = new THREE.AmbientLight(0xf3eee2, 0.5);
    this.scene.add(this.ambientLight);

    this.fillLight = new THREE.PointLight(0xf0e6d6, 0.44, 7.5);
    this.fillLight.position.set(0, 1.6, 1.2);
    this.scene.add(this.fillLight);

    this.spotLight = new THREE.SpotLight(0xffe9c8, 1.48, 13, Math.PI * 0.2, 0.45, 1.8);
    this.spotLight.position.set(0, 3.3, 0.4);
    this.spotLight.target.position.set(0, 1, -2.55);
    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.set(1024, 1024);
    this.spotLight.shadow.bias = -0.00006;
    this.scene.add(this.spotLight, this.spotLight.target);

    this.doorAccentLight = new THREE.PointLight(0xffc58f, 0.62, 2.9);
    this.doorAccentLight.position.set(0.52, 1.35, -2.35);
    this.scene.add(this.doorAccentLight);

    this.floorTexture = this.createWoodFloorTexture();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 9.5),
      (this.floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xf7f5f0,
        roughness: 0.84,
        metalness: 0.02,
        map: this.floorTexture
      }))
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -1.2);
    floor.receiveShadow = true;
    this.scene.add(floor);

    this.wallMaterial = new THREE.MeshStandardMaterial({ color: 0xede9e0, roughness: 0.88, metalness: 0.02 });
    this.frontWallMaterial = new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.86, metalness: 0.03 });
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.1, 6.6), this.wallMaterial);
    leftWall.position.set(-2.02, 1.55, -0.1);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    const rightWall = leftWall.clone();
    rightWall.position.x = 2.02;

    const ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(4.22, 0.12, 6.6),
      (this.ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xf7f4ee, roughness: 0.82, metalness: 0.02 }))
    );
    ceiling.position.set(0, 3.03, -0.1);
    ceiling.receiveShadow = true;

    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(4.22, 3.1, 0.16),
      (this.backWallMaterial = new THREE.MeshStandardMaterial({ color: 0xe6e0d6, roughness: 0.86, metalness: 0.02 }))
    );
    backWall.position.set(0, 1.55, -3.35);
    backWall.castShadow = true;
    backWall.receiveShadow = true;

    this.scene.add(leftWall, rightWall, ceiling, backWall);

    const frontWallTop = new THREE.Mesh(new THREE.BoxGeometry(4.22, 0.72, 0.16), this.frontWallMaterial);
    frontWallTop.position.set(0, 2.74, -2.75);
    frontWallTop.castShadow = true;
    frontWallTop.receiveShadow = true;
    const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(1.42, 2.3, 0.16), this.frontWallMaterial);
    frontWallLeft.position.set(-1.4, 1.15, -2.75);
    frontWallLeft.castShadow = true;
    frontWallLeft.receiveShadow = true;
    const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.3, 0.16), this.frontWallMaterial);
    frontWallRight.position.set(1.43, 1.15, -2.75);
    frontWallRight.castShadow = true;
    frontWallRight.receiveShadow = true;
    this.scene.add(frontWallTop, frontWallLeft, frontWallRight);

    this.frameMaterial = new THREE.MeshStandardMaterial({ color: 0x4e3825, roughness: 0.68, metalness: 0.1 });
    const doorFrameTop = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.15, 0.16), this.frameMaterial);
    doorFrameTop.position.set(0, 2.25, -2.62);
    doorFrameTop.castShadow = true;
    doorFrameTop.receiveShadow = true;
    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.3, 0.16), this.frameMaterial);
    frameLeft.position.set(-0.65, 1.17, -2.62);
    frameLeft.castShadow = true;
    frameLeft.receiveShadow = true;
    const frameRight = frameLeft.clone();
    frameRight.position.x = 0.65;
    this.scene.add(doorFrameTop, frameLeft, frameRight);

    this.doorPivot = new THREE.Group();
    this.doorPivot.position.set(-0.56, 0.08, -2.6);
    this.scene.add(this.doorPivot);

    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(1.12, 2.18, 0.09),
      (this.doorMaterial = new THREE.MeshStandardMaterial({ color: 0x5c331f, roughness: 0.64, metalness: 0.08 }))
    );
    doorPanel.position.set(0.56, 1.09, 0);
    doorPanel.castShadow = true;
    doorPanel.receiveShadow = true;
    this.doorPivot.add(doorPanel);

    const knob = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 18, 18),
      (this.knobMaterial = new THREE.MeshStandardMaterial({ color: 0xcaa86e, roughness: 0.34, metalness: 0.82 }))
    );
    knob.position.set(1.03, 1.1, 0.065);
    this.doorPivot.add(knob);

    this.doorMoldingMaterial = new THREE.MeshStandardMaterial({
      color: 0x764833,
      roughness: 0.72,
      metalness: 0.04
    });
    const topMolding = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.055, 0.01), this.doorMoldingMaterial);
    topMolding.position.set(0.56, 1.67, 0.051);
    const midMolding = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.045, 0.01), this.doorMoldingMaterial);
    midMolding.position.set(0.56, 1.14, 0.051);
    const bottomMolding = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.045, 0.01), this.doorMoldingMaterial);
    bottomMolding.position.set(0.56, 0.67, 0.051);
    this.doorPivot.add(topMolding, midMolding, bottomMolding);

    this.doorHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2.3, 0.3),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    this.doorHitbox.position.set(0.56, 1.12, 0.02);
    this.doorPivot.add(this.doorHitbox);

    const switchPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.28, 0.03),
      (this.switchPlateMaterial = new THREE.MeshStandardMaterial({ color: 0xe0e6f0, roughness: 0.5, metalness: 0.18 }))
    );
    switchPlate.position.set(0.9, 1.18, -2.58);
    this.scene.add(switchPlate);

    this.switchButton = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.12, 0.035),
      (this.switchButtonMaterial = new THREE.MeshStandardMaterial({ color: 0xbcc9de, roughness: 0.45, metalness: 0.3 }))
    );
    this.switchButton.position.set(0.9, 1.18, -2.548);
    this.scene.add(this.switchButton);

    this.switchHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.34, 0.2),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    this.switchHitbox.position.set(0.9, 1.18, -2.53);
    this.scene.add(this.switchHitbox);

    this.createOfficePreview();
    this.createLedStrips();
    this.createRgbRoomLights();
  }

  private createWoodFloorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const fallback = new THREE.CanvasTexture(canvas);
      fallback.colorSpace = THREE.SRGBColorSpace;
      return fallback;
    }

    ctx.fillStyle = '#b8a58b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const plankHeight = 86;
    const plankCount = Math.ceil(canvas.height / plankHeight);
    for (let i = 0; i < plankCount; i++) {
      const y = i * plankHeight;
      const hue = 30 + (i % 3) * 2;
      const sat = 30 + (i % 2) * 3;
      const light = 58 + (i % 4) * 3;
      ctx.fillStyle = `hsl(${hue} ${sat}% ${light}%)`;
      ctx.fillRect(0, y, canvas.width, plankHeight - 2);

      ctx.fillStyle = 'rgba(88, 60, 34, 0.06)';
      for (let x = 0; x < canvas.width; x += 38) {
        const wave = Math.sin((x + i * 31) * 0.028) * 3;
        ctx.fillRect(x, y + plankHeight * 0.34 + wave, 22, 1);
        ctx.fillRect(x + 7, y + plankHeight * 0.62 - wave, 18, 1);
      }

      ctx.fillStyle = 'rgba(58, 41, 22, 0.18)';
      ctx.fillRect(0, y + plankHeight - 2, canvas.width, 2);
    }

    const depthGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    depthGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    depthGrad.addColorStop(1, 'rgba(28, 20, 12, 0.12)');
    ctx.fillStyle = depthGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.5, 4.2);
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    texture.needsUpdate = true;
    return texture;
  }

  private createOfficePreview(): void {
    const previewGroup = new THREE.Group();
    previewGroup.name = 'office_preview';

    const previewFloor = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.03, 1.42),
      (this.previewFloorMaterial = new THREE.MeshStandardMaterial({ color: 0xdce6f4, roughness: 0.9, metalness: 0.03 }))
    );
    previewFloor.position.set(0.02, 0.015, -3.84);
    previewFloor.receiveShadow = true;

    const previewBackPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.98, 1.56, 0.04),
      (this.previewWallMaterial = new THREE.MeshStandardMaterial({ color: 0x24324a, roughness: 0.8, metalness: 0.03 }))
    );
    previewBackPanel.position.set(0.02, 1.18, -4.3);

    const previewBaseboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.94, 0.07, 0.02),
      (this.previewTrimMaterial = new THREE.MeshStandardMaterial({ color: 0xc8d6e7, roughness: 0.64, metalness: 0.05 }))
    );
    previewBaseboard.position.set(0.02, 0.47, -4.28);

    const previewWindow = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.24, 0.015),
      (this.previewAccentMaterial = new THREE.MeshStandardMaterial({
        color: 0xf2fbff,
        emissive: new THREE.Color(0xb6e5ff),
        emissiveIntensity: 0.2,
        roughness: 0.24,
        metalness: 0.05
      }))
    );
    previewWindow.position.set(0.27, 1.62, -4.27);

    const previewWindowFrame = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.27, 0.018), this.previewTrimMaterial);
    previewWindowFrame.position.set(0.27, 1.62, -4.28);

    const previewWallFrame = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.014), this.previewTrimMaterial);
    previewWallFrame.position.set(-0.31, 1.5, -4.26);

    const hexGeo = new THREE.CircleGeometry(0.06, 6);
    const hexA = new THREE.Mesh(hexGeo, this.previewAccentMaterial);
    hexA.position.set(-0.32, 1.72, -4.25);
    const hexB = new THREE.Mesh(hexGeo, this.previewAccentMaterial);
    hexB.position.set(-0.24, 1.66, -4.25);
    const hexC = new THREE.Mesh(hexGeo, this.previewAccentMaterial);
    hexC.position.set(-0.4, 1.66, -4.25);

    const previewRug = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.01, 0.54), this.previewAccentMaterial);
    previewRug.position.set(0.0, 0.03, -3.58);

    const previewDesk = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.06, 0.34),
      (this.previewDeskMaterial = new THREE.MeshStandardMaterial({ color: 0xb9c9df, roughness: 0.56, metalness: 0.14 }))
    );
    previewDesk.position.set(0.02, 0.86, -3.95);

    const previewDeskLegLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.56, 0.05), this.previewDeskMaterial);
    previewDeskLegLeft.position.set(-0.31, 0.56, -3.91);
    const previewDeskLegRight = previewDeskLegLeft.clone();
    previewDeskLegRight.position.x = 0.35;

    const previewMonitor = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.2, 0.03),
      (this.previewScreenMaterial = new THREE.MeshStandardMaterial({
        color: 0xeef8ff,
        emissive: new THREE.Color(0xa6d8ff),
        emissiveIntensity: 0.24,
        roughness: 0.22,
        metalness: 0.06
      }))
    );
    previewMonitor.position.set(0.08, 1.08, -4.08);

    const previewMonitorBase = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), this.previewDeskMaterial);
    previewMonitorBase.position.set(0.08, 0.97, -4.05);

    const previewCpu = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.34, 0.28),
      (this.previewCpuMaterial = new THREE.MeshStandardMaterial({ color: 0x1d2a3f, roughness: 0.58, metalness: 0.12 }))
    );
    previewCpu.position.set(-0.22, 1.03, -3.95);

    const previewCpuVent = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.18, 0.12),
      this.previewAccentMaterial
    );
    previewCpuVent.position.set(-0.12, 1.03, -3.82);

    const previewPhoneBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.09, 0.05, 20),
      (this.previewPhoneMaterial = new THREE.MeshStandardMaterial({
        color: 0xc45b95,
        emissive: new THREE.Color(0x6f153f),
        emissiveIntensity: 0.14,
        roughness: 0.44,
        metalness: 0.08
      }))
    );
    previewPhoneBase.rotation.x = Math.PI / 2;
    previewPhoneBase.position.set(0.28, 0.9, -3.92);

    const previewPhoneHandle = new THREE.Mesh(
      new THREE.TorusGeometry(0.065, 0.018, 10, 24, Math.PI),
      this.previewPhoneMaterial
    );
    previewPhoneHandle.rotation.z = Math.PI;
    previewPhoneHandle.position.set(0.28, 0.97, -3.91);

    const previewChair = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.44, 0.24),
      (this.previewChairMaterial = new THREE.MeshStandardMaterial({ color: 0x7e8ea3, roughness: 0.66, metalness: 0.08 }))
    );
    previewChair.position.set(-0.18, 0.58, -3.48);

    const previewPlantPot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.12, 14),
      (this.previewPlantMaterial = new THREE.MeshStandardMaterial({ color: 0x78928a, roughness: 0.62, metalness: 0.05 }))
    );
    previewPlantPot.position.set(0.38, 0.92, -3.95);

    const previewPlantLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 10), this.previewPlantMaterial);
    previewPlantLeaf.position.set(0.38, 1.08, -3.95);

    previewGroup.add(
      previewFloor,
      previewBackPanel,
      previewBaseboard,
      previewWindowFrame,
      previewWindow,
      previewWallFrame,
      hexA,
      hexB,
      hexC,
      previewRug,
      previewDesk,
      previewDeskLegLeft,
      previewDeskLegRight,
      previewMonitor,
      previewMonitorBase,
      previewCpu,
      previewCpuVent,
      previewPhoneBase,
      previewPhoneHandle,
      previewChair,
      previewPlantPot,
      previewPlantLeaf
    );
    this.scene.add(previewGroup);

    this.previewGlowLight = new THREE.PointLight(0xffdfbe, 1.2, 3.8);
    this.previewGlowLight.position.set(0.04, 1.18, -3.86);
    this.scene.add(this.previewGlowLight);

    this.updateOfficePreviewReveal(0.2);
  }

  private setupEvents(canvas: HTMLCanvasElement): void {
    window.addEventListener('resize', this.resizeHandler);
    canvas.addEventListener('click', this.clickHandler);
    canvas.addEventListener('mousemove', this.moveHandler);
    canvas.addEventListener('mouseleave', this.leaveHandler);
  }

  private onCanvasClick(event: MouseEvent): void {
    if (this.isEntering) return;
    this.setRayFromEvent(event);
    const switchHit = this.raycaster.intersectObject(this.switchHitbox, true);
    if (switchHit.length > 0) {
      this.state.toggleLightMode();
      this.switchPressedUntil = performance.now() + 160;
      return;
    }
    const hit = this.raycaster.intersectObject(this.doorHitbox, true);
    if (hit.length > 0) this.startEntry();
  }

  private onPointerMove(event: MouseEvent): void {
    if (this.isEntering) {
      this.renderer.domElement.style.cursor = 'default';
      this.hoverTooltip.set(null);
      return;
    }
    this.setRayFromEvent(event);
    const rect = this.renderer.domElement.getBoundingClientRect();
    const switchHit = this.raycaster.intersectObject(this.switchHitbox, true);
    if (switchHit.length > 0) {
      this.renderer.domElement.style.cursor = 'pointer';
      this.hoverTooltip.set({
        label: 'Interruptor: cambiar dia/noche',
        x: event.clientX - rect.left,
        y: event.clientY - rect.top - 8
      });
      return;
    }
    const hit = this.raycaster.intersectObject(this.doorHitbox, true);
    if (hit.length > 0) {
      this.renderer.domElement.style.cursor = 'pointer';
      this.hoverTooltip.set({
        label: 'Puerta: entrar',
        x: event.clientX - rect.left,
        y: event.clientY - rect.top - 8
      });
      return;
    }
    this.renderer.domElement.style.cursor = 'default';
    this.hoverTooltip.set(null);
  }

  private onPointerLeave(): void {
    this.renderer.domElement.style.cursor = 'default';
    this.hoverTooltip.set(null);
  }

  private setRayFromEvent(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
  }

  private updateEntryAnimation(now: number): void {
    const isPressingSwitch = now <= this.switchPressedUntil;
    if (this.switchButton) {
      this.switchButton.position.z = isPressingSwitch ? -2.56 : -2.548;
    }

    if (!this.isEntering) return;
    const elapsed = now - this.transitionStartedAt;
    const duration = 1700;
    const t = THREE.MathUtils.clamp(elapsed / duration, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const reveal = THREE.MathUtils.clamp((t - 0.08) / 0.78, 0, 1);
    this.entryRevealProgress = reveal;

    this.doorPivot.rotation.y = -eased * 1.36;
    this.camera.position.set(
      THREE.MathUtils.lerp(this.entryStartPos.x, 0.16, eased),
      THREE.MathUtils.lerp(this.entryStartPos.y, 1.24, eased),
      THREE.MathUtils.lerp(this.entryStartPos.z, -1.82, eased)
    );
    this.introLookAt.set(
      THREE.MathUtils.lerp(this.entryStartLookAt.x, 0.03, eased),
      THREE.MathUtils.lerp(this.entryStartLookAt.y, 1.2, eased),
      THREE.MathUtils.lerp(this.entryStartLookAt.z, -3.72, eased)
    );
    this.camera.lookAt(this.introLookAt);
    this.updateOfficePreviewReveal(reveal);

    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(this.baseExposure, this.baseExposure - 0.34, eased);

    if (t >= 0.88 && !this.hasTriggeredEnter) {
      this.hasTriggeredEnter = true;
      this.state.enter();
    }
  }

  private updateIdleApproach(now: number): void {
    if (this.isEntering) return;
    const introConfig = this.getIntroCameraConfig();
    if (this.idleZoomLocked) {
      this.camera.position.set(...introConfig.endPosition);
      this.introLookAt.set(...introConfig.lookAt);
      this.camera.lookAt(this.introLookAt);
      return;
    }

    const elapsed = Math.max(0, now - this.introStartedAt);
    const t = THREE.MathUtils.clamp(elapsed / this.idleDurationMs, 0, 1);
    const eased = t * (2 - t);
    this.idleProgress = eased;

    const start = introConfig.startPosition;
    const end = introConfig.endPosition;
    this.camera.position.set(
      THREE.MathUtils.lerp(start[0], end[0], eased),
      THREE.MathUtils.lerp(start[1], end[1], eased),
      THREE.MathUtils.lerp(start[2], end[2], eased)
    );

    this.introLookAt.set(...introConfig.lookAt);
    this.camera.lookAt(this.introLookAt);
    this.updateOfficePreviewReveal(0.1 + this.idleProgress * 0.1);
    if (t >= 1) this.idleZoomLocked = true;
  }

  private handleResize(): void {
    if (!this.renderer || !this.camera) return;
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight || 1;
    const introConfig = this.getIntroCameraConfig();
    this.camera.fov = introConfig.fov;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private getEntryViewportProfile(): 'desktop' | 'mobile' | 'narrow-mobile' {
    const w = window.innerWidth;
    if (w <= 430) return 'narrow-mobile';
    if (w <= 768) return 'mobile';
    return 'desktop';
  }

  private getIntroCameraConfig(): {
    startPosition: [number, number, number];
    endPosition: [number, number, number];
    lookAt: [number, number, number];
    fov: number;
  } {
    const profile = this.getEntryViewportProfile();
    if (profile === 'desktop') {
      return {
        startPosition: [0.22, 1.38, 3.72],
        endPosition: [0.22, 1.34, 3.1],
        lookAt: [0.1, 1.2, -2.5],
        fov: 48
      };
    }
    if (profile === 'mobile') {
      return {
        startPosition: [0.18, 1.43, 4.9],
        endPosition: [0.16, 1.4, 4.35],
        lookAt: [0.05, 1.17, -2.52],
        fov: 58
      };
    }
    return {
      startPosition: [0.16, 1.46, 5.25],
      endPosition: [0.14, 1.43, 4.72],
      lookAt: [0.04, 1.16, -2.54],
      fov: 64
    };
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    const now = performance.now();
    this.updateIdleApproach(now);
    this.updateEntryAnimation(now);
    this.updateRgbPulse();
    this.renderer.render(this.scene, this.camera);
  };

  private applyIntroLightMode(mode: 'day' | 'night'): void {
    if (!this.scene) return;

    if (mode === 'day') {
      this.scene.background = new THREE.Color(0xf6f4ef);
      this.scene.fog = new THREE.Fog(0xf2eee5, 9.5, 22.5);
      this.baseExposure = 1.12;

      this.ambientLight.color.setHex(0xf6efe3);
      this.ambientLight.intensity = 0.92;
      this.fillLight.color.setHex(0xefe6d8);
      this.fillLight.intensity = 0.58;
      this.spotLight.color.setHex(0xffe9c9);
      this.spotLight.intensity = 1.32;

      this.floorMaterial?.color.setHex(0xf4eadb);
      this.wallMaterial?.color.setHex(0xf7f9fc);
      this.frontWallMaterial?.color.setHex(0xf0f4f9);
      this.ceilingMaterial?.color.setHex(0xffffff);
      this.backWallMaterial?.color.setHex(0xe9f0f8);
      this.frameMaterial?.color.setHex(0x6a4630);
      this.doorMaterial?.color.setHex(0x835238);
      this.knobMaterial?.color.setHex(0xe1c58e);
      this.doorMoldingMaterial?.color.setHex(0x936247);
      this.switchPlateMaterial?.color.setHex(0xf0f4fb);
      this.switchButtonMaterial?.color.setHex(0xa6b3c9);
      this.previewWallMaterial?.color.setHex(0xe5dfd4);
      this.previewFloorMaterial?.color.setHex(0xf2eee4);
      this.previewDeskMaterial?.color.setHex(0xcbc3b4);
      this.previewChairMaterial?.color.setHex(0x9f9583);
      this.previewPlantMaterial?.color.setHex(0x778975);
      this.previewScreenMaterial?.color.setHex(0xf7f5f0);
      this.previewScreenMaterial?.emissive.setHex(0xeae5ff);
      if (this.previewScreenMaterial) this.previewScreenMaterial.emissiveIntensity = 0.3;
      this.previewCpuMaterial?.color.setHex(0x23222a);
      this.previewPhoneMaterial?.color.setHex(0x9e84ff);
      this.previewPhoneMaterial?.emissive.setHex(0x7c5cff);
      if (this.previewPhoneMaterial) this.previewPhoneMaterial.emissiveIntensity = 0.12;
      this.previewAccentMaterial?.color.setHex(0xf3efff);
      this.previewAccentMaterial?.emissive.setHex(0x7c5cff);
      if (this.previewAccentMaterial) this.previewAccentMaterial.emissiveIntensity = 0.34;
      this.previewTrimMaterial?.color.setHex(0xddd8ce);
      this.previewGlowLight.color.setHex(0xffd8ad);
      this.previewGlowLight.userData['baseIntensity'] = 1.2;
      this.doorAccentLight.color.setHex(0xffdfb7);
      this.doorAccentLight.intensity = 1.04;
      this.rgbLights.forEach((light) => {
        light.visible = false;
        light.intensity = 0;
      });
      this.ledStripMaterials.forEach((mat) => {
        mat.opacity = 0;
        mat.emissiveIntensity = 0;
      });
      this.ledGlowLights.forEach((light) => {
        light.visible = false;
        light.intensity = 0;
      });
    } else {
      this.scene.background = new THREE.Color(0x11101a);
      this.scene.fog = new THREE.Fog(0x080e19, 4.3, 12.2);
      this.baseExposure = 1.05;

      this.ambientLight.color.setHex(0x3a324d);
      this.ambientLight.intensity = 0.42;
      this.fillLight.color.setHex(0x4e3e84);
      this.fillLight.intensity = 0.28;
      this.spotLight.color.setHex(0xfff0ca);
      this.spotLight.intensity = 0.28;

      this.floorMaterial?.color.setHex(0x7b6a57);
      this.wallMaterial?.color.setHex(0x1a2740);
      this.frontWallMaterial?.color.setHex(0x1f2d47);
      this.ceilingMaterial?.color.setHex(0x152238);
      this.backWallMaterial?.color.setHex(0x1f2e49);
      this.frameMaterial?.color.setHex(0x2e1c12);
      this.doorMaterial?.color.setHex(0x86553c);
      this.knobMaterial?.color.setHex(0xcaa86e);
      this.doorMoldingMaterial?.color.setHex(0xa26a4b);
      this.switchPlateMaterial?.color.setHex(0x62708a);
      this.switchButtonMaterial?.color.setHex(0x8ea3c4);
      this.previewWallMaterial?.color.setHex(0x242033);
      this.previewFloorMaterial?.color.setHex(0x12101c);
      this.previewDeskMaterial?.color.setHex(0x2f2a42);
      this.previewChairMaterial?.color.setHex(0x27203a);
      this.previewPlantMaterial?.color.setHex(0x3f6f5d);
      this.previewScreenMaterial?.color.setHex(0xcce8ff);
      this.previewScreenMaterial?.emissive.setHex(0x7c5cff);
      if (this.previewScreenMaterial) this.previewScreenMaterial.emissiveIntensity = 1.1;
      this.previewCpuMaterial?.color.setHex(0x111a2a);
      this.previewPhoneMaterial?.color.setHex(0xdf6db0);
      this.previewPhoneMaterial?.emissive.setHex(0x8f72ff);
      if (this.previewPhoneMaterial) this.previewPhoneMaterial.emissiveIntensity = 0.44;
      this.previewAccentMaterial?.color.setHex(0xd8eeff);
      this.previewAccentMaterial?.emissive.setHex(0x8f72ff);
      if (this.previewAccentMaterial) this.previewAccentMaterial.emissiveIntensity = 1.2;
      this.previewTrimMaterial?.color.setHex(0x4a3d71);
      this.previewGlowLight.color.setHex(0x7c5cff);
      this.previewGlowLight.userData['baseIntensity'] = 0.8;
      this.doorAccentLight.color.setHex(0xffb877);
      this.doorAccentLight.intensity = 0.5;
      this.rgbLights.forEach((light) => {
        light.visible = true;
        light.intensity = (light.userData['baseIntensity'] as number) ?? 0.3;
      });
      this.ledStripMaterials.forEach((mat) => {
        mat.opacity = 1;
        mat.emissiveIntensity = 1.9;
      });
      this.ledGlowLights.forEach((light) => {
        light.visible = true;
        light.intensity = (light.userData['baseIntensity'] as number) ?? 0.35;
      });
    }

    this.updateOfficePreviewReveal(this.isEntering ? this.entryRevealProgress : 0.12);
    if (!this.isEntering) this.renderer.toneMappingExposure = this.baseExposure;
  }

  private updateOfficePreviewReveal(progress: number): void {
    const clamped = THREE.MathUtils.clamp(progress, 0, 1);
    const glowBase = (this.previewGlowLight?.userData['baseIntensity'] as number) ?? 0.85;
    if (this.previewGlowLight) {
      this.previewGlowLight.intensity = glowBase * (0.28 + clamped * 0.92);
    }
    if (this.previewScreenMaterial) {
      const baseScreen = this.state.lightMode() === 'night' ? 1.1 : 0.3;
      this.previewScreenMaterial.emissiveIntensity = baseScreen * (0.42 + clamped * 0.9);
    }
    if (this.previewAccentMaterial) {
      const baseAccent = this.state.lightMode() === 'night' ? 1.2 : 0.34;
      this.previewAccentMaterial.emissiveIntensity = baseAccent * (0.36 + clamped * 0.82);
    }
  }

  private createRgbRoomLights(): void {
    this.rgbLights.forEach((light) => this.scene.remove(light));
    this.rgbLights = [];
  }

  private createLedStrips(): void {
    this.ledStripMaterials = [];
    this.ledGlowLights.forEach((light) => this.scene.remove(light));
    this.ledGlowLights = [];
    const createLamp = (
      side: 'left' | 'right',
      z: number,
      color: number,
      phase: number
    ): void => {
      const wallInnerX = side === 'left' ? -1.93 : 1.93;
      const towardCenter = side === 'left' ? 1 : -1;
      const x = wallInnerX + towardCenter * 0.03;
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x0f1523,
        roughness: 0.45,
        metalness: 0.35
      });

      const base = new THREE.Mesh(new THREE.SphereGeometry(0.07, 18, 18), baseMat);
      base.position.set(x, 1.04, z);

      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.88, 12), baseMat);
      rod.position.set(x, 1.52, z);

      const glowMat = new THREE.MeshStandardMaterial({
        color: 0xfafcff,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0,
        roughness: 0.1,
        metalness: 0
      });
      const glowTube = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.82, 14), glowMat);
      glowTube.position.set(x, 1.52, z);

      this.scene.add(base, rod, glowTube);
      this.ledStripMaterials.push(glowMat);

      const keyGlow = new THREE.PointLight(color, 0, 4.0);
      keyGlow.position.set(x + towardCenter * 0.24, 1.7, z);
      keyGlow.userData['baseIntensity'] = 0.95;
      keyGlow.userData['phase'] = phase;
      keyGlow.visible = false;

      const fillGlow = new THREE.PointLight(color, 0, 3.2);
      fillGlow.position.set(x + towardCenter * 0.14, 1.24, z);
      fillGlow.userData['baseIntensity'] = 0.58;
      fillGlow.userData['phase'] = phase + 0.55;
      fillGlow.visible = false;

      this.scene.add(keyGlow, fillGlow);
      this.ledGlowLights.push(keyGlow, fillGlow);
    };

    createLamp('left', -0.95, 0xd86dff, 0);
    createLamp('left', -2.35, 0xc25bff, 0.9);
    createLamp('right', -0.95, 0x6be4ff, 1.5);
    createLamp('right', -2.35, 0x4ad9ff, 2.2);

    const leftBounce = new THREE.PointLight(0xc96bff, 0, 4.1);
    leftBounce.position.set(-1.25, 1.7, -2.28);
    leftBounce.userData['baseIntensity'] = 0.42;
    leftBounce.userData['phase'] = 1.8;
    leftBounce.visible = false;
    this.scene.add(leftBounce);
    this.ledGlowLights.push(leftBounce);

    const rightBounce = new THREE.PointLight(0x66ddff, 0, 4.1);
    rightBounce.position.set(1.25, 1.7, -2.28);
    rightBounce.userData['baseIntensity'] = 0.4;
    rightBounce.userData['phase'] = 2.5;
    rightBounce.visible = false;
    this.scene.add(rightBounce);
    this.ledGlowLights.push(rightBounce);
  }

  private updateRgbPulse(): void {
    if (this.state.lightMode() !== 'night') return;
    this.rgbPulseTime += 0.022;

    this.rgbLights.forEach((light) => {
      const base = (light.userData['baseIntensity'] as number) ?? 0.4;
      const phase = (light.userData['phase'] as number) ?? 0;
      const pulse = 0.8 + (Math.sin(this.rgbPulseTime + phase) + 1) * 0.22;
      light.intensity = base * pulse;
    });

    this.ledStripMaterials.forEach((mat, idx) => {
      const phase = idx * 0.65;
      const pulse = 1.35 + (Math.sin(this.rgbPulseTime * 1.4 + phase) + 1) * 0.35;
      mat.emissiveIntensity = pulse;
    });

    this.ledGlowLights.forEach((light, idx) => {
      const base = (light.userData['baseIntensity'] as number) ?? 0.35;
      const phase = (light.userData['phase'] as number) ?? idx * 0.7;
      const pulse = 0.95 + (Math.sin(this.rgbPulseTime * 1.25 + phase) + 1) * 0.3;
      light.intensity = base * pulse;
    });
  }
}
