import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { PortfolioStateService } from '../../core/portfolio-state.service';
import { PROJECTS } from '../../core/projects-data';

@Component({
  selector: 'app-proyectos',
  standalone: true,
  template: `
    <div class="proyectos-panel" [class.night]="state.lightMode() === 'night'">
      <header class="menu-header">
        <h2 class="section-title">Proyectos</h2>
        <p class="section-subtitle">Selecciona un proyecto para ver su detalle profesional.</p>
      </header>

      <div class="projects-grid">
        @for (project of projects; track project.id) {
          <button
            class="project-card"
            (click)="selectProject(project.id)"
            [attr.aria-label]="'Ver proyecto ' + project.title"
            [style.--project-accent]="projectHexColor(project.themeAccent)"
          >
            <div class="project-card-header">
              <div class="project-logo-wrap">
                @if (isLogoAvailable(project.id)) {
                  <img
                    class="project-logo"
                    [src]="project.logo"
                    [alt]="'Logo de ' + project.title"
                    loading="lazy"
                    (error)="onLogoError(project.id)"
                  />
                } @else {
                  <span class="project-logo-fallback" aria-hidden="true">{{ project.logoFallback }}</span>
                }
              </div>
              <div class="project-headline">
                <h3 class="project-name">{{ project.title }}</h3>
                <p class="project-role">{{ project.role }}</p>
                @if (project.company) {
                  <p class="project-company">{{ project.company }}</p>
                }
              </div>
            </div>

            <p class="project-summary">{{ project.summary }}</p>

            <div class="card-stack-tags">
              @for (tag of limitedStack(project.stack); track tag) {
                <span class="stack-tag">{{ tag }}</span>
              }
            </div>

            <ul class="card-highlights">
              @for (item of limitedHighlights(project.highlights); track item) {
                <li>{{ item }}</li>
              }
            </ul>

          </button>
        }
      </div>

      @if (selectedProject(); as project) {
        <div class="project-modal-backdrop" (click)="state.clearProjectSelection()"></div>
        <article
          class="project-modal"
          [class.night]="state.lightMode() === 'night'"
          aria-modal="true"
          role="dialog"
          aria-labelledby="project-modal-title"
        >
          <button class="close-btn" (click)="state.clearProjectSelection()" aria-label="Cerrar proyecto">✕</button>
          <div class="modal-head">
            <div class="project-logo-wrap project-logo-wrap-modal">
              @if (isLogoAvailable(project.id)) {
                <img
                  class="project-logo"
                  [src]="project.logo"
                  [alt]="'Logo de ' + project.title"
                  (error)="onLogoError(project.id)"
                />
              } @else {
                <span class="project-logo-fallback" aria-hidden="true">{{ project.logoFallback }}</span>
              }
            </div>
            <div class="modal-headline">
              <h3 id="project-modal-title" class="project-title">{{ project.title }}</h3>
              <p class="project-meta">
                <span>{{ project.role }}</span>
                @if (project.company) {
                  <span>· {{ project.company }}</span>
                }
                @if (project.year) {
                  <span>· {{ project.year }}</span>
                }
              </p>
            </div>
          </div>
          <p class="project-summary project-summary-modal">{{ project.summary }}</p>
          <p class="project-desc">{{ project.description }}</p>

          <h4 class="modal-section-title">Tecnologías</h4>
          <div class="tech-tags">
            @for (t of project.stack; track t) {
              <span class="tech-tag">{{ t }}</span>
            }
          </div>

          <h4 class="modal-section-title">Logros destacados</h4>
          <ul class="modal-highlights">
            @for (item of project.highlights; track item) {
              <li>{{ item }}</li>
            }
          </ul>

          @if (project.link) {
            <a [href]="project.link" target="_blank" rel="noopener" class="project-link">
              Ver proyecto →
            </a>
          }
        </article>
      }
    </div>
  `,
  styles: [`
    .proyectos-panel {
      padding: 0.8rem;
      width: 100%;
      max-width: 1120px;
      margin: 0 auto;
      background: var(--projects-panel-bg);
      border-radius: 14px;
      border: 1px solid var(--projects-panel-border);
      box-shadow: var(--projects-panel-shadow);
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
      min-height: 0;
      max-height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }

    .proyectos-panel.night {
      background: var(--projects-panel-bg);
      border-color: var(--projects-panel-border);
      box-shadow: var(--projects-panel-shadow);
    }

    .menu-header {
      display: grid;
      gap: 0.2rem;
      flex: 0 0 auto;
    }

    .section-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--color-primary);
    }

    .section-subtitle {
      margin: 0;
      font-size: 0.82rem;
      color: var(--color-secondary);
    }

    .proyectos-panel.night .section-title {
      color: var(--color-primary);
      text-shadow: 0 0 14px rgba(66, 239, 255, 0.16);
    }

    .proyectos-panel.night .section-subtitle {
      color: var(--color-secondary);
    }

    .projects-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.6rem;
      overflow: visible;
      min-height: auto;
      flex: 0 0 auto;
      padding-bottom: 0.25rem;
    }

    .project-card {
      --project-accent: #7abcec;
      border: 1px solid var(--projects-card-border);
      border-left: 2px solid color-mix(in srgb, var(--project-accent) 74%, #c4d8f7);
      background: var(--projects-card-bg);
      color: var(--color-primary);
      border-radius: 12px;
      padding: 0.66rem;
      display: grid;
      gap: 0.55rem;
      cursor: pointer;
      transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
      text-align: left;
      min-height: 174px;
    }

    .project-card:hover {
      transform: translateY(-1px);
      border-color: color-mix(in srgb, var(--project-accent) 45%, #d4dfef);
      box-shadow: 0 6px 16px rgba(18, 26, 38, 0.08);
    }

    .project-card:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--project-accent) 82%, #2d57d2);
      outline-offset: 2px;
    }

    .proyectos-panel.night .project-card {
      border: 1px solid color-mix(in srgb, var(--project-accent) 42%, var(--projects-card-border));
      border-left: 2px solid color-mix(in srgb, var(--project-accent) 78%, #9fdfff);
      background: var(--projects-card-bg);
      box-shadow:
        inset 0 1px 0 rgba(190, 225, 255, 0.08),
        0 0 0 1px rgba(69, 98, 170, 0.2);
    }

    .proyectos-panel.night .project-card:hover {
      border-color: color-mix(in srgb, var(--project-accent) 56%, rgba(88, 247, 255, 0.6));
      box-shadow:
        inset 0 0 0 1px color-mix(in srgb, var(--project-accent) 26%, rgba(95, 239, 255, 0.24)),
        0 0 18px color-mix(in srgb, var(--project-accent) 38%, rgba(255, 63, 188, 0.25));
    }

    .project-card-header {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.55rem;
      align-items: center;
    }

    .project-logo-wrap {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 0.7rem;
      overflow: hidden;
      border: 1px solid color-mix(in srgb, var(--project-accent) 28%, var(--projects-logo-border-base));
      background: var(--projects-logo-bg);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    .project-logo-wrap-modal {
      width: 3rem;
      height: 3rem;
    }

    .project-logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .project-logo-fallback {
      font-size: 0.86rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      color: color-mix(in srgb, #1c2440 75%, var(--project-accent));
    }

    .project-headline {
      min-width: 0;
    }

    .project-name {
      margin: 0;
      font-size: 0.93rem;
      font-weight: 800;
      line-height: 1.15;
      color: var(--projects-title-color);
    }

    .project-role,
    .project-company {
      margin: 0.1rem 0 0;
      font-size: 0.76rem;
      color: var(--color-secondary);
      line-height: 1.2;
    }

    .project-summary {
      margin: 0;
      font-size: 0.79rem;
      color: var(--color-secondary);
      line-height: 1.35;
    }

    .card-stack-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }

    .stack-tag {
      font-size: 0.67rem;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.22rem 0.4rem;
      border-radius: 999px;
      background: var(--projects-chip-bg);
      color: var(--projects-chip-text);
      border: 1px solid color-mix(in srgb, var(--project-accent) 28%, var(--projects-chip-border-base));
      white-space: nowrap;
    }

    .card-highlights {
      margin: 0;
      padding-left: 1rem;
      display: grid;
      gap: 0.2rem;
    }

    .card-highlights li {
      font-size: 0.74rem;
      line-height: 1.25;
      color: var(--color-secondary);
    }

    .proyectos-panel.night .project-logo-wrap {
      background: var(--projects-logo-bg);
      border-color: color-mix(in srgb, var(--project-accent) 42%, var(--projects-logo-border-base));
      box-shadow: 0 0 14px color-mix(in srgb, var(--project-accent) 24%, rgba(105, 238, 255, 0.18));
    }

    .proyectos-panel.night .project-logo-fallback {
      color: color-mix(in srgb, #c7d7ff 70%, var(--project-accent));
    }

    .proyectos-panel.night .project-role,
    .proyectos-panel.night .project-company,
    .proyectos-panel.night .project-summary,
    .proyectos-panel.night .card-highlights li {
      color: var(--color-secondary);
    }

    .proyectos-panel.night .project-name {
      color: var(--projects-title-color);
      text-shadow: 0 0 12px rgba(95, 214, 255, 0.14);
    }

    .proyectos-panel.night .stack-tag {
      background: var(--projects-chip-bg);
      color: var(--projects-chip-text);
      border-color: color-mix(in srgb, var(--project-accent) 46%, var(--projects-chip-border-base));
    }

    .project-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 30;
    }

    .project-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(94vw, 720px);
      max-height: calc(100dvh - 3rem);
      overflow-y: auto;
      z-index: 31;
      background: var(--projects-modal-bg);
      border: 1px solid var(--projects-modal-border);
      border-radius: 16px;
      padding: 1rem 1rem 1.1rem;
      box-shadow: var(--projects-modal-shadow);
    }

    .project-modal.night {
      background: var(--projects-modal-bg);
      border-color: var(--projects-modal-border);
      box-shadow: var(--projects-modal-shadow);
    }

    .close-btn {
      position: sticky;
      top: 0;
      margin-left: auto;
      display: block;
      border: 1px solid var(--projects-close-border);
      background: var(--projects-close-bg);
      color: var(--projects-close-text);
      border-radius: 8px;
      width: 2.75rem;
      height: 2.75rem;
      cursor: pointer;
    }

    .project-modal.night .close-btn {
      border-color: var(--projects-close-border);
      background: var(--projects-close-bg);
      color: var(--projects-close-text);
    }

    .close-btn:focus-visible {
      outline: 2px solid #67ebff;
      outline-offset: 2px;
    }

    .modal-head {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.7rem;
      align-items: center;
      margin-top: 0.2rem;
    }

    .project-title {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-primary);
      margin: 0;
    }

    .project-meta {
      margin: 0.22rem 0 0;
      font-size: 0.8rem;
      color: var(--color-secondary);
      line-height: 1.3;
    }

    .project-summary-modal {
      margin-top: 0.75rem;
      margin-bottom: 0.35rem;
    }

    .project-desc {
      font-size: 0.92rem;
      color: var(--color-secondary);
      margin: 0 0 0.75rem 0;
      line-height: 1.5;
    }

    .project-modal.night .project-title {
      color: var(--color-primary);
    }

    .project-modal.night .project-desc {
      color: var(--color-secondary);
    }

    .modal-section-title {
      margin: 0.15rem 0 0.45rem;
      font-size: 0.82rem;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: var(--color-secondary);
    }

    .project-modal.night .modal-section-title,
    .project-modal.night .project-meta {
      color: var(--color-secondary);
    }

    .tech-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-bottom: 0.75rem;
    }

    .tech-tag {
      font-size: 0.75rem;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.22rem 0.5rem;
      background: var(--projects-chip-bg);
      color: var(--projects-chip-text);
      border-radius: 6px;
      border: 1px solid var(--projects-chip-border-base);
    }

    .project-modal.night .tech-tag {
      background: var(--projects-chip-bg);
      color: var(--projects-chip-text);
      border-color: var(--projects-chip-border-base);
    }

    .modal-highlights {
      margin: 0 0 0.75rem;
      padding-left: 1rem;
      display: grid;
      gap: 0.3rem;
    }

    .modal-highlights li {
      font-size: 0.85rem;
      color: var(--color-secondary);
      line-height: 1.35;
    }

    .project-modal.night .modal-highlights li {
      color: var(--color-secondary);
    }

    .project-link {
      font-size: 0.9rem;
      color: var(--color-link);
      font-weight: 500;
      text-decoration: none;
    }

    .project-modal.night .project-link {
      color: var(--color-link);
    }

    .project-link:hover {
      text-decoration: underline;
    }

    .projects-grid::-webkit-scrollbar {
      width: 8px;
    }

    .projects-grid::-webkit-scrollbar-thumb {
      background: rgba(145, 158, 189, 0.65);
      border-radius: 999px;
      border: 2px solid transparent;
      background-clip: content-box;
    }

    .projects-grid::-webkit-scrollbar-track {
      background: transparent;
    }

    .proyectos-panel.night .projects-grid::-webkit-scrollbar-thumb {
      background: rgba(121, 145, 190, 0.6);
      border: 2px solid transparent;
      background-clip: content-box;
    }

    @media (max-width: 768px) {
      .proyectos-panel {
        width: 100%;
      }

      .projects-grid {
        gap: 0.55rem;
      }

      .project-modal {
        width: min(95vw, 680px);
        max-height: calc(100dvh - 2rem);
      }
    }

    @media (max-width: 480px) {
      .proyectos-panel {
        padding: 0.66rem;
        width: 100%;
      }

      .section-title {
        font-size: 1.02rem;
      }

      .section-subtitle {
        font-size: 0.78rem;
      }

      .projects-grid {
        gap: 0.42rem;
      }

      .project-card {
        padding: 0.5rem;
        min-height: 152px;
      }

      .project-name {
        font-size: 0.87rem;
      }

      .project-role,
      .project-company {
        font-size: 0.72rem;
      }

      .project-summary {
        font-size: 0.76rem;
      }

      .card-highlights li {
        font-size: 0.72rem;
      }

      .project-modal {
        width: min(97vw, 440px);
        max-height: calc(100dvh - 1rem);
        padding: 0.75rem 0.72rem 0.84rem;
      }

      .close-btn {
        width: 2.5rem;
        height: 2.5rem;
      }

      .project-title {
        font-size: 1.01rem;
      }

      .project-meta {
        font-size: 0.76rem;
      }

      .project-desc {
        font-size: 0.85rem;
      }

      .tech-tag {
        font-size: 0.68rem;
        padding: 0.2rem 0.42rem;
      }

      .modal-highlights li {
        font-size: 0.8rem;
      }
    }

    @media (min-width: 640px) {
      .proyectos-panel {
        padding: 1.2rem;
      }
      .projects-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (min-width: 1024px) {
      .projects-grid {
        grid-template-columns: 1fr 1fr 1fr;
      }
    }
  `]
})
export class ProyectosComponent {
  protected readonly state = inject(PortfolioStateService);
  protected readonly projects = PROJECTS;
  private readonly hiddenLogos = signal<Record<string, true>>({});
  private suppressSelectionUntil = 0;

  constructor() {
    effect(() => {
      if (this.state.currentSection() === 'proyectos') {
        this.suppressSelectionUntil = performance.now() + 420;
      }
    });
  }

  protected readonly selectedProject = computed(() => {
    const id = this.state.selectedProject();
    if (!id) return null;
    return PROJECTS.find(p => p.id === id) ?? null;
  });

  protected selectProject(projectId: string): void {
    if (performance.now() < this.suppressSelectionUntil) return;
    this.state.selectProject(projectId);
  }

  protected isLogoAvailable(projectId: string): boolean {
    return this.hiddenLogos()[projectId] !== true;
  }

  protected onLogoError(projectId: string): void {
    this.hiddenLogos.update(current => ({ ...current, [projectId]: true }));
  }

  protected limitedStack(stack: string[]): string[] {
    return stack.slice(0, 3);
  }

  protected limitedHighlights(highlights: string[]): string[] {
    return highlights.slice(0, 3);
  }

  protected projectHexColor(value: number): string {
    return `#${value.toString(16).padStart(6, '0')}`;
  }

  @HostListener('document:keydown.escape')
  protected handleEscapeKey(): void {
    if (this.selectedProject()) {
      this.state.clearProjectSelection();
    }
  }
}
