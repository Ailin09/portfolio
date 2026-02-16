import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EntryComponent } from '../pages/entry/entry.component';
import { PortfolioComponent } from '../pages/portfolio/portfolio.component';
import { PortfolioStateService } from '../core/portfolio-state.service';
import { SceneTransitionService } from '../core/scene-transition.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, EntryComponent, PortfolioComponent],
  template: `
    @if (state.hasEntered()) {
      <app-portfolio>
        <router-outlet />
      </app-portfolio>
    } @else {
      <app-entry />
    }
    <div
      class="scene-loader"
      [class.visible]="transition.isVisible()"
      [class.night]="state.lightMode() === 'night'"
      [class.fading-in]="transition.phase() === 'fading-in'"
      [class.fading-out]="transition.phase() === 'fading-out'"
    >
      <div class="scene-loader-vignette"></div>
      <div class="scene-loader-content">
        <span class="scene-loader-ring"></span>
        @if (transition.label()) {
          <p class="scene-loader-label">{{ transition.label() }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      inset: 0;
      display: block;
    }
    .scene-loader {
      position: fixed;
      inset: 0;
      z-index: 200;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.24s ease;
      background:
        radial-gradient(circle at 50% 24%, rgba(228, 236, 255, 0.12), transparent 44%),
        linear-gradient(180deg, rgba(241, 244, 237, 0.6) 0%, rgba(232, 236, 229, 0.88) 100%);
      backdrop-filter: blur(2px);
    }
    .scene-loader.visible {
      pointer-events: auto;
      opacity: 1;
    }
    .scene-loader.fading-out {
      opacity: 0;
    }
    .scene-loader.night {
      background:
        radial-gradient(circle at 50% 30%, rgba(115, 201, 255, 0.08), transparent 45%),
        radial-gradient(circle at 50% 60%, rgba(124, 92, 255, 0.08), transparent 54%),
        linear-gradient(180deg, rgba(6, 14, 23, 0.72) 0%, rgba(7, 12, 22, 0.94) 100%);
    }
    .scene-loader-vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 58%, rgba(0, 0, 0, 0.04) 34%, rgba(0, 0, 0, 0.42) 100%);
    }
    .scene-loader-content {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }
    .scene-loader-ring {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 999px;
      border: 2px solid rgba(123, 110, 219, 0.22);
      border-top-color: rgba(123, 110, 219, 0.92);
      animation: sceneLoaderSpin 0.9s linear infinite;
    }
    .scene-loader.night .scene-loader-ring {
      border-color: rgba(80, 243, 220, 0.2);
      border-top-color: rgba(80, 243, 220, 0.96);
      box-shadow: 0 0 14px rgba(80, 243, 220, 0.24);
    }
    .scene-loader-label {
      margin: 0;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.76rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      color: rgba(36, 34, 44, 0.9);
      text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
    }
    .scene-loader.night .scene-loader-label {
      color: rgba(219, 246, 255, 0.92);
      text-shadow: 0 0 12px rgba(80, 243, 220, 0.2);
    }
    @keyframes sceneLoaderSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class ShellComponent {
  protected readonly state = inject(PortfolioStateService);
  protected readonly transition = inject(SceneTransitionService);
}
