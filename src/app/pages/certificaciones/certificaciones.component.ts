import { Component, inject } from '@angular/core';
import { PortfolioStateService } from '../../core/portfolio-state.service';

type CertificationItem = {
  id: string;
  title: string;
  issuer: string;
  year: string;
  summary: string;
  skills: string[];
  fileName: string;
  accent: string;
};

const CERTIFICATIONS: CertificationItem[] = [
  {
    id: 'programacion-web-javascript',
    title: 'Programación Web con JavaScript',
    issuer: 'Universidad Tecnológica Nacional',
    year: '2020',
    summary: 'Certificación universitaria en fundamentos de desarrollo web con JavaScript y lógica aplicada.',
    skills: ['JavaScript', 'Lógica', 'DOM', 'Frontend'],
    fileName: 'curso UTN.pdf',
    accent: '#c7a4ff'
  },
  {
    id: 'curso-diseno-web',
    title: 'Curso diseño web',
    issuer: 'Udemy · Carlos Arturo Esparza',
    year: '2020',
    summary: 'Formación integral en HTML, CSS y fundamentos de diseño web con enfoque en maquetación profesional.',
    skills: ['HTML', 'CSS', 'Responsive', 'Maquetación'],
    fileName: 'Curso diseno web.pdf',
    accent: '#7adca3'
  },
  {
    id: 'angular-cero-experto',
    title: 'Angular: De Cero a Experto',
    issuer: 'Udemy · Fernando Herrera',
    year: '2024',
    summary: 'Especialización en Angular con arquitectura modular, servicios, routing, RxJS y buenas prácticas.',
    skills: ['Angular', 'RxJS', 'Routing', 'Arquitectura'],
    fileName: 'Angular Certificado.pdf',
    accent: '#7abcec'
  },
  {
    id: 'henry-fullstack-web-developer',
    title: 'Full Stack Web Developer',
    issuer: 'Soy Henry',
    year: 'Graduación',
    summary: 'Programa intensivo fullstack con enfoque práctico en desarrollo de aplicaciones web end-to-end.',
    skills: ['JavaScript', 'React', 'Node', 'SQL', 'Redux'],
    fileName: 'Fullstack web developer.pdf',
    accent: '#ff8acc'
  }
];

@Component({
  selector: 'app-certificaciones',
  standalone: true,
  template: `
    <section
      class="certificaciones-panel"
      [class.night]="state.lightMode() === 'night'"
      (pointerdown)="stopPanelEvent($event)"
      (click)="stopPanelEvent($event)"
      (wheel)="stopPanelEvent($event)"
      (touchstart)="stopPanelEvent($event)"
    >
      <header class="menu-header">
        <h2 class="section-title">Certificaciones</h2>
        <p class="section-subtitle">Documentación oficial de formación y especialización profesional.</p>
      </header>

      <div class="cert-grid">
        @for (cert of certifications; track cert.id) {
          <article class="cert-card" [style.--cert-accent]="cert.accent">
            <header class="cert-card-header">
              <div class="cert-badge" aria-hidden="true">PDF</div>
              <span class="cert-year">{{ cert.year }}</span>
            </header>

            <div class="cert-headline">
              <h3 class="cert-title">{{ cert.title }}</h3>
              <p class="cert-meta">{{ cert.issuer }}</p>
            </div>

            <p class="cert-summary">{{ cert.summary }}</p>

            <div class="cert-skills">
              @for (skill of cert.skills; track skill) {
                <span class="cert-skill">{{ skill }}</span>
              }
            </div>

            <footer class="cert-card-footer">
              <a
                class="cert-open-link"
                [href]="certificateUrl(cert.fileName)"
                target="_blank"
                rel="noopener noreferrer"
                (pointerdown)="stopPanelEvent($event)"
                [attr.aria-label]="'Abrir certificado ' + cert.title"
              >
                <span>Abrir certificado</span>
                <span class="cert-open-icon" aria-hidden="true">↗</span>
              </a>
            </footer>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    .certificaciones-panel {
      padding: 0.8rem;
      width: 100%;
      max-width: 980px;
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

    .cert-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      grid-auto-rows: 1fr;
      gap: 0.74rem;
      overflow: visible;
      align-content: start;
      flex: 0 0 auto;
    }

    .cert-card {
      --cert-accent: #7abcec;
      position: relative;
      overflow: hidden;
      border: 1px solid color-mix(in srgb, var(--cert-accent) 28%, var(--projects-card-border));
      background:
        radial-gradient(circle at 90% -6%, color-mix(in srgb, var(--cert-accent) 15%, transparent) 0%, transparent 42%),
        linear-gradient(180deg, color-mix(in srgb, var(--projects-card-bg) 84%, #ffffff) 0%, var(--projects-card-bg) 100%);
      border-radius: 14px;
      padding: 0.78rem 0.78rem 0.7rem;
      display: grid;
      gap: 0.6rem;
      align-content: start;
      height: 100%;
      box-shadow: 0 6px 16px rgba(32, 35, 49, 0.08);
      transition: transform 0.22s ease, box-shadow 0.25s ease, border-color 0.22s ease;
    }

    .cert-card::before {
      content: '';
      position: absolute;
      inset: 0 0 auto 0;
      height: 2px;
      background: linear-gradient(90deg, color-mix(in srgb, var(--cert-accent) 74%, #ffffff), transparent 90%);
    }

    .cert-card:hover {
      transform: translateY(-2px);
      border-color: color-mix(in srgb, var(--cert-accent) 50%, var(--projects-card-border));
      box-shadow: 0 12px 28px rgba(32, 35, 49, 0.14);
    }

    .cert-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.6rem;
    }

    .cert-badge {
      min-width: 2.55rem;
      height: 2.12rem;
      border-radius: 0.72rem;
      border: 1px solid color-mix(in srgb, var(--cert-accent) 32%, var(--projects-logo-border-base));
      background: color-mix(in srgb, var(--cert-accent) 10%, var(--projects-logo-bg));
      display: grid;
      place-items: center;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: color-mix(in srgb, #20304f 72%, var(--cert-accent));
      flex-shrink: 0;
    }

    .cert-year {
      font-size: 0.69rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      padding: 0.28rem 0.55rem;
      border-radius: 999px;
      color: color-mix(in srgb, var(--cert-accent) 76%, #334c74);
      border: 1px solid color-mix(in srgb, var(--cert-accent) 34%, transparent);
      background: color-mix(in srgb, var(--cert-accent) 9%, transparent);
      white-space: nowrap;
    }

    .cert-headline {
      display: grid;
      gap: 0.2rem;
    }

    .cert-title {
      margin: 0;
      font-size: 0.98rem;
      font-weight: 800;
      line-height: 1.2;
      color: var(--projects-title-color);
      overflow-wrap: anywhere;
    }

    .cert-meta {
      margin: 0;
      font-size: 0.76rem;
      color: var(--color-secondary);
      line-height: 1.25;
    }

    .cert-summary {
      margin: 0;
      font-size: 0.79rem;
      color: var(--color-secondary);
      line-height: 1.45;
    }

    .cert-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.34rem;
    }

    .cert-skill {
      font-size: 0.66rem;
      padding: 0.2rem 0.48rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--projects-chip-bg) 72%, #ffffff);
      color: var(--projects-chip-text);
      border: 1px solid color-mix(in srgb, var(--cert-accent) 22%, var(--projects-chip-border-base));
      white-space: nowrap;
    }

    .cert-card-footer {
      margin-top: auto;
      padding-top: 0.28rem;
      border-top: 1px solid color-mix(in srgb, var(--cert-accent) 14%, transparent);
      display: flex;
      justify-content: flex-end;
    }

    .cert-open-link {
      font-size: 0.76rem;
      font-weight: 700;
      line-height: 1;
      color: color-mix(in srgb, var(--cert-accent) 70%, #2f59c4);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.24rem;
      transition: gap 0.18s ease, color 0.2s ease;
      white-space: nowrap;
      cursor: pointer;
    }

    .cert-open-link:hover {
      gap: 0.38rem;
      color: color-mix(in srgb, var(--cert-accent) 82%, #2f59c4);
    }

    .cert-open-link:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--cert-accent) 62%, #7ca7ff);
      outline-offset: 3px;
      border-radius: 6px;
    }

    .cert-open-icon {
      font-size: 0.84rem;
      transform: translateY(-0.5px);
    }

    @media (max-width: 480px) {
      .certificaciones-panel {
        padding: 0.66rem;
      }

      .cert-grid {
        grid-template-columns: 1fr;
        grid-auto-rows: auto;
      }

      .cert-card {
        padding: 0.62rem;
      }

      .cert-title {
        font-size: 0.91rem;
      }

      .cert-meta,
      .cert-summary,
      .cert-open-link {
        font-size: 0.74rem;
      }

      .cert-year {
        font-size: 0.66rem;
      }
    }
  `]
})
export class CertificacionesComponent {
  protected readonly state = inject(PortfolioStateService);
  protected readonly certifications = CERTIFICATIONS;

  protected certificateUrl(fileName: string): string {
    return `/certificates/${encodeURIComponent(fileName)}`;
  }

  protected stopPanelEvent(event: Event): void {
    event.stopPropagation();
  }
}
