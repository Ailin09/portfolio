import { Component, inject } from '@angular/core';
import { Scene3dComponent } from '../../features/scene/scene3d.component';
import { PortfolioStateService } from '../../core/portfolio-state.service';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [Scene3dComponent],
  template: `
    <div class="portfolio-layout" [class.night]="state.lightMode() === 'night'">
      <app-scene3d class="scene-layer" />

      @if (state.currentSection() !== 'home' && state.currentSection() !== 'sobre-mi') {
        <button
          class="exit-btn"
          (click)="exitToInitialView()"
          aria-label="Salir"
        >
          ← Salir
        </button>
      }
      @if (state.currentSection() === 'sobre-mi') {
        <div class="neon-window-backdrop" (click)="exitToInitialView()"></div>
        <button
          class="exit-btn"
          (click)="exitToInitialView()"
          aria-label="Volver"
        >
          ← Volver
        </button>
      }

      <main
        class="content-overlay"
        [class.inside]="state.hasEnteredHouse()"
        [class.home]="state.currentSection() === 'home'"
        [class.projects]="state.currentSection() === 'proyectos'"
        [class.hobbies]="state.currentSection() === 'hobbies'"
        [class.contact]="state.currentSection() === 'contacto'"
        [class.certifications]="state.currentSection() === 'certificaciones'"
        [class.neon-window]="state.currentSection() === 'sobre-mi'"
      >
        <ng-content />
      </main>

    </div>
  `,
  styles: [`
    .portfolio-layout {
      position: fixed;
      inset: 0;
      overflow: hidden;
    }

    .scene-layer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .exit-btn {
      position: absolute;
      top: 1.5rem;
      left: 1.5rem;
      z-index: 15;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      padding: 0.62rem 1.08rem;
      min-height: 2.55rem;
      background: rgba(255, 255, 255, 0.94);
      color: #1c1c1c;
      border: 1px solid rgba(220, 215, 205, 0.95);
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
      backdrop-filter: blur(10px);
      box-shadow: 0 7px 18px rgba(28, 28, 28, 0.14);
      -webkit-tap-highlight-color: transparent;
    }

    .exit-btn:hover {
      background: rgba(234, 229, 255, 0.96);
      border-color: rgba(124, 92, 255, 0.35);
      transform: translateY(-1px);
      box-shadow: 0 10px 22px rgba(124, 92, 255, 0.18);
    }

    .exit-btn:active {
      transform: translateY(0);
      box-shadow: 0 5px 12px rgba(28, 28, 28, 0.16);
    }

    .exit-btn:focus-visible {
      outline: 2px solid rgba(124, 92, 255, 0.8);
      outline-offset: 2px;
    }

    .content-overlay {
      position: absolute;
      bottom: 0.75rem;
      left: 0.75rem;
      right: 0.75rem;
      margin-inline: auto;
      width: auto;
      max-width: 480px;
      max-height: min(48vh, 430px);
      padding: 0;
      z-index: 5;
      pointer-events: none;
      display: flex;
      justify-content: center;
      transition: max-height 0.4s ease, max-width 0.4s ease;
    }

    .content-overlay.inside {
      max-height: min(56vh, 520px);
      max-width: 560px;
    }

    .content-overlay.home {
      max-height: min(36vh, 280px);
      max-width: 520px;
    }

    .content-overlay.projects {
      top: clamp(4.75rem, 10vh, 6.8rem);
      bottom: max(0.75rem, env(safe-area-inset-bottom));
      max-width: min(1120px, calc(100vw - 1.5rem));
      max-height: none;
      pointer-events: auto;
      z-index: 12;
    }

    .content-overlay.hobbies {
      top: clamp(4.95rem, 10vh, 6.9rem);
      bottom: max(0.75rem, env(safe-area-inset-bottom));
      max-width: min(860px, calc(100vw - 1.5rem));
      max-height: none;
      pointer-events: auto;
      z-index: 12;
    }

    .content-overlay.certifications {
      top: clamp(4.95rem, 10vh, 6.9rem);
      bottom: max(0.75rem, env(safe-area-inset-bottom));
      max-width: min(760px, calc(100vw - 1.5rem));
      max-height: none;
      pointer-events: auto;
      z-index: 12;
    }

    .content-overlay.contact {
      max-width: min(560px, calc(100vw - 1.5rem));
      max-height: min(58vh, 560px);
      pointer-events: auto;
      z-index: 12;
    }

    .content-overlay.projects > * {
      width: min(1120px, 100%);
      max-width: min(1120px, 100%);
      align-self: center;
      max-height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }

    .content-overlay.hobbies > * {
      width: min(860px, 100%);
      max-width: min(860px, 100%);
      align-self: center;
      max-height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .content-overlay.certifications > * {
      width: min(760px, 100%);
      max-width: min(760px, 100%);
      align-self: center;
      max-height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }

    .content-overlay.contact > * {
      width: min(560px, 100%);
      max-width: min(560px, 100%);
      align-self: center;
      max-height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .neon-window-backdrop {
      position: fixed;
      inset: 0;
      background:
        radial-gradient(ellipse at 50% 28%, rgba(255, 205, 145, 0.28) 0%, transparent 46%),
        radial-gradient(ellipse at 75% 80%, rgba(124, 92, 255, 0.1) 0%, transparent 38%),
        linear-gradient(180deg, #f6f4ef 0%, #efebe2 45%, #e7e1d6 100%);
      z-index: 8;
      animation: fadeIn 0.4s ease;
    }

    .portfolio-layout.night .neon-window-backdrop {
      background:
        radial-gradient(ellipse at 50% 30%, rgba(124, 92, 255, 0.16) 0%, transparent 45%),
        radial-gradient(ellipse at 70% 80%, rgba(178, 156, 255, 0.12) 0%, transparent 40%),
        linear-gradient(180deg, #1b1629 0%, #14101e 40%, #0e0b14 100%);
    }

    .content-overlay.neon-window {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(1220px, 98vw);
      max-width: none;
      max-height: calc(100vh - 3.4rem);
      padding: 1.15rem;
      z-index: 10;
      pointer-events: auto;
      animation: cartelZoomIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      display: flex;
      flex-direction: column;
    }

    .portfolio-layout:not(.night) .content-overlay.neon-window {
      width: min(1320px, 98vw);
    }

    .content-overlay.neon-window > * {
      width: 100%;
      flex: 1;
      min-height: 0;
      max-height: calc(100vh - 4.8rem);
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }

    .portfolio-layout.night .exit-btn {
      border-color: rgba(64, 224, 255, 0.45);
      background: rgba(14, 18, 30, 0.84);
      color: #e9f7ff;
      box-shadow: 0 0 14px rgba(64, 224, 255, 0.22), 0 8px 18px rgba(4, 8, 20, 0.45);
    }

    .portfolio-layout.night .exit-btn:hover {
      background: rgba(18, 24, 39, 0.92);
      border-color: rgba(64, 224, 255, 0.62);
      box-shadow: 0 0 18px rgba(64, 224, 255, 0.24), 0 10px 22px rgba(4, 8, 20, 0.56);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes cartelZoomIn {
      from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }

    .content-overlay > * {
      pointer-events: auto;
      width: 100%;
      max-height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .object-tooltip {
      position: absolute;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      padding: 0.5rem 1rem;
      background: var(--color-tooltip-bg);
      color: white;
      border-radius: 8px;
      font-size: 0.875rem;
      z-index: 20;
      pointer-events: none;
    }

    @media (max-width: 640px) {
      .content-overlay {
        left: 0.5rem;
        right: 0.5rem;
        bottom: 0.5rem;
        max-height: min(46vh, 420px);
      }
      .content-overlay.home {
        max-height: min(32vh, 230px);
      }
      .content-overlay.inside {
        max-height: min(54vh, 500px);
      }
      .content-overlay.projects {
        top: clamp(4.2rem, 9vh, 5.5rem);
        bottom: max(0.5rem, env(safe-area-inset-bottom));
        max-width: none;
        max-height: none;
      }
      .content-overlay.hobbies {
        top: clamp(4.2rem, 9vh, 5.5rem);
        bottom: max(0.5rem, env(safe-area-inset-bottom));
        max-width: none;
        max-height: min(80vh, 760px);
      }
      .content-overlay.certifications {
        top: clamp(4.2rem, 9vh, 5.5rem);
        bottom: max(0.5rem, env(safe-area-inset-bottom));
        max-width: none;
        max-height: min(80vh, 760px);
      }
      .content-overlay.contact {
        max-width: none;
        max-height: min(72vh, 560px);
      }
      .content-overlay.projects > * {
        width: 100%;
        max-width: 100%;
        height: 100%;
      }
      .content-overlay.hobbies > * {
        width: 100%;
        max-width: 100%;
        max-height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
      }
      .content-overlay.certifications > * {
        width: 100%;
        max-width: 100%;
        max-height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
      }
      .content-overlay.contact > * {
        width: 100%;
        max-width: 100%;
      }
      .content-overlay.neon-window {
        width: min(96vw, 520px);
        max-height: calc(100vh - 2.6rem);
        padding: 0.55rem;
      }
      .content-overlay.neon-window > * {
        max-height: calc(100vh - 3.7rem);
      }
      .exit-btn {
        top: 1rem;
        left: 0.6rem;
        font-size: 0.82rem;
        min-height: 2.35rem;
        padding: 0.5rem 0.88rem;
      }
    }

    @media (max-width: 480px) {
      .exit-btn {
        top: max(0.5rem, env(safe-area-inset-top));
        left: max(0.45rem, env(safe-area-inset-left));
        font-size: 0.76rem;
        min-height: 2.2rem;
        padding: 0.42rem 0.7rem;
      }
      .content-overlay {
        left: 0.35rem;
        right: 0.35rem;
        bottom: max(0.35rem, env(safe-area-inset-bottom));
        max-height: min(44vh, 360px);
      }

      .content-overlay.home {
        max-height: min(30vh, 205px);
      }

      .content-overlay.inside {
        max-height: min(52vh, 430px);
      }

      .content-overlay.projects {
        top: clamp(3.9rem, 8.3vh, 5rem);
        bottom: max(0.35rem, env(safe-area-inset-bottom));
        max-height: none;
      }
      .content-overlay.hobbies {
        top: clamp(3.9rem, 8.3vh, 5rem);
        bottom: max(0.35rem, env(safe-area-inset-bottom));
        max-height: min(82vh, 760px);
      }
      .content-overlay.certifications {
        top: clamp(3.9rem, 8.3vh, 5rem);
        bottom: max(0.35rem, env(safe-area-inset-bottom));
        max-height: min(82vh, 760px);
      }
      .content-overlay.contact {
        max-height: min(74vh, 560px);
      }
      .content-overlay.projects > * {
        width: 100%;
        max-width: 100%;
        height: 100%;
      }
      .content-overlay.hobbies > * {
        width: 100%;
        max-width: 100%;
        max-height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
      }
      .content-overlay.certifications > * {
        width: 100%;
        max-width: 100%;
        max-height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
      }
      .content-overlay.contact > * {
        width: 100%;
        max-width: 100%;
      }

      .content-overlay.neon-window {
        width: min(97vw, 430px);
        max-height: calc(100dvh - 2rem);
        padding: 0.45rem;
      }

      .content-overlay.neon-window > * {
        max-height: calc(100dvh - 3rem);
      }
    }
  `]
})
export class PortfolioComponent {
  protected readonly state = inject(PortfolioStateService);

  protected exitToInitialView(): void {
    this.state.exitHouse();
    this.state.setSection('home');
  }
}
