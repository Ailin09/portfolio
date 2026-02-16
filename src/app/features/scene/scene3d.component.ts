import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  effect,
  signal
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Raycaster, Vector2 } from 'three';
import { PortfolioStateService } from '../../core/portfolio-state.service';
import { SceneTransitionService } from '../../core/scene-transition.service';
import { VisitorCounterService } from '../../core/visitor-counter.service';
import { theme } from '../../core/theme';
import { CAMERA_POSITIONS, DOOR_CAMERA, NEON_SIGN_CAMERA, NEON_SIGN_WAYPOINT } from '../../core/camera-positions';
import type { Section } from '../../core/portfolio-state.service';
import type { CameraTarget } from '../../core/camera-positions';

const MODEL_CANDIDATES = [
  '/models/room.glb',
  '/models/office-room.glb',
  '/models/office.glb',
  '/models/scene.glb'
] as const;

const PORTFOLIO_OWNER_NAME = 'Ailín Rutchle';
const PORTFOLIO_ROLE_LINE = 'Frontend Tech Lead (Angular)';
const PORTFOLIO_SPECIALTY_LINE = 'Frontend Architecture | Scalable Web Applications';

@Component({
  selector: 'app-scene3d',
  standalone: true,
  template: `
    <canvas #canvas class="scene-canvas"></canvas>
    @if (state.currentSection() === 'home') {
      <div class="portfolio-presentation" [class.night]="state.lightMode() === 'night'">
        <p class="portfolio-name">{{ portfolioOwnerName }}</p>
        <p class="portfolio-role">{{ portfolioRoleLine }}</p>
        <p class="portfolio-specialty">{{ portfolioSpecialtyLine }}</p>
      </div>
    }
    @if (hoverTooltip()) {
      <div
        class="hover-tooltip"
        [class.night]="state.lightMode() === 'night'"
        [style.left.px]="hoverTooltip()!.x"
        [style.top.px]="hoverTooltip()!.y"
      >
        {{ hoverTooltip()!.label }}
      </div>
    }
    @if (state.currentSection() === 'home') {
      <button
        type="button"
        class="mobile-help-toggle"
        [class.night]="state.lightMode() === 'night'"
        (click)="toggleMobileHelpPanel()"
        aria-label="Mostrar ayuda de interaccion"
      >
        ?
      </button>

      @if (isMobileUi() && showMobileGuideBanner()) {
        <p class="mobile-guide-banner" [class.night]="state.lightMode() === 'night'">
          Arrastra para girar, pellizca para zoom y toca objetos para navegar.
        </p>
      }

      @if (showMobileHelpPanel()) {
        <aside class="mobile-help-panel" [class.night]="state.lightMode() === 'night'">
          <p class="mobile-help-title">Como interactuar</p>
          <p class="mobile-help-line">PC -> Proyectos</p>
          <p class="mobile-help-line">Pizarra -> Sobre mi</p>
          <p class="mobile-help-line">Tocadiscos -> Hobbies</p>
          <p class="mobile-help-line">Cuadros -> Certificaciones</p>
          <p class="mobile-help-line">Telefono -> Contacto</p>
          <p class="mobile-help-line">Interruptor -> Dia/Noche</p>
        </aside>
      }

      @if (isMobileUi()) {
        <div class="mobile-markers-layer">
          @for (marker of mobileGuideMarkers(); track marker.id) {
            @if (marker.visible) {
            <div
              class="mobile-marker"
              [style.left.px]="marker.x"
              [style.top.px]="marker.y"
              [style.--delay]="marker.delay"
            >
                <span class="mobile-marker-dot"></span>
              <span
                class="mobile-marker-label"
                [style.--label-offset-x]="marker.labelOffsetX + 'px'"
                [style.--label-offset-y]="marker.labelOffsetY + 'px'"
              >
                {{ marker.label }}
              </span>
              </div>
            }
          }
        </div>
      }
    }
  `,
  styles: [`
    :host {
      position: absolute;
      inset: 0;
      display: block;
    }
    .scene-canvas {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: none;
      cursor: grab;
    }
    .portfolio-presentation {
      position: absolute;
      top: clamp(0.85rem, 3.5vh, 1.8rem);
      left: 50%;
      transform: translateX(-50%);
      width: min(92vw, 820px);
      text-align: center;
      pointer-events: none;
      z-index: 2;
      color: #1e1b18;
      text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
    }
    .portfolio-presentation.night {
      color: #f2edff;
      text-shadow: 0 0 14px rgba(124, 92, 255, 0.35);
    }
    .portfolio-name {
      margin: 0;
      font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
      font-size: clamp(1.4rem, 2.8vw, 2.2rem);
      font-weight: 700;
      letter-spacing: 0.02em;
      line-height: 1.1;
    }
    .portfolio-role {
      margin: 0.2rem 0 0;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: clamp(0.78rem, 1.4vw, 1.02rem);
      font-weight: 650;
      letter-spacing: 0.03em;
      opacity: 0.95;
    }
    .portfolio-specialty {
      margin: 0.18rem 0 0;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: clamp(0.68rem, 1.1vw, 0.9rem);
      font-weight: 520;
      letter-spacing: 0.02em;
      opacity: 0.84;
    }
    .hover-tooltip {
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
      z-index: 3;
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
      border: 1px solid rgba(220, 215, 205, 0.95);
      backdrop-filter: blur(2px);
    }
    .hover-tooltip.night {
      background: rgba(16, 22, 33, 0.92);
      color: #eaf5ff;
      border-color: rgba(178, 156, 255, 0.42);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }
    .mobile-help-toggle {
      position: absolute;
      top: max(0.7rem, env(safe-area-inset-top));
      right: max(0.6rem, env(safe-area-inset-right));
      width: 2rem;
      height: 2rem;
      border-radius: 999px;
      border: 1px solid rgba(210, 206, 198, 0.95);
      background: rgba(255, 255, 255, 0.92);
      color: #262626;
      font-size: 0.95rem;
      font-weight: 700;
      line-height: 1;
      box-shadow: 0 8px 18px rgba(18, 22, 32, 0.16);
      z-index: 5;
      display: block;
      pointer-events: auto;
      cursor: pointer;
    }
    .mobile-help-toggle.night {
      border-color: rgba(120, 214, 255, 0.48);
      background: rgba(13, 19, 34, 0.88);
      color: #e7f4ff;
      box-shadow: 0 0 12px rgba(64, 224, 255, 0.2), 0 8px 18px rgba(3, 8, 18, 0.55);
    }
    .mobile-guide-banner {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      bottom: max(0.7rem, env(safe-area-inset-bottom));
      margin: 0;
      max-width: min(92vw, 370px);
      padding: 0.45rem 0.68rem;
      border-radius: 12px;
      border: 1px solid rgba(209, 202, 192, 0.92);
      background: rgba(255, 255, 255, 0.9);
      color: #2a2a2a;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.68rem;
      font-weight: 600;
      line-height: 1.35;
      text-align: center;
      box-shadow: 0 8px 18px rgba(18, 22, 32, 0.16);
      pointer-events: none;
      z-index: 4;
      display: block;
    }
    .mobile-guide-banner.night {
      border-color: rgba(118, 203, 255, 0.45);
      background: rgba(12, 19, 33, 0.84);
      color: #e5f3ff;
      box-shadow: 0 0 14px rgba(64, 224, 255, 0.16), 0 8px 20px rgba(3, 8, 18, 0.55);
    }
    .mobile-help-panel {
      position: absolute;
      top: calc(max(0.7rem, env(safe-area-inset-top)) + 2.35rem);
      right: max(0.6rem, env(safe-area-inset-right));
      width: min(78vw, 280px);
      padding: 0.62rem 0.68rem;
      border-radius: 12px;
      border: 1px solid rgba(211, 204, 194, 0.94);
      background: rgba(255, 255, 255, 0.93);
      box-shadow: 0 10px 24px rgba(15, 21, 33, 0.2);
      z-index: 5;
      display: block;
      pointer-events: auto;
    }
    .mobile-help-panel.night {
      border-color: rgba(126, 213, 255, 0.46);
      background: rgba(11, 18, 32, 0.9);
      box-shadow: 0 0 16px rgba(64, 224, 255, 0.16), 0 12px 28px rgba(3, 8, 18, 0.58);
    }
    .mobile-help-title {
      margin: 0 0 0.35rem 0;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.72rem;
      font-weight: 750;
      color: #1f2733;
    }
    .mobile-help-panel.night .mobile-help-title {
      color: #e9f4ff;
    }
    .mobile-help-line {
      margin: 0;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.67rem;
      line-height: 1.35;
      color: #3a4657;
    }
    .mobile-help-panel.night .mobile-help-line {
      color: #bfd4ea;
    }
    .mobile-markers-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 3;
      display: none;
    }
    .mobile-marker {
      position: absolute;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      gap: 0.28rem;
    }
    .mobile-marker-dot {
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 999px;
      background: rgba(124, 92, 255, 0.95);
      box-shadow: 0 0 0 rgba(124, 92, 255, 0.42);
      animation: markerPulse 1.8s ease-out infinite;
      animation-delay: var(--delay, 0ms);
      flex-shrink: 0;
    }
    .mobile-marker-label {
      max-width: 7.4rem;
      padding: 0.18rem 0.38rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(210, 203, 193, 0.92);
      color: #2d3544;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.58rem;
      font-weight: 650;
      line-height: 1.1;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      transform: translate(var(--label-offset-x, 0px), var(--label-offset-y, 0px));
    }
    @keyframes markerPulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(124, 92, 255, 0.48);
      }
      70% {
        transform: scale(1.06);
        box-shadow: 0 0 0 10px rgba(124, 92, 255, 0);
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(124, 92, 255, 0);
      }
    }
    @media (max-width: 768px) {
      .hover-tooltip {
        display: none;
      }
      .mobile-guide-banner,
      .mobile-markers-layer {
        display: block;
      }
    }
  `]
})
export class Scene3dComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;
  protected readonly state = inject(PortfolioStateService);
  private readonly transition = inject(SceneTransitionService);
  private readonly visitorCounter = inject(VisitorCounterService);
  protected readonly portfolioOwnerName = PORTFOLIO_OWNER_NAME;
  protected readonly portfolioRoleLine = PORTFOLIO_ROLE_LINE;
  protected readonly portfolioSpecialtyLine = PORTFOLIO_SPECIALTY_LINE;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationId = 0;

  private ambientLight!: THREE.AmbientLight;
  private directionalLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;
  private deskKeyLight!: THREE.SpotLight;
  private deskKeyTarget!: THREE.Object3D;
  private warmSideLight!: THREE.PointLight;
  private rgbLights: THREE.PointLight[] = [];
  private accentLights: THREE.PointLight[] = [];
  private hexGlowLights: THREE.PointLight[] = [];
  private hoverMarker: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> | null = null;
  private monitorScreen: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null = null;
  private monitorScreenTexture: THREE.CanvasTexture | null = null;
  private monitorScreenCanvas: HTMLCanvasElement | null = null;
  private monitorScreenCtx: CanvasRenderingContext2D | null = null;
  private visitorCounterSign: THREE.Group | null = null;
  private visitorCounterTexture: THREE.CanvasTexture | null = null;
  private visitorCounterCanvas: HTMLCanvasElement | null = null;
  private visitorCounterCtx: CanvasRenderingContext2D | null = null;
  private visitorCounterFaceMaterial: THREE.MeshBasicMaterial | null = null;
  private visitorCounterGlowMaterial: THREE.MeshBasicMaterial | null = null;
  private monitorUiTime = 0;
  private monitorFrameTick = 0;

  private raycaster = new Raycaster();
  private mouse = new Vector2();
  private doorMeshes: THREE.Object3D[] = [];
  private aboutMeshes: THREE.Object3D[] = [];
  private projectMeshes: THREE.Object3D[] = [];
  private hobbyMeshes: THREE.Object3D[] = [];
  private certificationsMeshes: THREE.Object3D[] = [];
  private contactMeshes: THREE.Object3D[] = [];
  private switchMeshes: THREE.Object3D[] = [];
  private postItMeshes: THREE.Object3D[] = [];
  private activePostItDrag: {
    pointerId: number;
    group: THREE.Group;
    dragPlane: THREE.Mesh;
    boardData: {
      horizontalAxis: number;
      verticalAxis: number;
      depthAxis: number;
      center: THREE.Vector3;
      size: THREE.Vector3;
    };
    fixedDepth: number;
    noteWidth: number;
    noteHeight: number;
    offset: THREE.Vector3;
    startClientX: number;
    startClientY: number;
    moved: boolean;
  } | null = null;
  private suppressNextClick = false;
  private houseGroup: THREE.Group | null = null;

  private cameraTarget = { pos: new THREE.Vector3(), lookAt: new THREE.Vector3() };
  private isAnimating = false;
  private isZoomingToNeonSign = false;
  private neonSignZoomPhase: 1 | 2 = 1;
  private neonPulseTime = 0;
  private visualLightMode: 'day' | 'night' = 'day';
  private hoverPulseTime = 0;
  private mobileGuideHideTimer: ReturnType<typeof setTimeout> | null = null;
  private mobileGuideFrameTick = 0;
  private hasShownMobileGuideOnce = false;

  private readonly mobileGuideAnchors = [
    { id: 'about', label: 'Pizarra', section: 'sobre-mi' as const, position: [-1.72, 1.06, -0.62] as [number, number, number], delay: 0, labelOffsetX: 0, labelOffsetY: 0 },
    { id: 'projects', label: 'PC', section: 'proyectos' as const, position: [0.2, 1.02, -0.48] as [number, number, number], delay: 180, labelOffsetX: 0, labelOffsetY: 0 },
    { id: 'hobbies', label: 'Tocadiscos', section: 'hobbies' as const, position: [1.42, 0.96, -1.08] as [number, number, number], delay: 360, labelOffsetX: 0, labelOffsetY: 0 },
    { id: 'certs', label: 'Cuadros', section: 'certificaciones' as const, position: [1.38, 1.28, -1.515] as [number, number, number], delay: 540, labelOffsetX: 0, labelOffsetY: 0 },
    { id: 'contact', label: 'Telefono', section: 'contacto' as const, position: [0.76, 0.79, -0.23] as [number, number, number], delay: 720, labelOffsetX: 0, labelOffsetY: 0 },
    { id: 'switch', label: 'Interruptor', section: 'switch' as const, position: [-1.9, 1.05, -0.42] as [number, number, number], delay: 900, labelOffsetX: -36, labelOffsetY: -14 }
  ];

  protected readonly hoverTooltip = signal<{ label: string; x: number; y: number } | null>(null);
  protected readonly isMobileUi = signal(false);
  protected readonly showMobileGuideBanner = signal(false);
  protected readonly showMobileHelpPanel = signal(false);
  protected readonly mobileGuideMarkers = signal<Array<{
    id: string;
    label: string;
    x: number;
    y: number;
    visible: boolean;
    delay: string;
    labelOffsetX: number;
    labelOffsetY: number;
  }>>([]);

  private resizeHandler = () => this.handleResize();
  private canvasPointerUpHandler = (e: PointerEvent) => this.onPointerUp(e);
  private canvasPointerDownHandler = (e: PointerEvent) => this.onPointerDown(e);
  private canvasPointerMoveHandler = (e: PointerEvent) => this.onPointerDrag(e);
  private canvasPointerCancelHandler = (e: PointerEvent) => this.onPointerCancel(e);
  private canvasMoveHandler = (e: MouseEvent) => this.onPointerMove(e);
  private canvasLeaveHandler = () => this.onPointerLeave();

  constructor() {
    effect(() => {
      const mode = this.state.lightMode();
      if (this.scene) this.applyLightMode(mode);
    });
    effect(() => {
      const section = this.state.currentSection();
      const inside = this.state.hasEnteredHouse();
      const inNeonSign = this.state.hasEnteredNeonSign();
      const zoomRequested = this.state.neonSignZoomRequested();
      if (this.camera && this.controls) {
        if (zoomRequested || section === 'sobre-mi' || inNeonSign) this.animateCameraToNeonSign();
        else if (inside) this.animateCameraToDoor();
        else this.animateCameraTo(section);
      }
      if (section !== 'home') {
        this.showMobileHelpPanel.set(false);
        this.showMobileGuideBanner.set(false);
      } else {
        this.maybeShowMobileGuideBanner();
      }
      this.syncCanvasInteractivity(section);
    });
    effect(() => {
      const count = this.visitorCounter.count();
      this.updateVisitorCounterSignTexture(count);
    });
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    this.initScene(canvas);
    this.loadModel();
    this.setupControls(canvas);
    this.setupClick(canvas);
    this.animate();
    this.handleResize();
    this.maybeShowMobileGuideBanner();
    window.addEventListener('resize', this.resizeHandler);
    void this.visitorCounter.ensureInitialized();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      canvas.removeEventListener('pointerdown', this.canvasPointerDownHandler);
      canvas.removeEventListener('pointerup', this.canvasPointerUpHandler);
      canvas.removeEventListener('pointermove', this.canvasPointerMoveHandler);
      canvas.removeEventListener('pointercancel', this.canvasPointerCancelHandler);
      canvas.removeEventListener('mousemove', this.canvasMoveHandler);
      canvas.removeEventListener('mouseleave', this.canvasLeaveHandler);
    }
    if (this.mobileGuideHideTimer) {
      clearTimeout(this.mobileGuideHideTimer);
      this.mobileGuideHideTimer = null;
    }
    cancelAnimationFrame(this.animationId);
    if (this.hoverMarker) {
      this.scene.remove(this.hoverMarker);
      this.hoverMarker.geometry.dispose();
      this.hoverMarker.material.dispose();
      this.hoverMarker = null;
    }
    this.controls?.dispose();
    this.monitorScreenTexture?.dispose();
    this.monitorScreenTexture = null;
    this.monitorScreenCanvas = null;
    this.monitorScreenCtx = null;
    this.monitorScreen = null;
    this.visitorCounterTexture?.dispose();
    this.visitorCounterTexture = null;
    this.visitorCounterCanvas = null;
    this.visitorCounterCtx = null;
    this.visitorCounterFaceMaterial = null;
    this.visitorCounterGlowMaterial = null;
    this.visitorCounterSign = null;
    this.renderer?.dispose();
  }

  private initScene(canvas: HTMLCanvasElement): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xeef2e8);

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    const home = this.getResponsiveCameraTarget(CAMERA_POSITIONS.home, 'home');
    this.camera.position.set(...home.position);
    this.cameraTarget.pos.set(...home.position);
    this.cameraTarget.lookAt.set(...home.target);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.getViewportProfile() === 'desktop' ? 2 : 1.6));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.ambientLight = new THREE.AmbientLight(0xf6f2e8, 0.64);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xf8f2e6, 0.86);
    this.directionalLight.position.set(4, 6, 4);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.bias = -0.0001;
    this.directionalLight.shadow.normalBias = 0.02;
    this.scene.add(this.directionalLight);

    this.fillLight = new THREE.DirectionalLight(theme.sceneFillDay, 0.35);
    this.fillLight.position.set(-2, 2, -2);
    this.scene.add(this.fillLight);

    this.deskKeyTarget = new THREE.Object3D();
    this.deskKeyTarget.position.set(-0.36, 0.96, -0.56);
    this.scene.add(this.deskKeyTarget);

    this.deskKeyLight = new THREE.SpotLight(0xfff2dc, 0.78, 6.2, Math.PI / 6.4, 0.48, 1.05);
    this.deskKeyLight.position.set(-1.02, 1.92, 0.18);
    this.deskKeyLight.target = this.deskKeyTarget;
    this.deskKeyLight.castShadow = true;
    this.deskKeyLight.shadow.mapSize.width = 1024;
    this.deskKeyLight.shadow.mapSize.height = 1024;
    this.deskKeyLight.shadow.bias = -0.00008;
    this.deskKeyLight.shadow.normalBias = 0.02;
    this.scene.add(this.deskKeyLight);

    this.warmSideLight = new THREE.PointLight(0xffdfbf, 0.22, 3.6, 2);
    this.warmSideLight.position.set(1.38, 1.06, -0.62);
    this.scene.add(this.warmSideLight);

    this.hoverMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0x7c5cff,
        transparent: true,
        opacity: 0.88,
        depthTest: false
      })
    );
    this.hoverMarker.visible = false;
    this.hoverMarker.renderOrder = 10;
    this.scene.add(this.hoverMarker);

    this.applyLightMode(this.state.lightMode());
  }

  private loadModel(): void {
    const loader = new GLTFLoader();
    const startLoad = async (): Promise<void> => {
      const reachableCandidates: string[] = [];
      for (const candidate of MODEL_CANDIDATES) {
        if (await this.canAccessAsset(candidate)) {
          reachableCandidates.push(candidate);
        }
      }

      const tryLoad = (index: number): void => {
        if (index >= reachableCandidates.length) {
          this.buildProceduralOffice();
          return;
        }

        const modelPath = reachableCandidates[index];
        loader.load(
          encodeURI(modelPath),
          (gltf) => {
            this.houseGroup = gltf.scene;
            this.houseGroup.traverse((obj) => {
              if (obj instanceof THREE.Mesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
              }
            });
            const box = new THREE.Box3().setFromObject(this.houseGroup);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;

            this.houseGroup.position.sub(center);
            this.houseGroup.scale.setScalar(scale);
            this.houseGroup.rotation.y = Math.PI;
            this.houseGroup.position.set(0, 0, 0);
            this.scene.add(this.houseGroup);

            this.hideAframeSign(this.houseGroup);
            this.setupInteractiveTargets(this.houseGroup);
            this.setupFallbackHotspots();
            this.setupDoorHitbox();
            this.applyLightMode(this.state.lightMode());
            this.syncCameraToState(true);
          },
          undefined,
          () => tryLoad(index + 1)
        );
      };

      tryLoad(0);
    };

    void startLoad();
  }

  private async canAccessAsset(assetPath: string): Promise<boolean> {
    try {
      const response = await fetch(encodeURI(assetPath), { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  private hideAframeSign(parent: THREE.Group): void {
    const aframeNames = ['area002', 'area003'];
    parent.traverse((obj) => {
      const name = (obj.name || '').toLowerCase();
      if (aframeNames.some(n => name.includes(n))) {
        obj.visible = false;
      }
    });
  }

  private setupInteractiveTargets(parent: THREE.Group): void {
    this.aboutMeshes = [];
    this.projectMeshes = [];
    this.hobbyMeshes = [];
    this.certificationsMeshes = [];
    this.contactMeshes = [];
    this.switchMeshes = [];
    this.postItMeshes = [];

    parent.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const name = (obj.name || '').toLowerCase();

      if (name.includes('monitor') || name.includes('pc') || name.includes('laptop') || name.includes('computer')) {
        this.projectMeshes.push(obj);
      }
      if (name.includes('about_board') || name.includes('whiteboard') || name.includes('pizarra') || name.includes('about')) {
        this.aboutMeshes.push(obj);
      }
      if (name.includes('turntable') || name.includes('vinyl') || name.includes('record') || name.includes('tocadisco')) {
        this.hobbyMeshes.push(obj);
      }
      if (
        name.includes('certificate') ||
        name.includes('certificacion') ||
        name.includes('certificado') ||
        name.includes('wall art') ||
        name.includes('picture frame')
      ) {
        this.certificationsMeshes.push(obj);
      }
      if (name.includes('phone') || name.includes('telefono') || name.includes('mobile') || name.includes('cell')) {
        this.contactMeshes.push(obj);
      }
      if (name.includes('switch') || name.includes('interruptor')) {
        this.switchMeshes.push(obj);
      }
    });
  }

  private setupFallbackHotspots(): void {
    if (this.aboutMeshes.length === 0) {
      const aboutPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.95, 0.7),
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          colorWrite: false,
          depthWrite: false,
          depthTest: false
        })
      );
      aboutPlane.position.set(-1.9, 1.02, -0.62);
      aboutPlane.rotation.y = Math.PI / 2;
      aboutPlane.visible = false;
      this.scene.add(aboutPlane);
      this.aboutMeshes.push(aboutPlane);
    }

    if (this.projectMeshes.length === 0) {
      const projectPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.56, 0.34),
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          colorWrite: false,
          depthWrite: false,
          depthTest: false
        })
      );
      projectPlane.position.set(0.2, 1.02, -0.48);
      projectPlane.visible = false;
      this.scene.add(projectPlane);
      this.projectMeshes.push(projectPlane);
    }

    if (this.hobbyMeshes.length === 0) {
      const hobbyPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.38, 0.22),
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          colorWrite: false,
          depthWrite: false,
          depthTest: false
        })
      );
      hobbyPlane.position.set(1.42, 0.96, -1.08);
      hobbyPlane.visible = false;
      this.scene.add(hobbyPlane);
      this.hobbyMeshes.push(hobbyPlane);
    }

    if (this.certificationsMeshes.length === 0) {
      const certPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.12, 0.6),
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          colorWrite: false,
          depthWrite: false,
          depthTest: false
        })
      );
      certPlane.position.set(1.38, 1.28, -1.515);
      certPlane.visible = false;
      this.scene.add(certPlane);
      this.certificationsMeshes.push(certPlane);
    }

    if (this.contactMeshes.length === 0) {
      const contactPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.2, 0.14),
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          colorWrite: false,
          depthWrite: false,
          depthTest: false
        })
      );
      contactPlane.position.set(0.76, 0.79, -0.23);
      contactPlane.visible = false;
      this.scene.add(contactPlane);
      this.contactMeshes.push(contactPlane);
    }

    if (this.switchMeshes.length === 0) {
      const switchPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.16, 0.24),
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          colorWrite: false,
          depthWrite: false,
          depthTest: false
        })
      );
      switchPlane.position.set(-1.90, 1.05, -0.42);
      switchPlane.visible = false;
      this.scene.add(switchPlane);
      this.switchMeshes.push(switchPlane);
    }

    this.setupVisitorCounterSign();
  }

  private buildProceduralOffice(): void {
    this.aboutMeshes = [];
    this.projectMeshes = [];
    this.hobbyMeshes = [];
    this.certificationsMeshes = [];
    this.contactMeshes = [];
    this.switchMeshes = [];
    this.doorMeshes = [];
    this.postItMeshes = [];

    const office = new THREE.Group();
    office.name = 'procedural_office';

    const floorTex = this.createFloorWoodTexture();
    floorTex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.08, 3.2),
      new THREE.MeshStandardMaterial({
        color: 0xf3e9d9,
        map: floorTex,
        roughness: 0.9,
        metalness: 0.02
      })
    );
    floor.position.set(0, -0.04, 0);
    floor.receiveShadow = true;
    floor.name = 'floor';
    office.add(floor);

    const rug = new THREE.Mesh(
      new THREE.BoxGeometry(1.92, 0.014, 1.3),
      new THREE.MeshStandardMaterial({
        color: 0xece8df,
        roughness: 0.95,
        metalness: 0.01,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      })
    );
    rug.position.set(-0.42, 0.008, -0.34);
    rug.rotation.y = 0.05;
    rug.receiveShadow = true;
    rug.castShadow = false;
    rug.name = 'area_rug';
    office.add(rug);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xede9e0, roughness: 0.86, metalness: 0.01 });
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 3.2), wallMat);
    leftWall.position.set(-1.96, 1.1, 0);
    leftWall.receiveShadow = true;
    leftWall.name = 'left_wall';
    office.add(leftWall);

    const rightColumn = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 0.7), wallMat);
    rightColumn.position.set(1.96, 1.1, -1.22);
    rightColumn.receiveShadow = true;
    rightColumn.name = 'right_column';
    office.add(rightColumn);

    const backWallMat = wallMat.clone();
    backWallMat.color.setHex(0xe4dfd5);
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(4, 2.2, 0.08), backWallMat);
    backWall.position.set(0, 1.1, -1.56);
    backWall.receiveShadow = true;
    backWall.name = 'back_wall';
    office.add(backWall);
    const rgbHexPanels = this.createRgbHexWallPanels();
    office.add(rgbHexPanels);
    this.setupHexGlowLights(office);

    const ledStripBack = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.018, 0.018),
      new THREE.MeshStandardMaterial({ color: 0xddfbff, emissive: 0x40e8ff, emissiveIntensity: 0.3 })
    );
    ledStripBack.position.set(0, 0.09, -1.515);
    ledStripBack.name = 'led_strip_back';
    office.add(ledStripBack);

    const ledStripLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.018, 3.0),
      new THREE.MeshStandardMaterial({ color: 0xddfbff, emissive: 0x40e8ff, emissiveIntensity: 0.24 })
    );
    ledStripLeft.position.set(-1.965, 2.08, -0.02);
    ledStripLeft.name = 'led_strip_left';
    office.add(ledStripLeft);

    const ledStripRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.018, 3.0),
      new THREE.MeshStandardMaterial({ color: 0xddfbff, emissive: 0x40e8ff, emissiveIntensity: 0.24 })
    );
    ledStripRight.position.set(-1.93, 0.09, -0.02);
    ledStripRight.name = 'led_strip_right';
    office.add(ledStripRight);

    this.addOfficeAsset(office, '/models/office/Adjustable Desk.glb', {
      name: 'office_desk',
      position: [-0.42, 0, -0.32],
      rotation: [0, Math.PI + Math.PI / 2, 0],
      fitSize: 2,
      align: 'floor'
    });

    this.addOfficeAsset(office, '/models/office/chair.glb', {
      name: 'office_chair',
      position: [-0.60, 0, 0.24],
      rotation: [0, Math.PI, 0],
      fitSize: 1.15,
      align: 'floor'
    });

    this.addOfficeAsset(office, '/models/office/Computer.glb', {
      name: 'office_computer',
      position: [-0.38, 0.93, -0.58],
      rotation: [0, 0, 0],
      fitSize: 0.95,
      align: 'floor',
      section: 'proyectos'
    });
    office.add(this.createMonitorOverlay());
    this.addContactShadow(office, [-0.41, 0.009, -0.35], [0.86, 0.52], 0.17, 'contact_shadow_desk', 0.04);
    this.addContactShadow(office, [-0.27, 0.009, -0.62], [0.26, 0.18], 0.2, 'contact_shadow_cpu', -0.52);
    this.addContactShadow(office, [-1.28, 0.009, -0.58], [0.26, 0.21], 0.18, 'contact_shadow_plant', 0.02);

    this.addOfficeAsset(office, '/models/office/Low poly phone.glb', {
      name: 'office_phone',
      position: [0.40, 1.02, -0.7],
      rotation: [0, -0.55 + Math.PI / 0.85, 0],
      fitSize: 0.25,
      align: 'center',
      section: 'contacto'
    });

    this.addOfficeAsset(office, '/models/office/Message board.glb', {
      name: 'about_board',
      position: [-1.9, 1.62, 0.14],
      rotation: [0, 0, 0],
      fitSize: 1.0,
      align: 'center',
      section: 'sobre-mi'
    });

    this.addOfficeAsset(office, '/models/office/Shelf Small.glb', {
      name: 'turntable_shelf',
      position: [1.34, 0, -1.04],
      rotation: [0, 0, 0],
      fitSize: 1.05,
      align: 'floor'
    });

    this.addOfficeAsset(office, '/models/office/Record player.glb', {
      name: 'record_player',
      position: [1.34, 0.40, -1.04],
      rotation: [0, Math.PI / 2, 0],
      fitSize: 0.34,
      align: 'floor',
      section: 'hobbies'
    });

    const certGallery = [
      { name: 'cert_frame_1', position: [0.98, 1.68, -1.515] as [number, number, number], scale: [0.78, 0.66, 1] as [number, number, number], color: 0x5f7f9a },
      { name: 'cert_frame_2', position: [1.34, 1.54, -1.515] as [number, number, number], scale: [0.74, 1.34, 1] as [number, number, number], color: 0x5b6f8f },
      { name: 'cert_frame_3', position: [1.70, 1.68, -1.515] as [number, number, number], scale: [0.78, 0.66, 1] as [number, number, number], color: 0x6d7a5b },
      { name: 'cert_frame_4', position: [0.98, 1.32, -1.515] as [number, number, number], scale: [0.58, 1.05, 1] as [number, number, number], color: 0x8a6a55 },
      { name: 'cert_frame_5', position: [1.34, 1.24, -1.515] as [number, number, number], scale: [0.74, 0.58, 1] as [number, number, number], color: 0x7c6289 },
      { name: 'cert_frame_6', position: [1.70, 1.32, -1.515] as [number, number, number], scale: [0.58, 1.05, 1] as [number, number, number], color: 0x5f6f7c }
    ];

    certGallery.forEach((item) => {
      const frame = this.createWallFrame(item.color);
      frame.name = item.name;
      frame.position.set(...item.position);
      frame.scale.set(...item.scale);
      frame.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });
      office.add(frame);
      this.certificationsMeshes.push(this.createClickProxy(office, frame, 'certificaciones'));
    });

    this.addOfficeAsset(office, '/models/office/Mate.glb', {
      name: 'mate_gourd',
      position: [1.14, 0.40, -1.0],
      rotation: [0, Math.PI / 2 + 0.2, 0],
      fitSize: 0.15,
      align: 'floor'
    });

    this.addOfficeAsset(office, '/models/office/Thermos.glb', {
      name: 'mate_thermos',
      position: [1.02, 0.40, -1.01],
      rotation: [0, Math.PI / 2 + 0.16, 0],
      fitSize: 0.26,
      align: 'floor'
    });

    this.addOfficeAsset(office, '/models/office/vinyl stack 2.glb', {
      name: 'vinyl_stack_left',
      position: [1.72, 0.40, -1],
      rotation: [0, Math.PI / 2, 0],
      fitSize: 0.2,
      align: 'floor',
      section: 'hobbies'
    });

    this.addOfficeAsset(office, '/models/office/vinyl stack 3.glb', {
      name: 'vinyl_stack_right',
      position: [1.32, 0.10, -0.88],
      rotation: [0, Math.PI / 2, 0],
      fitSize: 0.2,
      align: 'floor',
      section: 'hobbies'
    });

    this.addOfficeAsset(office, '/models/office/Plant Decor.glb', {
      name: 'plant_decor_main',
      position: [-1.22, 1.09, -0.60],
      rotation: [0, 0.20, 0],
      fitSize: 0.5,
      align: 'center'
    });

    const rgbLamp = this.createRgbFloorLamp();
    rgbLamp.position.set(-1.88, 0.0, -1.44);
    rgbLamp.rotation.y = 0.8;
    office.add(rgbLamp);

    this.addOfficeAsset(office, '/models/office/Light switch.glb', {
      name: 'wall_switch',
      position: [-1.90, 1.13, 0.82],
      rotation: [0, Math.PI + Math.PI / 2, 0],
      fitSize: 0.18,
      align: 'center',
      section: 'switch'
    });

    this.addOfficeAsset(office, '/models/office/Flower Pot.glb', {
      name: 'wall_flower_pot',
      position: [-1.80, 0.0, 0.82],
      rotation: [0, Math.PI / 2, 0],
      fitSize: 1.12,
      align: 'floor'
    });

    this.houseGroup = office;
    this.scene.add(office);

    this.setupInteractiveTargets(office);
    this.setupFallbackHotspots();
    this.setupDoorHitbox();
    this.setupAccentLights(office);
    this.fitCameraToOffice(office);
    this.applyLightMode(this.state.lightMode());
    this.syncCameraToState(true);
  }

  private addOfficeAsset(
    office: THREE.Group,
    path: string,
    options: {
      name: string;
      position: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
      fitSize?: number;
      align?: 'floor' | 'center';
      section?: 'sobre-mi' | 'proyectos' | 'hobbies' | 'certificaciones' | 'contacto' | 'switch' | 'door';
    }
  ): void {
    const loader = new GLTFLoader();
    loader.load(
      encodeURI(path),
      (gltf) => {
        const model = gltf.scene;
        model.name = options.name;
        if (options.rotation) model.rotation.set(...options.rotation);
        if (options.scale) model.scale.set(...options.scale);

        if (options.fitSize) {
          const initialBox = new THREE.Box3().setFromObject(model);
          const initialSize = initialBox.getSize(new THREE.Vector3());
          const maxDim = Math.max(initialSize.x, initialSize.y, initialSize.z);
          if (maxDim > 0) {
            const factor = options.fitSize / maxDim;
            model.scale.multiplyScalar(factor);
          }
        }

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        if ((options.align ?? 'floor') === 'center') {
          model.position.set(-center.x, -center.y, -center.z);
        } else {
          model.position.set(-center.x, -box.min.y, -center.z);
        }

        const wrapper = new THREE.Group();
        wrapper.name = `${options.name}_wrapper`;
        wrapper.position.set(...options.position);
        wrapper.add(model);
        this.tuneAssetMaterials(options.name, wrapper);
        if (options.name === 'about_board') {
          this.addBoardPostIts(wrapper, model);
        }

        wrapper.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
          }
        });

        office.add(wrapper);

        const clickTarget = options.section
          ? this.createClickProxy(office, wrapper, options.section)
          : wrapper;

        if (options.section === 'sobre-mi') this.aboutMeshes.push(clickTarget);
        if (options.section === 'proyectos') this.projectMeshes.push(clickTarget);
        if (options.section === 'hobbies') this.hobbyMeshes.push(clickTarget);
        if (options.section === 'certificaciones') this.certificationsMeshes.push(clickTarget);
        if (options.section === 'contacto') this.contactMeshes.push(clickTarget);
        if (options.section === 'switch') this.switchMeshes.push(clickTarget);
        if (options.section === 'door') this.doorMeshes.push(wrapper);
      },
      undefined,
      () => {
        if (options.name === 'office_chair') {
          const fallbackChair = new THREE.Group();
          fallbackChair.name = 'office_chair_fallback';
          fallbackChair.position.set(...options.position);
          if (options.rotation) fallbackChair.rotation.set(...options.rotation);

          const seat = new THREE.Mesh(
            new THREE.BoxGeometry(0.36, 0.07, 0.34),
            new THREE.MeshStandardMaterial({ color: 0x1f6f78, roughness: 0.65, metalness: 0.08 })
          );
          seat.position.set(0, 0.42, 0);
          seat.name = 'chair_seat_fallback';

          const back = new THREE.Mesh(
            new THREE.BoxGeometry(0.36, 0.34, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x1f6f78, roughness: 0.65, metalness: 0.08 })
          );
          back.position.set(0, 0.62, -0.14);
          back.name = 'chair_back_fallback';

          const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.42, 10),
            new THREE.MeshStandardMaterial({ color: 0x3a4558, roughness: 0.5, metalness: 0.3 })
          );
          base.position.set(0, 0.2, 0);

          const wheelBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 0.02, 12),
            new THREE.MeshStandardMaterial({ color: 0x2f3744, roughness: 0.5, metalness: 0.35 })
          );
          wheelBase.position.set(0, 0.01, 0);

          fallbackChair.add(seat, back, base, wheelBase);
          fallbackChair.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              obj.castShadow = true;
              obj.receiveShadow = true;
            }
          });
          office.add(fallbackChair);
        }
      }
    );
  }

  private tuneAssetMaterials(assetName: string, root: THREE.Object3D): void {
    if (assetName !== 'wall_flower_pot' && assetName !== 'turntable_shelf' && assetName !== 'about_board') return;

    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh) || !obj.material) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];

      mats.forEach((m) => {
        const mat = m.clone();

        if (assetName === 'turntable_shelf') {
          const shelfMat = mat as THREE.Material & {
            color?: THREE.Color;
            emissive?: THREE.Color;
            emissiveIntensity?: number;
            map?: THREE.Texture | null;
            roughness?: number;
            metalness?: number;
          };

          if (shelfMat.color) shelfMat.color.setHex(0x060608);
          if (shelfMat.emissive) shelfMat.emissive.setHex(0x000000);
          if (typeof shelfMat.emissiveIntensity === 'number') shelfMat.emissiveIntensity = 0;
          if ('map' in shelfMat) shelfMat.map = null;
          if (typeof shelfMat.roughness === 'number') shelfMat.roughness = 0.82;
          if (typeof shelfMat.metalness === 'number') shelfMat.metalness = 0.06;
        } else if (assetName === 'about_board') {
          if (!(mat instanceof THREE.MeshStandardMaterial)) return;
          mat.map = null;
          mat.color.setHex(0xffffff);
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
          mat.roughness = 0.88;
          mat.metalness = 0.01;
        } else {
          if (!(mat instanceof THREE.MeshStandardMaterial)) return;

          if (mat.map) {
          mat.color.setHex(0xffffff);
          } else {
            const hsl = new THREE.Color(mat.color.getHex()).getHSL({ h: 0, s: 0, l: 0 });
            const looksLikeLeaf = hsl.h > 0.18 && hsl.h < 0.45 && hsl.s > 0.18;

            if (looksLikeLeaf) {
              mat.color.setHex(0x5aa55a);
              mat.roughness = 0.88;
              mat.metalness = 0.02;
            } else {
              mat.color.setHex(0x7a5a44);
              mat.roughness = 0.92;
              mat.metalness = 0.01;
            }
          }
        }

        mat.envMapIntensity = 0.35;
        mat.needsUpdate = true;

        if (Array.isArray(obj.material)) {
          const idx = obj.material.indexOf(m);
          if (idx >= 0) obj.material[idx] = mat;
        } else {
          obj.material = mat;
        }
      });
    });
  }

  private createClickProxy(
    office: THREE.Group,
    target: THREE.Object3D,
    section: 'sobre-mi' | 'proyectos' | 'hobbies' | 'certificaciones' | 'contacto' | 'switch' | 'door'
  ): THREE.Object3D {
    const box = new THREE.Box3().setFromObject(target);
    if (box.isEmpty()) return target;

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const padding =
      section === 'hobbies'
        ? new THREE.Vector3(0.28, 0.2, 0.28)
        : section === 'certificaciones'
          ? new THREE.Vector3(0.18, 0.18, 0.12)
        : section === 'switch'
          ? new THREE.Vector3(0.24, 0.28, 0.24)
          : new THREE.Vector3(0.14, 0.14, 0.14);
    const minProxySize = section === 'switch' ? 0.34 : 0.2;

    const proxySize = new THREE.Vector3(
      Math.max(size.x + padding.x, minProxySize),
      Math.max(size.y + padding.y, minProxySize),
      Math.max(size.z + padding.z, minProxySize)
    );

    const proxy = new THREE.Mesh(
      new THREE.BoxGeometry(proxySize.x, proxySize.y, proxySize.z),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        colorWrite: false,
        depthWrite: false,
        depthTest: false
      })
    );
    proxy.name = `${section}_click_proxy`;
    proxy.position.copy(center);
    proxy.userData['isClickProxy'] = true;
    proxy.visible = false;
    office.add(proxy);
    return proxy;
  }

  private setupAccentLights(office: THREE.Group): void {
    this.accentLights.forEach((light) => office.remove(light));
    this.accentLights = [];

    const makeAccent = (
      color: number,
      position: [number, number, number],
      distance: number,
      dayIntensity: number,
      nightIntensity: number,
      phase = 0
    ): void => {
      const light = new THREE.PointLight(color, nightIntensity, distance);
      light.position.set(...position);
      light.userData['dayIntensity'] = dayIntensity;
      light.userData['nightIntensity'] = nightIntensity;
      light.userData['pulsePhase'] = phase;
      office.add(light);
      this.accentLights.push(light);
    };

    makeAccent(0x6cf4ff, [-0.34, 1.08, -0.62], 1.5, 0.04, 0.24, 0.55);
    makeAccent(0x57e9ff, [-0.18, 0.34, -0.12], 1.9, 0.0, 0.2, 1.0);
    makeAccent(0x4ee7ff, [-0.34, 0.56, -0.56], 1.6, 0.0, 0.24, 1.05);
    makeAccent(0x4ee7ff, [-0.34, 0.38, -0.56], 1.55, 0.0, 0.17, 0.95);
    makeAccent(0x45ddff, [0.28, 0.86, -0.62], 1.6, 0.0, 0.17, 1.6);
    makeAccent(0x4fe2ff, [1.34, 0.38, -0.84], 1.4, 0.0, 0.14, 0.5);
    makeAccent(0x63f1ff, [-1.78, 1.52, 0.12], 1.5, 0.0, 0.18, 2.2);
    makeAccent(0x5defff, [-1.72, 1.68, 0.18], 2.35, 0.0, 0.34, 0.2);
    makeAccent(0x43e8ff, [-1.72, 1.68, -0.92], 2.35, 0.0, 0.25, 0.95);
    makeAccent(0x52f9ff, [1.58, 1.68, -1.28], 2.2, 0.0, 0.24, 1.6);
    makeAccent(0x40d7ff, [0.92, 1.68, -1.28], 2.15, 0.0, 0.22, 2.3);
    makeAccent(0x4ce6ff, [-1.9, 0.95, -1.48], 3.2, 0.0, 0.54, 0.2);
    makeAccent(0x67f3ff, [-1.72, 1.28, -1.46], 2.7, 0.0, 0.34, 1.7);

    const lampGlow = new THREE.PointLight(0x4eefff, 0.72, 3.4);
    lampGlow.position.set(-1.88, 1.07, -1.44);
    lampGlow.userData['dayIntensity'] = 0;
    lampGlow.userData['nightIntensity'] = 0.9;
    lampGlow.userData['pulsePhase'] = 0.3;
    lampGlow.userData['isLampRgbGlow'] = true;
    office.add(lampGlow);
    this.accentLights.push(lampGlow);

    const cpuGlow = new THREE.PointLight(0x49f4ff, 0.16, 1.55);
    cpuGlow.position.set(-0.21, 1.01, -0.46);
    cpuGlow.userData['dayIntensity'] = 0;
    cpuGlow.userData['nightIntensity'] = 0.23;
    cpuGlow.userData['pulsePhase'] = 1.05;
    office.add(cpuGlow);
    this.accentLights.push(cpuGlow);

    const keyboardGlow = new THREE.PointLight(0x58ecff, 0.13, 1.2);
    keyboardGlow.position.set(-0.36, 0.96, -0.42);
    keyboardGlow.userData['dayIntensity'] = 0;
    keyboardGlow.userData['nightIntensity'] = 0.18;
    keyboardGlow.userData['pulsePhase'] = 0.95;
    office.add(keyboardGlow);
    this.accentLights.push(keyboardGlow);

    const baseGlow = new THREE.PointLight(0x46e8ff, 0.16, 3.2);
    baseGlow.position.set(0, 0.14, -1.42);
    baseGlow.userData['dayIntensity'] = 0;
    baseGlow.userData['nightIntensity'] = 0.24;
    baseGlow.userData['pulsePhase'] = 1.4;
    baseGlow.userData['isBaseRgbGlow'] = true;
    office.add(baseGlow);
    this.accentLights.push(baseGlow);
  }

  private addBoardPostIts(wrapper: THREE.Group, model: THREE.Object3D): void {
    const box = new THREE.Box3().setFromObject(model);
    if (box.isEmpty()) return;

    const getComp = (v: THREE.Vector3, axis: number): number => (axis === 0 ? v.x : axis === 1 ? v.y : v.z);
    const setComp = (v: THREE.Vector3, axis: number, value: number): void => {
      if (axis === 0) v.x = value;
      else if (axis === 1) v.y = value;
      else v.z = value;
    };

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const dims = [size.x, size.y, size.z];
    const depthAxis = dims.indexOf(Math.min(...dims));

    const otherAxes = [0, 1, 2].filter((a) => a !== depthAxis);
    const verticalAxis = depthAxis === 1 ? otherAxes[1] : 1;
    const horizontalAxis = otherAxes.find((a) => a !== verticalAxis) ?? otherAxes[0];
    const front = getComp(box.max, depthAxis) + 0.0015;

    const noteW = Math.max(getComp(size, horizontalAxis) * 0.16, 0.09);
    const noteH = Math.max(getComp(size, verticalAxis) * 0.18, 0.1);
    const boardData = {
      horizontalAxis,
      verticalAxis,
      depthAxis,
      center: center.clone(),
      size: size.clone()
    };

    const notes: Array<{ x: number; y: number; rot: number }> = [
      { x: -0.22, y: 0.18, rot: -0.14 },
      { x: 0.18, y: 0.16, rot: 0.1 },
      { x: -0.05, y: -0.14, rot: 0.06 },
      { x: 0.25, y: -0.12, rot: -0.08 }
    ];

    const noteMat = new THREE.MeshStandardMaterial({
      color: 0xffea70,
      roughness: 0.9,
      metalness: 0.02,
      side: THREE.DoubleSide
    });
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xe33a3a,
      roughness: 0.45,
      metalness: 0.15
    });
    const noteGeo = new THREE.PlaneGeometry(noteW, noteH);
    const pinGeo = new THREE.SphereGeometry(Math.max(noteW * 0.06, 0.008), 10, 10);
    const dragPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(getComp(size, horizontalAxis), getComp(size, verticalAxis)),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        colorWrite: false,
        depthWrite: false
      })
    );
    dragPlane.name = 'postit_drag_plane';
    const planePos = center.clone();
    setComp(planePos, depthAxis, front + 0.0002);
    dragPlane.position.copy(planePos);
    if (depthAxis === 0) dragPlane.rotation.y = Math.PI / 2;
    else if (depthAxis === 1) dragPlane.rotation.x = Math.PI / 2;
    dragPlane.visible = false;
    wrapper.add(dragPlane);

    notes.forEach((n, idx) => {
      const group = new THREE.Group();
      group.name = `postit_group_${idx}`;
      const note = new THREE.Mesh(noteGeo, noteMat.clone());
      note.name = `postit_note_${idx}`;
      const notePos = center.clone();
      setComp(notePos, horizontalAxis, getComp(center, horizontalAxis) + n.x * getComp(size, horizontalAxis));
      setComp(notePos, verticalAxis, getComp(center, verticalAxis) + n.y * getComp(size, verticalAxis));
      setComp(notePos, depthAxis, front + idx * 0.0003);
      note.rotation.z = n.rot;
      if (depthAxis === 0) note.rotation.y = Math.PI / 2;
      else if (depthAxis === 1) note.rotation.x = Math.PI / 2;
      note.castShadow = true;
      note.receiveShadow = true;

      const pin = new THREE.Mesh(pinGeo, pinMat.clone());
      pin.name = `postit_pin_${idx}`;
      const pinPos = new THREE.Vector3();
      setComp(pinPos, horizontalAxis, getComp(pinPos, horizontalAxis) + noteW * 0.2);
      setComp(pinPos, verticalAxis, getComp(pinPos, verticalAxis) + noteH * 0.22);
      setComp(pinPos, depthAxis, getComp(pinPos, depthAxis) + 0.0018);
      pin.position.copy(pinPos);
      pin.castShadow = true;
      pin.receiveShadow = true;

      group.position.copy(notePos);
      group.add(note, pin);
      group.userData['postItDragPlane'] = dragPlane;
      group.userData['postItBoardData'] = boardData;
      group.userData['postItFixedDepth'] = getComp(notePos, depthAxis);
      group.userData['postItNoteWidth'] = noteW;
      group.userData['postItNoteHeight'] = noteH;
      note.userData['postItGroup'] = group;
      pin.userData['postItGroup'] = group;

      wrapper.add(group);
      this.postItMeshes.push(note, pin);
    });
  }

  private fitCameraToOffice(office: THREE.Group): void {
    const box = new THREE.Box3().setFromObject(office);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 1.25;
    const isoDir = new THREE.Vector3(1, 0.72, 1).normalize().multiplyScalar(distance);

    const pos = center.clone().add(isoDir);
    const look = center.clone().add(new THREE.Vector3(0, size.y * 0.08, 0));

    this.camera.position.copy(pos);
    this.cameraTarget.pos.copy(pos);
    this.cameraTarget.lookAt.copy(look);
    this.controls.target.copy(look);
    this.controls.update();
  }

  private syncCameraToState(immediate = false): void {
    if (!this.camera || !this.controls) return;

    let target: CameraTarget;
    if (this.state.neonSignZoomRequested() || this.state.currentSection() === 'sobre-mi' || this.state.hasEnteredNeonSign()) {
      target = this.getResponsiveCameraTarget(NEON_SIGN_CAMERA, 'default');
    } else if (this.state.hasEnteredHouse()) {
      target = this.getResponsiveCameraTarget(DOOR_CAMERA, 'door');
    } else {
      const section = this.state.currentSection();
      const base = CAMERA_POSITIONS[section as keyof typeof CAMERA_POSITIONS] ?? CAMERA_POSITIONS.home;
      target = this.getResponsiveCameraTarget(base, section === 'home' ? 'home' : 'default');
    }

    this.cameraTarget.pos.set(...target.position);
    this.cameraTarget.lookAt.set(...target.target);

    if (immediate) {
      this.camera.position.copy(this.cameraTarget.pos);
      this.controls.target.copy(this.cameraTarget.lookAt);
      this.controls.update();
      this.isAnimating = false;
      return;
    }

    this.isAnimating = true;
  }

  private createBillboardTexture(title: string, accent: string, base: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = '#26355c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(14, 14, canvas.width - 28, canvas.height - 28);
    ctx.strokeStyle = 'rgba(160,190,255,0.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

    ctx.fillStyle = accent;
    ctx.font = 'bold 78px "DM Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, 34, 106);

    ctx.fillStyle = base;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const x = 34 + col * 220;
        const y = 142 + row * 50;
        ctx.fillRect(x, y, 170, 8);
        ctx.fillRect(x, y + 14, 130, 6);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  private createFloorWoodTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = '#cfbfa9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const plankCount = 14;
    const plankH = canvas.height / plankCount;
    for (let i = 0; i < plankCount; i++) {
      const y = i * plankH;
      const even = i % 2 === 0;
      const base = even ? '#d6c7b2' : '#cdbca6';
      ctx.fillStyle = base;
      ctx.fillRect(0, y, canvas.width, plankH);

      ctx.fillStyle = 'rgba(70, 50, 28, 0.16)';
      ctx.fillRect(0, y, canvas.width, 2);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.fillRect(0, y + plankH - 2, canvas.width, 2);

      for (let k = 0; k < 90; k++) {
        const gx = Math.random() * canvas.width;
        const gy = y + Math.random() * plankH;
        const glen = 18 + Math.random() * 52;
        const alpha = 0.035 + Math.random() * 0.05;
        ctx.strokeStyle = `rgba(88, 64, 38, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(Math.min(canvas.width, gx + glen), gy + (Math.random() * 2 - 1));
        ctx.stroke();
      }
    }

    for (let x = 100; x < canvas.width; x += 170) {
      ctx.fillStyle = 'rgba(80, 60, 38, 0.12)';
      ctx.fillRect(x, 0, 2, canvas.height);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.4, 1.15);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  private createWallFrame(color: number): THREE.Group {
    const group = new THREE.Group();
    const glowTexture = this.createFrameGlowTexture();
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.64, 0.46),
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        color: 0x7c5cff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    glow.name = 'frame_rgb_glow';
    glow.position.set(0, 0, -0.006);
    glow.renderOrder = 8;
    glow.userData['phase'] = Math.random() * Math.PI * 2;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.28, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x6d5745, roughness: 0.58, metalness: 0.12 })
    );
    frame.name = 'cert_frame_border';

    const mat = new THREE.Mesh(
      new THREE.PlaneGeometry(0.37, 0.23),
      new THREE.MeshStandardMaterial({ color: 0xf4f0e8, roughness: 0.9, metalness: 0.02 })
    );
    mat.name = 'cert_frame_mat';
    mat.position.set(0, 0, 0.0165);

    const art = new THREE.Mesh(
      new THREE.PlaneGeometry(0.305, 0.168),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: this.createCertificateTexture(color),
        roughness: 0.48,
        metalness: 0.03
      })
    );
    art.name = 'cert_frame_art';
    art.position.set(0, 0, 0.017);

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.307, 0.17),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.08,
        metalness: 0.18,
        transparent: true,
        opacity: 0.12
      })
    );
    glass.name = 'cert_frame_glass';
    glass.position.set(0, 0, 0.0185);

    group.add(glow, frame, mat, art, glass);
    return group;
  }

  private createCertificateTexture(accentColor: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const accent = new THREE.Color(accentColor).getStyle();

    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#fbfaf6');
    bg.addColorStop(1, '#f1eee6');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = accent;
    ctx.fillRect(38, 34, canvas.width - 76, 10);

    ctx.strokeStyle = 'rgba(52, 58, 70, 0.30)';
    ctx.lineWidth = 4;
    ctx.strokeRect(38, 34, canvas.width - 76, canvas.height - 68);

    ctx.fillStyle = 'rgba(46, 52, 61, 0.74)';
    ctx.fillRect(72, 78, 280, 12);
    ctx.fillStyle = 'rgba(46, 52, 61, 0.46)';
    ctx.fillRect(72, 104, 360, 8);

    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = `rgba(66, 73, 87, ${0.25 - i * 0.04})`;
      ctx.fillRect(72, 136 + i * 26, 280 + i * 18, 6);
    }

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(402, 220, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.beginPath();
    ctx.arc(402, 220, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(72, 78, 91, 0.52)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(72, 258);
    ctx.lineTo(244, 258);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  private createFrameGlowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.49;
    const g = ctx.createRadialGradient(cx, cy, radius * 0.08, cx, cy, radius);
    g.addColorStop(0, 'rgba(255,255,255,0.88)');
    g.addColorStop(0.32, 'rgba(188,166,255,0.5)');
    g.addColorStop(0.58, 'rgba(143,114,255,0.38)');
    g.addColorStop(0.82, 'rgba(111,86,223,0.2)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  private createRgbHexWallPanels(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'rgb_hex_wall_cluster';

    const faceGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.018, 6);
    faceGeo.rotateX(Math.PI / 2);
    const backGeo = new THREE.CylinderGeometry(0.119, 0.119, 0.01, 6);
    backGeo.rotateX(Math.PI / 2);

    const heartLayout: Array<[number, number]> = [
      [-0.5, 1], [0.5, 1],
      [-1, 0], [0, 0], [1, 0],
      [-0.5, -1], [0.5, -1]
    ];
    const facePalette = [0xff6b6b, 0xffc857, 0x5adf7f, 0x47d7ff, 0x5b8cff, 0x9f86ff, 0xff74d4];
    const backPalette = [0xbf4747, 0xbd903d, 0x3ea05b, 0x3393b0, 0x3f63b7, 0x6f5fb3, 0xbf539d];
    const hexSize = 0.105;
    const xStep = hexSize * Math.sqrt(3) * 1.0;
    const yStep = hexSize * 1.5 * 1.0;
    const points: Array<{ x: number; y: number }> = [];

    heartLayout.forEach(([x, y]) => {
      points.push({ x: x * xStep, y: y * yStep });
    });

    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));
    const centerX = (minX + maxX) * 0.5;
    const centerY = (minY + maxY) * 0.5;

    points.forEach((point, i) => {
      const faceHex = facePalette[i % facePalette.length];
      const backHex = backPalette[i % backPalette.length];
      const faceHsl = new THREE.Color(faceHex).getHSL({ h: 0, s: 0, l: 0 });
      const baseGlow = 0.34 + (i % 3) * 0.05;

      const back = new THREE.Mesh(
        backGeo,
        new THREE.MeshStandardMaterial({
          color: backHex,
          roughness: 0.7,
          metalness: 0.08,
          emissive: 0x6f56df,
          emissiveIntensity: 0
        })
      );
      back.name = `rgb_hex_back_${i}`;
      back.position.set(point.x - centerX + 0.017, point.y - centerY - 0.017, -0.002);
      back.castShadow = true;
      back.receiveShadow = true;

      const face = new THREE.Mesh(
        faceGeo,
        new THREE.MeshStandardMaterial({
          color: faceHex,
          roughness: 0.28,
          metalness: 0.06,
          emissive: faceHex,
          emissiveIntensity: baseGlow
        })
      );
      face.name = `rgb_hex_face_${i}`;
      face.position.set(point.x - centerX, point.y - centerY, 0.008);
      face.castShadow = true;
      face.receiveShadow = true;
      face.userData['baseHue'] = faceHsl.h;
      face.userData['baseSaturation'] = faceHsl.s;
      face.userData['baseIntensity'] = baseGlow;
      face.userData['phase'] = i * 0.42;
      face.userData['baseColorHex'] = faceHex;
      face.userData['baseEmissiveHex'] = faceHex;
      back.userData['baseColorHex'] = backHex;
      back.userData['baseEmissiveHex'] = backHex;

      const outline = new THREE.LineSegments(
        new THREE.EdgesGeometry(faceGeo),
        new THREE.LineBasicMaterial({
          color: 0x9a87d6,
          transparent: true,
          opacity: 0.82
        })
      );
      outline.name = `rgb_hex_outline_${i}`;
      outline.position.copy(face.position);
      outline.position.z += 0.001;
      outline.renderOrder = 3;

      group.add(back, face, outline);
    });

    group.position.set(-0.45, 1.74, -1.507);
    group.scale.setScalar(0.92);
    return group;
  }

  private setupHexGlowLights(office: THREE.Group): void {
    this.hexGlowLights.forEach((light) => office.remove(light));
    this.hexGlowLights = [];

    const makeGlow = (
      color: number,
      position: [number, number, number],
      distance: number,
      nightIntensity: number,
      phase: number
    ): void => {
      const light = new THREE.PointLight(color, nightIntensity, distance);
      light.position.set(...position);
      light.userData['nightIntensity'] = nightIntensity;
      light.userData['pulsePhase'] = phase;
      light.visible = false;
      office.add(light);
      this.hexGlowLights.push(light);
    };

    makeGlow(0x4cefff, [-0.62, 1.8, -1.35], 1.3, 0.14, 0.1);
    makeGlow(0x62f6ff, [-0.46, 1.72, -1.34], 1.24, 0.12, 0.85);
    makeGlow(0x43d9ff, [-0.28, 1.68, -1.33], 1.3, 0.13, 1.55);
  }

  private setupDoorHitbox(): void {
    const hitNames = ['door', 'puerta', 'doorknob', 'manija', 'pomelo'];
    if (this.houseGroup) {
      this.houseGroup.traverse((obj) => {
        const name = (obj.name || '').toLowerCase();
        if (hitNames.some(d => name.includes(d.toLowerCase()))) {
          this.doorMeshes.push(obj);
        }
      });
    }
    if (this.doorMeshes.length === 0) {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 0.8),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001 })
      );
      plane.position.set(0, 0.5, 1.5);
      plane.userData = { isDoor: true };
      this.scene.add(plane);
      this.doorMeshes.push(plane);
    }
  }

  private setupClick(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('pointerdown', this.canvasPointerDownHandler);
    canvas.addEventListener('pointerup', this.canvasPointerUpHandler);
    canvas.addEventListener('pointermove', this.canvasPointerMoveHandler);
    canvas.addEventListener('pointercancel', this.canvasPointerCancelHandler);
    canvas.addEventListener('mousemove', this.canvasMoveHandler);
    canvas.addEventListener('mouseleave', this.canvasLeaveHandler);
  }
  private onPointerDown(event: PointerEvent): void {
    if (this.state.currentSection() !== 'home') return;
    if (event.pointerType === 'touch') {
      this.dismissMobileGuideBanner();
    }
    this.setRayFromEvent(event);
    const postItHit = this.raycaster.intersectObjects(this.postItMeshes, true)[0];
    if (!postItHit) return;
    const group = postItHit.object.userData['postItGroup'] as THREE.Group | undefined;
    const dragPlane = group?.userData['postItDragPlane'] as THREE.Mesh | undefined;
    const boardData = group?.userData['postItBoardData'] as
      | {
          horizontalAxis: number;
          verticalAxis: number;
          depthAxis: number;
          center: THREE.Vector3;
          size: THREE.Vector3;
        }
      | undefined;
    const fixedDepth = group?.userData['postItFixedDepth'] as number | undefined;
    const noteWidth = group?.userData['postItNoteWidth'] as number | undefined;
    const noteHeight = group?.userData['postItNoteHeight'] as number | undefined;
    if (!group || !dragPlane || !boardData || fixedDepth === undefined || noteWidth === undefined || noteHeight === undefined) return;

    this.clearHoverFeedback();
    this.controls.enabled = false;
    this.renderer.domElement.style.cursor = 'grabbing';
    const groupWorldPos = group.getWorldPosition(new THREE.Vector3());
    this.activePostItDrag = {
      pointerId: event.pointerId,
      group,
      dragPlane,
      boardData,
      fixedDepth,
      noteWidth,
      noteHeight,
      offset: groupWorldPos.sub(postItHit.point),
      startClientX: event.clientX,
      startClientY: event.clientY,
      moved: false
    };
    this.renderer.domElement.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  private onPointerDrag(event: PointerEvent): void {
    if (!this.activePostItDrag) return;
    if (event.pointerId !== this.activePostItDrag.pointerId) return;
    this.setRayFromEvent(event);

    const dragHit = this.raycaster.intersectObject(this.activePostItDrag.dragPlane, true)[0];
    if (!dragHit) return;
    const drag = this.activePostItDrag;
    const pointerDist = Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY);
    if (pointerDist > 3) drag.moved = true;

    const parent = drag.group.parent;
    if (!parent) return;

    const newWorldPos = dragHit.point.clone().add(drag.offset);
    const newLocalPos = parent.worldToLocal(newWorldPos);

    const getComp = (v: THREE.Vector3, axis: number): number => (axis === 0 ? v.x : axis === 1 ? v.y : v.z);
    const setComp = (v: THREE.Vector3, axis: number, value: number): void => {
      if (axis === 0) v.x = value;
      else if (axis === 1) v.y = value;
      else v.z = value;
    };

    const halfW = drag.noteWidth * 0.52;
    const halfH = drag.noteHeight * 0.52;
    const hAxis = drag.boardData.horizontalAxis;
    const vAxis = drag.boardData.verticalAxis;
    const dAxis = drag.boardData.depthAxis;
    const center = drag.boardData.center;
    const size = drag.boardData.size;
    const hMin = getComp(center, hAxis) - getComp(size, hAxis) * 0.5 + halfW;
    const hMax = getComp(center, hAxis) + getComp(size, hAxis) * 0.5 - halfW;
    const vMin = getComp(center, vAxis) - getComp(size, vAxis) * 0.5 + halfH;
    const vMax = getComp(center, vAxis) + getComp(size, vAxis) * 0.5 - halfH;

    setComp(newLocalPos, hAxis, THREE.MathUtils.clamp(getComp(newLocalPos, hAxis), hMin, hMax));
    setComp(newLocalPos, vAxis, THREE.MathUtils.clamp(getComp(newLocalPos, vAxis), vMin, vMax));
    setComp(newLocalPos, dAxis, drag.fixedDepth);
    drag.group.position.copy(newLocalPos);
    event.preventDefault();
  }

  private endPostItDrag(event: PointerEvent): boolean {
    const drag = this.activePostItDrag;
    if (!drag) return false;
    if (event.pointerId !== drag.pointerId) return true;
    this.activePostItDrag = null;
    this.controls.enabled = true;
    this.renderer.domElement.style.cursor = 'grab';
    if (this.renderer.domElement.hasPointerCapture(event.pointerId)) {
      this.renderer.domElement.releasePointerCapture(event.pointerId);
    }
    if (drag.moved) {
      this.suppressNextClick = true;
    }
    return true;
  }

  private onPointerUp(event: PointerEvent): void {
    if (this.endPostItDrag(event)) return;
    this.onClick(event);
  }

  private onPointerCancel(event: PointerEvent): void {
    void this.endPostItDrag(event);
  }


  private setRayFromEvent(event: Pick<MouseEvent, 'clientX' | 'clientY'>): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
  }

  private getInteractiveGroups(): Array<{
    section: 'switch' | 'sobre-mi' | 'proyectos' | 'hobbies' | 'certificaciones' | 'contacto' | 'door';
    meshes: THREE.Object3D[];
  }> {
    return [
      {
        section: 'switch',
        meshes: this.switchMeshes
      },
      {
        section: 'sobre-mi',
        meshes: this.aboutMeshes
      },
      {
        section: 'proyectos',
        meshes: this.projectMeshes
      },
      {
        section: 'hobbies',
        meshes: this.hobbyMeshes
      },
      {
        section: 'certificaciones',
        meshes: this.certificationsMeshes
      },
      {
        section: 'contacto',
        meshes: this.contactMeshes
      }
    ];
  }

  private getClosestInteractiveHit(
    groups: Array<{
      section: 'switch' | 'sobre-mi' | 'proyectos' | 'hobbies' | 'certificaciones' | 'contacto' | 'door';
      meshes: THREE.Object3D[];
    }>
  ): {
    section: 'switch' | 'sobre-mi' | 'proyectos' | 'hobbies' | 'certificaciones' | 'contacto' | 'door';
    hit: THREE.Intersection<THREE.Object3D>;
  } | null {
    let closestDistance = Number.POSITIVE_INFINITY;
    let closest: {
      section: 'switch' | 'sobre-mi' | 'proyectos' | 'hobbies' | 'certificaciones' | 'contacto' | 'door';
      hit: THREE.Intersection<THREE.Object3D>;
    } | null = null;

    groups.forEach(({ section, meshes }) => {
      const hit = this.raycaster.intersectObjects(meshes, true)[0];
      if (!hit) return;
      if (hit.distance < closestDistance) {
        closestDistance = hit.distance;
        closest = { section, hit };
      }
    });

    return closest;
  }

  private sectionLabel(section: 'switch' | 'sobre-mi' | 'proyectos' | 'hobbies' | 'certificaciones' | 'contacto' | 'door'): string {
    switch (section) {
      case 'switch': return 'Interruptor: cambiar dia/noche';
      case 'sobre-mi': return 'Pizarra: ir a Sobre mi';
      case 'proyectos': return 'PC: ver Proyectos';
      case 'hobbies': return 'Tocadiscos: ver Hobbies';
      case 'certificaciones': return 'Cuadros: ver Certificaciones';
      case 'contacto': return 'Telefono: ir a Contacto';
      case 'door': return 'Puerta: entrar';
      default: return 'Objeto interactivo';
    }
  }

  private updateHoverMarker(hit: THREE.Intersection<THREE.Object3D>): void {
    if (!this.hoverMarker) return;
    this.hoverMarker.visible = true;
    this.hoverMarker.position.copy(hit.point);
    this.hoverMarker.position.y += 0.02;
  }

  private clearHoverFeedback(): void {
    this.hoverTooltip.set(null);
    if (this.hoverMarker) this.hoverMarker.visible = false;
  }

  private onPointerMove(event: MouseEvent): void {
    if (this.activePostItDrag) return;
    this.setRayFromEvent(event);
    const closest = this.getClosestInteractiveHit(this.getInteractiveGroups());
    if (!closest) {
      this.renderer.domElement.style.cursor = 'grab';
      this.clearHoverFeedback();
      return;
    }

    this.renderer.domElement.style.cursor = 'pointer';
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.hoverTooltip.set({
      label: this.sectionLabel(closest.section),
      x: event.clientX - rect.left,
      y: event.clientY - rect.top - 8
    });
    this.updateHoverMarker(closest.hit);
    this.dismissMobileGuideBanner();
  }

  private onPointerLeave(): void {
    if (this.activePostItDrag) return;
    this.renderer.domElement.style.cursor = 'grab';
    this.clearHoverFeedback();
  }

  private getClosestSectionHit(
    groups: Array<{
      section: 'switch' | 'sobre-mi' | 'proyectos' | 'hobbies' | 'certificaciones' | 'contacto' | 'door';
      meshes: THREE.Object3D[];
    }>
  ): 'switch' | 'sobre-mi' | 'proyectos' | 'hobbies' | 'certificaciones' | 'contacto' | 'door' | null {
    let closestDistance = Number.POSITIVE_INFINITY;
    let closestSection: 'switch' | 'sobre-mi' | 'proyectos' | 'hobbies' | 'certificaciones' | 'contacto' | 'door' | null = null;

    groups.forEach(({ section, meshes }) => {
      const hit = this.raycaster.intersectObjects(meshes, true)[0];
      if (!hit) return;
      if (hit.distance < closestDistance) {
        closestDistance = hit.distance;
        closestSection = section;
      }
    });

    return closestSection;
  }

  private onClick(event: Pick<MouseEvent, 'clientX' | 'clientY'>): void {
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return;
    }
    this.setRayFromEvent(event);

    const sectionHit = this.getClosestSectionHit(this.getInteractiveGroups());

    if (!sectionHit) return;
    this.dismissMobileGuideBanner();

    if (sectionHit === 'switch') {
      void this.transition.run(
        {
          kind: 'theme',
          label: 'Ajustando luces de la escena...',
          minVisibleMs: 420,
          startTaskDelayMs: 180
        },
        async () => {
          this.state.toggleLightMode();
          await this.wait(140);
        }
      );
      return;
    }
    if (sectionHit === 'sobre-mi') {
      this.state.requestNeonSignZoom();
      return;
    }
    if (sectionHit === 'door') {
      if (!this.state.hasEnteredHouse()) {
        void this.transition.run(
          {
            kind: 'door',
            label: 'Entrando a la oficina...',
            minVisibleMs: 620
          },
          async () => {
            this.state.enterHouse();
            await this.wait(240);
          }
        );
      }
      return;
    }

    this.state.setSection(sectionHit);
  }

  private animateCameraTo(section: string): void {
    const config = CAMERA_POSITIONS[section as keyof typeof CAMERA_POSITIONS];
    if (!config) return;
    const responsiveConfig = this.getResponsiveCameraTarget(config, section === 'home' ? 'home' : 'default');

    this.isZoomingToNeonSign = false;
    this.neonSignZoomPhase = 1;
    this.cameraTarget.pos.set(...responsiveConfig.position);
    this.cameraTarget.lookAt.set(...responsiveConfig.target);
    this.isAnimating = true;
  }

  private animateCameraToDoor(): void {
    const responsiveConfig = this.getResponsiveCameraTarget(DOOR_CAMERA, 'door');
    this.isZoomingToNeonSign = false;
    this.neonSignZoomPhase = 1;
    this.cameraTarget.pos.set(...responsiveConfig.position);
    this.cameraTarget.lookAt.set(...responsiveConfig.target);
    this.isAnimating = true;
  }

  private animateCameraToNeonSign(): void {
    if (this.state.neonSignZoomRequested()) {
      const waypoint = this.getResponsiveCameraTarget(NEON_SIGN_WAYPOINT);
      this.isZoomingToNeonSign = true;
      this.neonSignZoomPhase = 1;
      this.cameraTarget.pos.set(...waypoint.position);
      this.cameraTarget.lookAt.set(...waypoint.target);
    } else {
      const neonCamera = this.getResponsiveCameraTarget(NEON_SIGN_CAMERA);
      this.cameraTarget.pos.set(...neonCamera.position);
      this.cameraTarget.lookAt.set(...neonCamera.target);
    }
    this.isAnimating = true;
  }

  private updateCameraAnimation(): void {
    if (!this.isAnimating) return;

    if (this.isZoomingToNeonSign) this.controls.enabled = false;

    const distance = this.camera.position.distanceTo(this.cameraTarget.pos);
    const speed = THREE.MathUtils.clamp(distance * 0.12, 0.03, 0.09);
    this.camera.position.lerp(this.cameraTarget.pos, speed);
    this.controls.target.lerp(this.cameraTarget.lookAt, speed);

    const dist = this.camera.position.distanceTo(this.cameraTarget.pos);
    if (dist < 0.02) {
      this.camera.position.copy(this.cameraTarget.pos);
      this.controls.target.copy(this.cameraTarget.lookAt);
      if (this.isZoomingToNeonSign && this.neonSignZoomPhase === 1) {
        const neonCamera = this.getResponsiveCameraTarget(NEON_SIGN_CAMERA);
        this.neonSignZoomPhase = 2;
        this.cameraTarget.pos.set(...neonCamera.position);
        this.cameraTarget.lookAt.set(...neonCamera.target);
      } else {
        this.isAnimating = false;
        this.controls.enabled = true;
        if (this.isZoomingToNeonSign && this.state.neonSignZoomRequested()) {
          this.isZoomingToNeonSign = false;
          setTimeout(() => this.state.enterNeonSign(), 350);
        }
      }
    }
  }

  private applyLightMode(mode: 'day' | 'night'): void {
    if (!this.scene) return;

    if (mode === 'day') {
      this.scene.background = new THREE.Color(0xeef2e8);
      this.scene.fog = null;
      this.ambientLight.color.setHex(theme.sceneLightDay);
      this.ambientLight.intensity = 0.68;
      this.directionalLight.color.setHex(theme.sceneLightDay);
      this.directionalLight.intensity = 0.9;
      this.fillLight.color.setHex(theme.sceneFillDay);
      this.fillLight.intensity = 0.24;
      this.deskKeyLight.color.setHex(0xfff1db);
      this.deskKeyLight.intensity = 0.8;
      this.deskKeyLight.shadow.normalBias = 0.032;
      this.warmSideLight.color.setHex(0xffddb8);
      this.warmSideLight.intensity = 0.24;
      this.rgbLights.forEach(l => l.visible = false);
      this.hexGlowLights.forEach((l) => {
        l.visible = false;
        l.intensity = 0;
      });
      this.accentLights.forEach((l) => {
        l.visible = false;
        l.intensity = 0;
      });
      this.applyDessertNeon(false);
      this.renderer.toneMappingExposure = 1.2;
      this.applyOfficePalette('day');
    } else {
      this.scene.background = new THREE.Color(theme.sceneBgNight);
      this.scene.fog = null;
      this.ambientLight.color.setHex(0x0d3440);
      this.ambientLight.intensity = 0.5;
      this.directionalLight.color.setHex(0x0f3f49);
      this.directionalLight.intensity = 0.58;
      this.fillLight.color.setHex(0x0b5562);
      this.fillLight.intensity = 0.34;
      this.deskKeyLight.color.setHex(0x84ffff);
      this.deskKeyLight.intensity = 0.86;
      this.deskKeyLight.shadow.normalBias = 0.028;
      this.warmSideLight.color.setHex(0x32ebff);
      this.warmSideLight.intensity = 0.46;
      this.createRgbLights();
      this.hexGlowLights.forEach((l) => {
        l.visible = true;
        l.intensity = (l.userData['nightIntensity'] as number) ?? 0;
      });
      this.accentLights.forEach((l) => {
        l.visible = true;
        l.intensity = (l.userData['nightIntensity'] as number) ?? 0;
      });
      this.applyDessertNeon(true);
      this.renderer.toneMappingExposure = theme.nightExposure;
      this.applyOfficePalette('night');
    }
    this.visualLightMode = mode;
  }

  private applyOfficePalette(mode: 'day' | 'night'): void {
    if (!this.houseGroup) return;
    this.houseGroup.traverse((obj) => {
      const name = (obj.name || '').toLowerCase();

      if (obj instanceof THREE.LineSegments && name.includes('rgb_hex_outline')) {
        const lineMat = obj.material as THREE.LineBasicMaterial;
        lineMat.color.setHex(mode === 'day' ? 0xa694dc : 0x50f3dc);
        lineMat.opacity = mode === 'day' ? 0.86 : 0.52;
        lineMat.transparent = true;
        lineMat.needsUpdate = true;
        return;
      }

      if (!(obj instanceof THREE.Mesh)) return;
      const mat = obj.material as THREE.MeshStandardMaterial;

      if (name.includes('led_strip_back')) {
        mat.transparent = mode === 'day';
        mat.opacity = mode === 'day' ? 0.16 : 1;
        mat.color.setHex(mode === 'day' ? 0xf3f0ff : 0xd8fff6);
        mat.emissive.setHex(mode === 'day' ? 0xede9ff : 0x31ffd8);
        mat.emissiveIntensity = mode === 'day' ? 0.05 : 0;
      } else if (name.includes('led_strip_left')) {
        mat.transparent = mode === 'day';
        mat.opacity = mode === 'day' ? 0.14 : 1;
        mat.color.setHex(mode === 'day' ? 0xf3f0ff : 0xddfbff);
        mat.emissive.setHex(mode === 'day' ? 0xe9e2ff : 0x40e8ff);
        mat.emissiveIntensity = mode === 'day' ? 0.04 : 0.95;
      } else if (name.includes('led_strip_right')) {
        mat.transparent = mode === 'day';
        mat.opacity = mode === 'day' ? 0.14 : 1;
        mat.color.setHex(mode === 'day' ? 0xeee9ff : 0xddfbff);
        mat.emissive.setHex(mode === 'day' ? 0xdfd5ff : 0x40e8ff);
        mat.emissiveIntensity = mode === 'day' ? 0.04 : 0.95;
      } else if (name.includes('led_desk_front')) {
        mat.transparent = mode === 'day';
        mat.opacity = mode === 'day' ? 0 : 0.25;
        mat.color.setHex(mode === 'day' ? 0xf4eeff : 0xd6fbff);
        mat.emissive.setHex(mode === 'day' ? 0xc9b6ff : 0x4cefff);
        mat.emissiveIntensity = mode === 'day' ? 0 : 0.52;
      } else if (name.includes('led_desk_side')) {
        mat.transparent = mode === 'day';
        mat.opacity = mode === 'day' ? 0 : 0.25;
        mat.color.setHex(mode === 'day' ? 0xf4eeff : 0xd4f8ff);
        mat.emissive.setHex(mode === 'day' ? 0xd1c1ff : 0x5befff);
        mat.emissiveIntensity = mode === 'day' ? 0 : 0.5;
      } else if (name.includes('led_shelf_top')) {
        mat.transparent = mode === 'day';
        mat.opacity = mode === 'day' ? 0 : 0.25;
        mat.color.setHex(mode === 'day' ? 0xf3ecff : 0xd8faff);
        mat.emissive.setHex(mode === 'day' ? 0xc9b6ff : 0x3feaff);
        mat.emissiveIntensity = mode === 'day' ? 0 : 0.5;
      } else if (name.includes('rgb_lamp_tube')) {
        mat.color.setHex(mode === 'day' ? 0xdce3ee : 0xfef3ff);
        mat.emissive.setHex(mode === 'day' ? 0x000000 : 0x58ffe0);
        mat.emissiveIntensity = mode === 'day' ? 0 : 1.28;
      } else if (
        name.includes('rgb_lamp_base') ||
        name.includes('rgb_lamp_stem') ||
        name.includes('rgb_lamp_hub') ||
        name.includes('rgb_lamp_foot')
      ) {
        mat.color.setHex(mode === 'day' ? 0xcfd8e6 : 0x1b2030);
      } else if (name.includes('rgb_hex_face')) {
        const dayColor = (obj.userData['baseColorHex'] as number) ?? 0xf0e8ff;
        const dayEmissive = (obj.userData['baseEmissiveHex'] as number) ?? 0xc88ce8;
        const idxMatch = name.match(/rgb_hex_face_(\d+)/);
        const idx = idxMatch ? Number.parseInt(idxMatch[1] ?? '0', 10) : 0;
        const nightFacePalette = [0x79f8ff, 0x63f2ff, 0x58f8ff, 0x3ed6ff, 0x6ceeff, 0x68f5ff, 0x90f9ff];
        const nightFaceEmissive = [0x42eeff, 0x35e7ff, 0x23e9ff, 0x16bbff, 0x2de0ff, 0x31eeff, 0x54f1ff];
        const baseColor = mode === 'day' ? dayColor : nightFacePalette[idx % nightFacePalette.length]!;
        const baseEmissive = mode === 'day' ? dayEmissive : nightFaceEmissive[idx % nightFaceEmissive.length]!;
        mat.color.setHex(baseColor);
        mat.emissive.setHex(baseEmissive);
        mat.emissiveIntensity = mode === 'day' ? 0.09 : 0.42;
      } else if (name.includes('rgb_hex_back')) {
        const dayColor = (obj.userData['baseColorHex'] as number) ?? 0xc4bfdc;
        const dayEmissive = (obj.userData['baseEmissiveHex'] as number) ?? 0x6f6a9e;
        const idxMatch = name.match(/rgb_hex_back_(\d+)/);
        const idx = idxMatch ? Number.parseInt(idxMatch[1] ?? '0', 10) : 0;
        const nightBackPalette = [0x183f52, 0x18475a, 0x1a4c63, 0x1e5570, 0x206182, 0x1a4f68, 0x1f5a74];
        const nightBackEmissive = [0x2ec7ff, 0x2abfff, 0x2aaeea, 0x29a3e6, 0x2db4f0, 0x2ac2ff, 0x31c8ff];
        const baseColor = mode === 'day' ? dayColor : nightBackPalette[idx % nightBackPalette.length]!;
        const baseEmissive = mode === 'day' ? dayEmissive : nightBackEmissive[idx % nightBackEmissive.length]!;
        mat.color.setHex(baseColor);
        mat.emissive.setHex(baseEmissive);
        mat.emissiveIntensity = mode === 'day' ? 0.06 : 0.1;
      } else if (name.includes('about_board') || name.includes('whiteboard') || name.includes('pizarra')) {
        mat.color.setHex(mode === 'day' ? 0xffffff : 0x707894);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
        mat.roughness = mode === 'day' ? 0.84 : 0.8;
        mat.metalness = 0.03;
      } else if (name.includes('postit_note')) {
        mat.color.setHex(mode === 'day' ? 0xffea70 : 0xf7dd64);
        mat.emissive.setHex(mode === 'day' ? 0x000000 : 0xb88f1f);
        mat.emissiveIntensity = mode === 'day' ? 0 : 0.25;
      } else if (name.includes('postit_pin')) {
        mat.color.setHex(mode === 'day' ? 0xe33a3a : 0xff5f5f);
        mat.emissive.setHex(mode === 'day' ? 0x000000 : 0x8a1d1d);
        mat.emissiveIntensity = mode === 'day' ? 0 : 0.2;
      } else if (name.includes('left_window_frame')) {
        mat.color.setHex(mode === 'day' ? 0xe6edf8 : 0x3d4a64);
      } else if (name.includes('left_window_glass')) {
        mat.color.setHex(mode === 'day' ? 0xcfddec : 0x4a5e83);
        mat.emissive.setHex(mode === 'day' ? 0x000000 : 0x20344f);
        mat.emissiveIntensity = mode === 'day' ? 0 : 0.03;
        mat.roughness = mode === 'day' ? 0.54 : 0.5;
        mat.transparent = true;
        mat.opacity = mode === 'day' ? 0.14 : 0.18;
        mat.depthWrite = false;
      } else if (name.includes('left_window_cross')) {
        mat.color.setHex(mode === 'day' ? 0xd5deed : 0x4c5975);
      } else if (name.includes('contact_shadow')) {
        mat.color.setHex(mode === 'day' ? 0x3b4351 : 0x11182a);
        mat.transparent = true;
        mat.opacity = mode === 'day' ? 0.18 : 0.24;
        mat.depthWrite = false;
      } else if (name.includes('monitor_overlay_frame')) {
        mat.color.setHex(mode === 'day' ? 0x111722 : 0x0a101b);
      } else if (name.includes('monitor_overlay_screen')) {
        mat.color.setHex(mode === 'day' ? 0xe8e3ff : 0xb8fff2);
        mat.emissive.setHex(mode === 'day' ? 0x8f72ff : 0x53ffdf);
        mat.emissiveIntensity = mode === 'day' ? 0.18 : 0.4;
        mat.roughness = mode === 'day' ? 0.3 : 0.2;
      } else if (name.includes('back_wall')) {
        mat.color.setHex(mode === 'day' ? 0xd4e0cf : 0x1a2f3d);
      } else if (name.includes('wall') || name.includes('column')) {
        mat.color.setHex(mode === 'day' ? 0xe1eadb : 0x213848);
      } else if (name.includes('floor')) {
        mat.color.setHex(mode === 'day' ? 0xcab69a : 0x1d1b28);
      } else if (name.includes('rug')) {
        mat.color.setHex(mode === 'day' ? 0xecf0e6 : 0xd5e4de);
        mat.roughness = mode === 'day' ? 0.95 : 0.9;
      } else if (name.includes('mate_gourd')) {
        mat.color.setHex(mode === 'day' ? 0x7e5b3d : 0x614531);
        mat.roughness = mode === 'day' ? 0.84 : 0.8;
        mat.metalness = 0.04;
        mat.emissive.setHex(mode === 'day' ? 0x000000 : 0x1a120c);
        mat.emissiveIntensity = mode === 'day' ? 0 : 0.03;
      } else if (name.includes('desk')) {
        mat.color.setHex(mode === 'day' ? 0xd6dde8 : 0x3c4764);
      } else if (name.includes('chair')) {
        mat.color.setHex(mode === 'day' ? 0x1f6f78 : 0x174f56);
      } else if (name.includes('turntable_shelf') || name.includes('shelf')) {
        mat.color.setHex(mode === 'day' ? 0x0b0c0f : 0x050608);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      } else if (name.includes('frame_rgb_glow')) {
        const glowMat = mat as unknown as THREE.MeshBasicMaterial;
        glowMat.color.setHex(mode === 'day' ? 0xf5c8a4 : 0x67ffe4);
        glowMat.transparent = true;
        glowMat.opacity = mode === 'day' ? 0 : 0.13;
      } else if (name.includes('cert_frame_border')) {
        mat.color.setHex(mode === 'day' ? 0x6d5745 : 0x3f5d57);
      } else if (name.includes('cert_frame_mat')) {
        mat.color.setHex(mode === 'day' ? 0xf4f0e8 : 0xd9d6cf);
      } else if (name.includes('cert_frame_art')) {
        mat.color.setHex(mode === 'day' ? 0xffffff : 0xe9edf8);
        mat.emissive.setHex(mode === 'day' ? 0x000000 : 0x1a4038);
        mat.emissiveIntensity = mode === 'day' ? 0 : 0.12;
      } else if (name.includes('cert_frame_glass')) {
        mat.color.setHex(mode === 'day' ? 0xffffff : 0xc9d8f2);
        mat.transparent = true;
        mat.opacity = mode === 'day' ? 0.12 : 0.08;
      } else if (name.includes('frame')) {
        mat.color.setHex(mode === 'day' ? 0xfcfcfd : 0x434d6a);
      }

      if (name.includes('monitor_overlay_screen')) {
        mat.emissiveIntensity = mode === 'day' ? 0.2 : 0.46;
      } else if (name.includes('monitor') || (name.includes('about') && !name.includes('board'))) {
        mat.emissiveIntensity = mode === 'day' ? 0.12 : 0.42;
      }
    });
  }

  private applyDessertNeon(enable: boolean): void {
    if (!this.houseGroup) return;
    const dessertKeywords = ['cake', 'pastel', 'torta', 'chocolate', 'dessert', 'postre', 'pie', 'candy', 'cherry'];
    const excludeKeywords = ['vert', 'cone', 'wall', 'plane', 'area', 'shelf', 'stool', 'counter', 'ice'];
    const neonColor = theme.dessertNeon;

    this.houseGroup.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh) || !obj.material) return;
      let name = (obj.name || '').toLowerCase();
      let p: THREE.Object3D | null = obj.parent;
      while (p) { name += ' ' + (p.name || '').toLowerCase(); p = p.parent; }
      const isDessert = dessertKeywords.some(k => name.includes(k));
      const isExcluded = excludeKeywords.some(k => name.includes(k));
      if (!isDessert || isExcluded) return;

      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial;
        if (enable) {
          mat.emissive = new THREE.Color(neonColor);
          mat.emissiveIntensity = 0.9;
        } else {
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      });
    });
  }

  private createRgbLights(): void {
    this.rgbLights.forEach(l => this.scene!.remove(l));
    this.rgbLights = [];

    const { pink, cyan, mint, yellow, purple } = theme.neonLights;
    const colors = [pink, cyan, mint, yellow, purple];
    const positions = [
      [1.4, 1.95, -0.1],
      [-1.35, 1.95, -0.05],
      [0.2, 0.72, 1.25],
      [1.6, 0.55, -0.95],
      [-1.65, 0.65, 0.95]
    ];
    colors.forEach((color, i) => {
      const light = new THREE.PointLight(color, 0.74, 4.8);
      light.position.set(positions[i][0] as number, positions[i][1] as number, positions[i][2] as number);
      light.userData['baseIntensity'] = 0.74;
      light.userData['phase'] = i * 0.8;
      this.scene!.add(light);
      this.rgbLights.push(light);
    });
  }

  private createRgbFloorLamp(): THREE.Group {
    const lamp = new THREE.Group();
    lamp.name = 'rgb_floor_lamp';

    const lampHeight = 1.5;
    const legLength = 0.39;
    const hubHeight = 0.018;
    const stemRadius = 0.009;
    const tubeHeight = lampHeight - 0.04;
    const baseY = hubHeight * 0.5;

    const footMat = new THREE.MeshStandardMaterial({ color: 0x222834, roughness: 0.55, metalness: 0.4 });
    const footLeft = new THREE.Mesh(
      new THREE.BoxGeometry(legLength, 0.012, 0.018),
      footMat
    );
    footLeft.position.set(-legLength * 0.41, 0.006, legLength * 0.205);
    footLeft.rotation.y = Math.PI / 3;
    footLeft.name = 'rgb_lamp_foot_left';

    const footRight = new THREE.Mesh(
      new THREE.BoxGeometry(legLength, 0.012, 0.018),
      footMat
    );
    footRight.position.set(legLength * 0.41, 0.006, legLength * 0.205);
    footRight.rotation.y = -Math.PI / 3;
    footRight.name = 'rgb_lamp_foot_right';

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, hubHeight, 12),
      new THREE.MeshStandardMaterial({ color: 0x212733, roughness: 0.5, metalness: 0.4 })
    );
    hub.position.set(0, baseY, 0);
    hub.name = 'rgb_lamp_hub';

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(stemRadius, stemRadius, lampHeight, 14),
      new THREE.MeshStandardMaterial({ color: 0x232937, roughness: 0.4, metalness: 0.5 })
    );
    stem.position.set(0, baseY + lampHeight * 0.5, 0);
    stem.name = 'rgb_lamp_stem';

    const tube = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, tubeHeight, 0.02),
      new THREE.MeshStandardMaterial({
        color: 0x2a2f3a,
        roughness: 0.22,
        metalness: 0.05,
        emissive: 0x8f72ff,
        emissiveIntensity: 0
      })
    );
    tube.position.set(0, baseY + lampHeight * 0.5, 0.001);
    tube.name = 'rgb_lamp_tube';
    lamp.add(footLeft, footRight, hub, stem, tube);
    lamp.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    return lamp;
  }

  private createLeftWallWindow(): THREE.Group {
    const windowGroup = new THREE.Group();
    windowGroup.name = 'left_wall_window';
    windowGroup.position.set(-1.92, 1.3, -0.94);
    windowGroup.rotation.y = Math.PI / 2;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.9, 0.72),
      new THREE.MeshStandardMaterial({ color: 0xe6edf8, roughness: 0.58, metalness: 0.12 })
    );
    frame.name = 'left_window_frame';
    frame.castShadow = true;
    frame.receiveShadow = true;

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.64, 0.82),
      new THREE.MeshStandardMaterial({
        color: 0xcfddec,
        roughness: 0.52,
        metalness: 0.02,
        emissive: 0x000000,
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0.14,
        depthWrite: false
      })
    );
    glass.name = 'left_window_glass';
    glass.position.set(0.012, 0, 0);

    const crossMat = new THREE.MeshStandardMaterial({ color: 0xd5deed, roughness: 0.55, metalness: 0.05 });
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.78, 0.02), crossMat);
    crossV.name = 'left_window_cross_vertical';
    crossV.position.set(0.012, 0, 0);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.02, 0.58), crossMat);
    crossH.name = 'left_window_cross_horizontal';
    crossH.position.set(0.012, 0, 0);

    windowGroup.add(frame, glass, crossV, crossH);
    return windowGroup;
  }

  private setupVisitorCounterSign(): void {
    if (this.visitorCounterSign || !this.scene) return;

    const signGroup = new THREE.Group();
    signGroup.name = 'secret_counter_sign';
    signGroup.position.set(-1.9, 1.5, -0.3);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.visitorCounterCanvas = canvas;
      this.visitorCounterCtx = ctx;
      this.visitorCounterTexture = new THREE.CanvasTexture(canvas);
      this.visitorCounterTexture.colorSpace = THREE.SRGBColorSpace;
      this.visitorCounterTexture.minFilter = THREE.LinearFilter;
      this.visitorCounterTexture.magFilter = THREE.LinearFilter;
    }

    const textMaterial = new THREE.MeshBasicMaterial({
      map: this.visitorCounterTexture ?? undefined,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false
    });
    this.visitorCounterFaceMaterial = textMaterial;
    this.visitorCounterGlowMaterial = null;

    const textFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.17),
      textMaterial
    );
    textFace.name = 'secret_counter_neon_face';
    textFace.position.z = 0.003;
    signGroup.add(textFace);

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d2436,
      roughness: 0.34,
      metalness: 0.52,
      emissive: 0x4f3b63,
      emissiveIntensity: 0.26
    });
    const outerWidth = 0.72;
    const outerHeight = 0.25;
    const borderThickness = 0.018;
    const halfW = outerWidth * 0.5;
    const halfH = outerHeight * 0.5;

    const topBorder = new THREE.Mesh(new THREE.PlaneGeometry(outerWidth, borderThickness), frameMaterial);
    topBorder.name = 'secret_counter_border_top';
    topBorder.position.set(0, halfH - borderThickness * 0.5, 0.0015);

    const bottomBorder = new THREE.Mesh(new THREE.PlaneGeometry(outerWidth, borderThickness), frameMaterial);
    bottomBorder.name = 'secret_counter_border_bottom';
    bottomBorder.position.set(0, -halfH + borderThickness * 0.5, 0.0015);

    const sideHeight = outerHeight - borderThickness * 2;
    const leftBorder = new THREE.Mesh(new THREE.PlaneGeometry(borderThickness, sideHeight), frameMaterial);
    leftBorder.name = 'secret_counter_border_left';
    leftBorder.position.set(-halfW + borderThickness * 0.5, 0, 0.0015);

    const rightBorder = new THREE.Mesh(new THREE.PlaneGeometry(borderThickness, sideHeight), frameMaterial);
    rightBorder.name = 'secret_counter_border_right';
    rightBorder.position.set(halfW - borderThickness * 0.5, 0, 0.0015);

    signGroup.add(topBorder, bottomBorder, leftBorder, rightBorder);

    this.visitorCounterSign = signGroup;
    this.scene.add(signGroup);
    this.positionVisitorCounterSignNearBoard();
    this.updateVisitorCounterSignTexture(this.visitorCounter.count());
  }

  private positionVisitorCounterSignNearBoard(): void {
    if (!this.visitorCounterSign || this.aboutMeshes.length === 0) return;
    const board = this.aboutMeshes[0];
    if (!board) return;

    const box = new THREE.Box3().setFromObject(board);
    if (!Number.isFinite(box.min.x) || !Number.isFinite(box.min.y) || !Number.isFinite(box.min.z)) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const up = new THREE.Vector3(0, 1, 0);

    const dims = [size.x, size.y, size.z];
    const minAxis = dims.indexOf(Math.min(...dims));
    const normal = new THREE.Vector3(
      minAxis === 0 ? 1 : 0,
      minAxis === 1 ? 1 : 0,
      minAxis === 2 ? 1 : 0
    );
    if (normal.lengthSq() === 0) {
      normal.set(1, 0, 0);
    }

    const toCamera = this.camera.position.clone().sub(center).normalize();
    if (normal.dot(toCamera) < 0) {
      normal.multiplyScalar(-1);
    }

    const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const projectedRight = cameraRight.clone().sub(normal.clone().multiplyScalar(cameraRight.dot(normal)));
    const boardRight = projectedRight.lengthSq() > 0.0001
      ? projectedRight.normalize()
      : new THREE.Vector3().crossVectors(up, normal).normalize();

    const rightOffset = Math.max(size.x, size.z) * 0.52;
    const yOffset = size.y * 0.76;
    const frontOffset = 0.015;

    const anchor = center
      .clone()
      .add(boardRight.multiplyScalar(rightOffset))
      .add(normal.clone().multiplyScalar(frontOffset));
    anchor.y += yOffset;

    this.visitorCounterSign.position.copy(anchor);
    this.visitorCounterSign.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  }

  private updateVisitorCounterSignTexture(count: number | null): void {
    if (!this.visitorCounterCtx || !this.visitorCounterCanvas || !this.visitorCounterTexture) return;
    const ctx = this.visitorCounterCtx;
    const { width, height } = this.visitorCounterCanvas;

    ctx.clearRect(0, 0, width, height);

    const label = this.formatVisitorCounterLabel(count);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 178px "Arial", "Helvetica", sans-serif';

    ctx.shadowColor = 'rgba(255, 28, 133, 0.92)';
    ctx.shadowBlur = 44;
    ctx.fillStyle = '#ff4fa2';
    ctx.fillText(label, width / 2, height / 2 + 4);

    ctx.shadowColor = 'rgba(255, 140, 196, 0.9)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff8fcb';
    ctx.fillText(label, width / 2, height / 2 + 4);

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 233, 245, 0.95)';
    ctx.fillText(label, width / 2, height / 2 + 4);

    this.visitorCounterTexture.needsUpdate = true;
  }

  private formatVisitorCounterLabel(count: number | null): string {
    const safeCount = typeof count === 'number' && Number.isFinite(count) && count >= 0
      ? Math.floor(count)
      : 0;
    if (safeCount < 1000) {
      return safeCount.toString().padStart(3, '0');
    }

    return safeCount.toLocaleString('es-ES').replace(/\./g, ' ');
  }

  private addContactShadow(
    office: THREE.Group,
    position: [number, number, number],
    size: [number, number],
    opacity: number,
    name: string,
    rotationZ = 0
  ): void {
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 28),
      new THREE.MeshStandardMaterial({
        color: 0x3b4351,
        roughness: 1,
        metalness: 0,
        transparent: true,
        opacity,
        depthWrite: false
      })
    );
    shadow.position.set(...position);
    shadow.rotation.x = -Math.PI / 2;
    shadow.rotation.z = rotationZ;
    shadow.scale.set(size[0], size[1], 1);
    shadow.name = name;
    shadow.receiveShadow = false;
    shadow.castShadow = false;
    office.add(shadow);
  }

  private createMonitorOverlay(): THREE.Group {
    const monitorGroup = new THREE.Group();
    monitorGroup.name = 'monitor_overlay_group';
    monitorGroup.position.set(-0.38, 1.12, -0.74);

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.24, 0.018),
      new THREE.MeshStandardMaterial({ color: 0x111722, roughness: 0.34, metalness: 0.28 })
    );
    frame.name = 'monitor_overlay_frame';
    frame.castShadow = true;
    frame.receiveShadow = true;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.monitorScreenCanvas = canvas;
      this.monitorScreenCtx = ctx;
      this.monitorScreenTexture = new THREE.CanvasTexture(canvas);
      this.monitorScreenTexture.colorSpace = THREE.SRGBColorSpace;
      this.monitorScreenTexture.minFilter = THREE.LinearFilter;
      this.monitorScreenTexture.magFilter = THREE.LinearFilter;
    }

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.365, 0.206),
      new THREE.MeshStandardMaterial({
        color: 0xe8e3ff,
        roughness: 0.3,
        metalness: 0.02,
        emissive: 0x8f72ff,
        emissiveIntensity: 0.2,
        map: this.monitorScreenTexture ?? undefined
      })
    );
    screen.name = 'monitor_overlay_screen';
    screen.position.z = 0.0105;
    this.monitorScreen = screen;
    this.updateMonitorOverlay(true);

    monitorGroup.add(frame, screen);
    return monitorGroup;
  }

  private updateNeonPulse(): void {
    this.neonPulseTime += 0.02;
    this.updateVisitorCounterPulse();

    if (this.visualLightMode !== 'night') return;

    this.rgbLights.forEach((light) => {
      const base = (light.userData['baseIntensity'] as number) ?? 1.05;
      const phase = (light.userData['phase'] as number) ?? 0;
      const pulse = 0.78 + (Math.sin(this.neonPulseTime + phase) + 1) * 0.22;
      light.intensity = base * pulse;
    });

    this.accentLights.forEach((light) => {
      const base = (light.userData['nightIntensity'] as number) ?? 0.4;
      const phase = (light.userData['pulsePhase'] as number) ?? 0;
      const pulse = 0.985 + (Math.sin(this.neonPulseTime * 1.1 + phase) + 1) * 0.018;
      light.intensity = base * pulse;
      if (light.userData['isBaseRgbGlow']) {
        const t = (Math.sin(this.neonPulseTime * 0.9) + 1) * 0.5;
        const hue = 0.52 + t * 0.06;
        light.color.setHSL(hue, 1, 0.58);
      } else if (light.userData['isLampRgbGlow']) {
        const t = (Math.sin(this.neonPulseTime * 1.4 + phase) + 1) * 0.5;
        const hue = 0.53 + t * 0.05;
        light.color.setHSL(hue, 1, 0.62);
        light.intensity = base * (0.95 + t * 0.5);
      }
    });

    this.hexGlowLights.forEach((light) => {
      const base = (light.userData['nightIntensity'] as number) ?? 0.2;
      const phase = (light.userData['pulsePhase'] as number) ?? 0;
      const pulse = 0.86 + (Math.sin(this.neonPulseTime * 1.35 + phase) + 1) * 0.13;
      light.intensity = base * pulse;
    });

    if (!this.houseGroup) return;
    this.houseGroup.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const name = (obj.name || '').toLowerCase();
      if (!name.includes('rgb_hex_face') && !name.includes('rgb_hex_back')) return;

      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial;
        const baseIntensity = (obj.userData['baseIntensity'] as number) ?? 0.72;
        const phase = (obj.userData['phase'] as number) ?? 0;
        const t = (Math.sin(this.neonPulseTime * 1.08 + phase) + 1) * 0.5;

        if (name.includes('rgb_hex_face')) {
          mat.emissiveIntensity = baseIntensity * (0.46 + t * 0.18);
        } else {
          mat.emissiveIntensity = 0.04 + t * 0.06;
        }
      });
    });

    this.houseGroup.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const name = (obj.name || '').toLowerCase();
      if (
        !name.includes('rgb_lamp_halo') &&
        !name.includes('rgb_lamp_tube') &&
        !name.includes('frame_rgb_glow')
      ) return;

      const t = (Math.sin(this.neonPulseTime * 1.7 + 1.4) + 1) * 0.5;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];

      mats.forEach((mat) => {
        if (name.includes('rgb_lamp_tube')) {
          if (!(mat instanceof THREE.MeshStandardMaterial)) return;
          const hue = 0.48 + t * 0.07;
          mat.emissive.setHSL(hue, 1, 0.62);
          mat.emissiveIntensity = 1.1 + t * 0.55;
          return;
        }

        if (name.includes('rgb_lamp_halo')) {
          if (!(mat instanceof THREE.MeshBasicMaterial)) return;
          const hue = 0.48 + t * 0.07;
          mat.color.setHSL(hue, 1, 0.62);
          mat.opacity = 0.28 + t * 0.24;
          return;
        }

        if (name.includes('frame_rgb_glow')) {
          if (!(mat instanceof THREE.MeshBasicMaterial)) return;
          const phase = (obj.userData['phase'] as number) ?? 0;
          const w = (Math.sin(this.neonPulseTime * 1.2 + phase) + 1) * 0.5;
          mat.color.setHSL(0.5, 0.56, 0.66);
          mat.opacity = 0.05 + w * 0.05;
        }
      });
    });

  }

  private updateVisitorCounterPulse(): void {
    if (!this.visitorCounterFaceMaterial) return;
    if (this.visualLightMode === 'night') {
      const faceWave = (Math.sin(this.neonPulseTime * 1.2 + 1.1) + 1) * 0.5;
      this.visitorCounterFaceMaterial.opacity = 0.92 + faceWave * 0.08;
      return;
    }

    this.visitorCounterFaceMaterial.opacity = 0.96;
  }

  private updateMonitorOverlay(force = false): void {
    if (!this.monitorScreenCtx || !this.monitorScreenCanvas || !this.monitorScreenTexture || !this.monitorScreen) return;
    this.monitorFrameTick += 1;
    if (!force && this.monitorFrameTick % 2 !== 0) return;

    this.monitorUiTime += 0.018;
    const ctx = this.monitorScreenCtx;
    const { width, height } = this.monitorScreenCanvas;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#071220');
    gradient.addColorStop(1, '#0a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(110, 190, 255, 0.2)';
    ctx.fillRect(18, 14, 140, 18);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#b8e4ff';
    ctx.fillText('dev@ailin:~$', 24, 28);

    const lines = [
      'npm run portfolio',
      'renderScene({ mode: "pro" })',
      'const ux = refineLighting(room);',
      'commit("high-impact polish")'
    ];
    ctx.font = '15px monospace';
    lines.forEach((line, idx) => {
      const x = 28 + Math.sin(this.monitorUiTime * 1.4 + idx * 0.9) * 2.6;
      const y = 72 + idx * 34;
      const alpha = 0.72 + Math.sin(this.monitorUiTime * 1.2 + idx) * 0.1;
      ctx.fillStyle = `rgba(185, 235, 255, ${Math.max(0.45, alpha).toFixed(3)})`;
      ctx.fillText(line, x, y);
    });

    const cursorVisible = Math.floor(this.monitorUiTime * 2.4) % 2 === 0;
    if (cursorVisible) {
      ctx.fillStyle = '#9de5ff';
      ctx.fillRect(332, 164, 10, 16);
    }

    ctx.strokeStyle = 'rgba(133, 218, 255, 0.1)';
    for (let y = 0; y < height; y += 3) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    this.monitorScreenTexture.needsUpdate = true;
    const base = this.visualLightMode === 'night' ? 0.44 : 0.2;
    const pulse = 0.96 + Math.sin(this.monitorUiTime * 2.1) * 0.06;
    this.monitorScreen.material.emissiveIntensity = base * pulse;
  }

  private setupControls(canvas: HTMLCanvasElement): void {
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 8;
    this.controls.enablePan = false;
    this.controls.enableZoom = true;
    this.controls.target.set(...this.getResponsiveCameraTarget(CAMERA_POSITIONS.home, 'home').target);
    this.applyResponsiveControlLimits();
  }

  private handleResize(): void {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const profile = this.getViewportProfile();
    this.isMobileUi.set(profile !== 'desktop');

    this.camera.fov = profile === 'desktop' ? 50 : profile === 'mobile' ? 66 : 78;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile === 'desktop' ? 2 : 1.6));
    this.renderer.setSize(width, height);
    this.applyResponsiveControlLimits();
    this.updateMobileGuideMarkers();
    this.maybeShowMobileGuideBanner();
  }

  private getViewportProfile(): 'desktop' | 'mobile' | 'narrow-mobile' {
    const w = window.innerWidth;
    if (w <= 430) return 'narrow-mobile';
    if (w <= 768) return 'mobile';
    return 'desktop';
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, Math.max(0, ms));
    });
  }

  private getResponsiveCameraTarget(base: CameraTarget, context: 'home' | 'door' | 'default' = 'default'): CameraTarget {
    const profile = this.getViewportProfile();
    if (profile === 'desktop') return base;

    const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    const isTallMobile = aspect < 0.5;
    const isNarrow = profile === 'narrow-mobile';
    const preset =
      context === 'door'
        ? {
            horizontalScale: isNarrow ? (isTallMobile ? 2.36 : 2.2) : 2.0,
            verticalScale: isNarrow ? 1.14 : 1.1,
            yOffset: isNarrow ? -0.06 : -0.03,
            targetXOffset: isNarrow ? 0 : 0.01,
            targetYOffset: isNarrow ? (isTallMobile ? 0.12 : 0.1) : 0.09
          }
        : context === 'home'
          ? {
              horizontalScale: isNarrow ? (isTallMobile ? 1.86 : 1.74) : 1.6,
              verticalScale: isNarrow ? 1.1 : 1.06,
              yOffset: isNarrow ? (isTallMobile ? -0.14 : -0.1) : -0.07,
              targetXOffset: isNarrow ? (isTallMobile ? 0.1 : 0.08) : 0.06,
              targetYOffset: isNarrow ? (isTallMobile ? 0.08 : 0.06) : 0.05
            }
          : {
              horizontalScale: isNarrow ? 1.2 : 1.16,
              verticalScale: 1.02,
              yOffset: isNarrow ? 0.01 : 0,
              targetXOffset: 0,
              targetYOffset: 0.01
            };

    const target = new THREE.Vector3(...base.target);
    const position = new THREE.Vector3(...base.position);
    const direction = position.sub(target);
    const responsivePosition = target.clone().add(new THREE.Vector3(
      direction.x * preset.horizontalScale,
      direction.y * preset.verticalScale,
      direction.z * preset.horizontalScale
    ));
    responsivePosition.y += preset.yOffset;

    return {
      position: [responsivePosition.x, responsivePosition.y, responsivePosition.z],
      target: [
        base.target[0] + preset.targetXOffset,
        base.target[1] + preset.targetYOffset,
        base.target[2]
      ]
    };
  }

  private applyResponsiveControlLimits(): void {
    if (!this.controls) return;
    const profile = this.getViewportProfile();

    if (profile === 'desktop') {
      this.controls.zoomSpeed = 1;
      this.controls.minPolarAngle = 0.75;
      this.controls.maxPolarAngle = 1.25;
      this.controls.minAzimuthAngle = 0.35;
      this.controls.maxAzimuthAngle = 1.2;
      this.controls.minDistance = 2;
      this.controls.maxDistance = 8;
      return;
    }

    if (profile === 'mobile') {
      this.controls.zoomSpeed = 1.3;
      this.controls.minPolarAngle = 0.68;
      this.controls.maxPolarAngle = 1.34;
      this.controls.minAzimuthAngle = 0.06;
      this.controls.maxAzimuthAngle = 1.36;
      this.controls.minDistance = 1.15;
      this.controls.maxDistance = 10.2;
      return;
    }

    this.controls.zoomSpeed = 1.45;
    this.controls.minPolarAngle = 0.66;
    this.controls.maxPolarAngle = 1.36;
    this.controls.minAzimuthAngle = 0;
    this.controls.maxAzimuthAngle = 1.38;
    this.controls.minDistance = 1.05;
    this.controls.maxDistance = 10.8;
  }

  private syncCanvasInteractivity(section: Section): void {
    if (!this.renderer || !this.controls) return;
    const shouldBlockCanvasInteraction = section !== 'home';
    this.renderer.domElement.style.pointerEvents = shouldBlockCanvasInteraction ? 'none' : 'auto';
    if (shouldBlockCanvasInteraction) {
      this.controls.enabled = false;
      this.renderer.domElement.style.cursor = 'default';
      this.clearHoverFeedback();
    } else if (!this.isAnimating) {
      this.controls.enabled = true;
      this.renderer.domElement.style.cursor = 'grab';
    }
  }

  protected toggleMobileHelpPanel(): void {
    const next = !this.showMobileHelpPanel();
    this.showMobileHelpPanel.set(next);
    if (next) this.dismissMobileGuideBanner();
  }

  private maybeShowMobileGuideBanner(): void {
    if (!this.isMobileUi()) return;
    if (this.state.currentSection() !== 'home') return;
    if (this.hasShownMobileGuideOnce) return;
    this.hasShownMobileGuideOnce = true;
    this.showMobileGuideBanner.set(true);
    if (this.mobileGuideHideTimer) clearTimeout(this.mobileGuideHideTimer);
    this.mobileGuideHideTimer = setTimeout(() => this.showMobileGuideBanner.set(false), 7000);
  }

  private dismissMobileGuideBanner(): void {
    if (!this.showMobileGuideBanner()) return;
    this.showMobileGuideBanner.set(false);
    if (this.mobileGuideHideTimer) {
      clearTimeout(this.mobileGuideHideTimer);
      this.mobileGuideHideTimer = null;
    }
  }

  private updateMobileGuideMarkers(): void {
    if (!this.isMobileUi() || this.state.currentSection() !== 'home' || !this.renderer || !this.camera) {
      if (this.mobileGuideMarkers().length > 0) this.mobileGuideMarkers.set([]);
      return;
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const markers = this.mobileGuideAnchors.map((anchor) => {
      const v = new THREE.Vector3(...anchor.position).project(this.camera);
      const rawX = (v.x * 0.5 + 0.5) * rect.width;
      const rawY = (-v.y * 0.5 + 0.5) * rect.height;
      const x = THREE.MathUtils.clamp(rawX, 18, rect.width - 18);
      const y = THREE.MathUtils.clamp(rawY, 18, rect.height - 18);
      const visible = v.z > -1 && v.z < 1;
      return {
        id: anchor.id,
        label: anchor.label,
        x,
        y,
        visible,
        delay: `${anchor.delay}ms`,
        labelOffsetX: anchor.labelOffsetX,
        labelOffsetY: anchor.labelOffsetY
      };
    });

    this.mobileGuideMarkers.set(markers);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.updateCameraAnimation();
    this.updateNeonPulse();
    this.updateMonitorOverlay();
    this.mobileGuideFrameTick += 1;
    if (this.mobileGuideFrameTick % 2 === 0) {
      this.updateMobileGuideMarkers();
    }
    if (this.hoverMarker?.visible) {
      this.hoverPulseTime += 0.08;
      const pulse = 0.92 + Math.sin(this.hoverPulseTime) * 0.16;
      this.hoverMarker.scale.setScalar(pulse);
    }
    this.controls?.update();
    this.renderer.render(this.scene, this.camera);
  };
}
