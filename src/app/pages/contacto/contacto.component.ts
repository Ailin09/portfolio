import { Component, inject } from '@angular/core';
import { PortfolioStateService } from '../../core/portfolio-state.service';

@Component({
  selector: 'app-contacto',
  standalone: true,
  template: `
    <div
      class="contacto-panel"
      [class.night]="state.lightMode() === 'night'"
      (pointerdown)="stopPanelEvent($event)"
      (click)="stopPanelEvent($event)"
      (wheel)="stopPanelEvent($event)"
      (touchstart)="stopPanelEvent($event)"
    >
      <div class="section-head">
        <h2 class="section-title">Contacto</h2>
        <p class="section-desc">Elegí el canal que prefieras y te respondo pronto.</p>
      </div>
      <div class="contact-links">
        <a
          [href]="gmailComposeUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="contact-link contact-link--email"
          (pointerdown)="stopPanelEvent($event)"
          (click)="openExternal(gmailComposeUrl, $event)"
          aria-label="Abrir Gmail para enviar un correo a rutchleailin@gmail.com"
        >
          <span class="contact-icon" aria-hidden="true">✉</span>
          <span class="contact-content">
            <span class="contact-label">Email</span>
            <span class="contact-meta">rutchleailin@gmail.com</span>
          </span>
          <span class="contact-arrow" aria-hidden="true">→</span>
        </a>

        <a
          [href]="linkedinUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="contact-link contact-link--linkedin"
          (pointerdown)="stopPanelEvent($event)"
          (click)="openExternal(linkedinUrl, $event)"
          aria-label="Ir al perfil de LinkedIn de Ailín Rutchle"
        >
          <span class="contact-icon" aria-hidden="true">in</span>
          <span class="contact-content">
            <span class="contact-label">LinkedIn</span>
            <span class="contact-meta">linkedin.com/in/ailin-rutchle</span>
          </span>
          <span class="contact-arrow" aria-hidden="true">→</span>
        </a>
      </div>
      <p class="contact-note">Disponible para oportunidades, freelance y colaboraciones.</p>
    </div>
  `,
  styles: [`
    .contacto-panel {
      width: min(92vw, 520px);
      padding: 1.35rem;
      background: var(--color-card-bg);
      border-radius: 16px;
      border: 1px solid var(--color-card-border);
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(12px);
    }

    .contacto-panel.night {
      background: var(--color-panel-night);
      border-color: rgba(64, 224, 255, 0.3);
      box-shadow: 0 0 16px rgba(64, 224, 255, 0.2), 0 0 24px rgba(255, 77, 184, 0.12);
    }

    .section-head {
      margin-bottom: 0.9rem;
    }

    .section-title {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--color-primary);
      margin: 0 0 0.35rem 0;
      letter-spacing: 0.01em;
    }

    .contacto-panel.night .section-title {
      color: white;
      text-shadow: 0 0 14px rgba(255, 77, 184, 0.45);
    }

    .section-desc {
      font-size: 0.92rem;
      line-height: 1.4;
      color: var(--color-secondary);
      margin: 0;
    }

    .contacto-panel.night .section-desc {
      color: rgba(255, 255, 255, 0.85);
    }

    .contact-links {
      display: grid;
      gap: 0.65rem;
    }

    .contact-link {
      text-decoration: none;
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 0.75rem;
      min-height: 3.25rem;
      padding: 0.75rem 0.85rem;
      border-radius: 12px;
      border: 1px solid rgba(27, 55, 93, 0.14);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.48));
      color: var(--color-link);
      transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
    }

    .contact-link:hover {
      transform: translateY(-1px);
      border-color: rgba(27, 55, 93, 0.24);
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.1);
    }

    .contact-link:focus-visible {
      outline: 2px solid rgba(36, 99, 235, 0.65);
      outline-offset: 2px;
    }

    .contacto-panel.night .contact-link {
      color: var(--color-link-night);
      border-color: rgba(255, 77, 184, 0.24);
      background: linear-gradient(180deg, rgba(35, 37, 72, 0.9), rgba(29, 31, 59, 0.82));
      text-shadow: 0 0 10px rgba(255, 77, 184, 0.22);
    }

    .contacto-panel.night .contact-link:hover {
      border-color: rgba(255, 77, 184, 0.45);
      box-shadow: 0 0 16px rgba(255, 77, 184, 0.2);
    }

    .contact-icon {
      width: 1.95rem;
      height: 1.95rem;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.82rem;
      background: rgba(52, 103, 242, 0.12);
      color: #1d4ed8;
    }

    .contact-link--email .contact-icon {
      background: rgba(236, 72, 153, 0.12);
      color: #be185d;
      font-size: 0.9rem;
    }

    .contact-link--linkedin .contact-icon {
      background: rgba(14, 116, 144, 0.14);
      color: #0e7490;
      font-size: 0.74rem;
      letter-spacing: -0.01em;
    }

    .contacto-panel.night .contact-icon {
      background: rgba(118, 132, 255, 0.24);
      color: #dbe9ff;
    }

    .contact-content {
      display: grid;
      gap: 0.16rem;
      min-width: 0;
    }

    .contact-label {
      font-size: 0.94rem;
      font-weight: 700;
      color: var(--color-primary);
    }

    .contacto-panel.night .contact-label {
      color: #f9f5ff;
    }

    .contact-meta {
      font-size: 0.78rem;
      opacity: 0.8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .contact-arrow {
      opacity: 0.55;
      font-size: 1rem;
      transition: transform 160ms ease, opacity 160ms ease;
    }

    .contact-link:hover .contact-arrow {
      transform: translateX(2px);
      opacity: 0.9;
    }

    .contact-note {
      margin: 0.82rem 0 0 0;
      font-size: 0.78rem;
      color: var(--color-secondary);
      opacity: 0.88;
    }

    .contacto-panel.night .contact-note {
      color: rgba(255, 255, 255, 0.82);
    }

    @media (max-width: 768px) {
      .contacto-panel {
        width: min(95vw, 500px);
        padding: 0.95rem;
      }

      .section-title {
        font-size: 1.14rem;
      }

      .section-desc {
        font-size: 0.83rem;
      }

      .contact-link {
        min-height: 3rem;
        padding: 0.66rem 0.7rem;
      }
    }

    @media (max-width: 480px) {
      .contacto-panel {
        width: min(97vw, 430px);
        padding: 0.8rem;
        max-height: min(48dvh, 360px);
        overflow-y: auto;
      }

      .section-title {
        font-size: 1rem;
      }

      .section-desc {
        font-size: 0.76rem;
      }

      .contact-link {
        min-height: 2.9rem;
        gap: 0.56rem;
        border-radius: 10px;
      }

      .contact-icon {
        width: 1.75rem;
        height: 1.75rem;
      }

      .contact-label {
        font-size: 0.86rem;
      }

      .contact-meta {
        font-size: 0.72rem;
      }

      .contact-note {
        font-size: 0.72rem;
      }
    }
  `]
})
export class ContactoComponent {
  protected readonly state = inject(PortfolioStateService);
  protected readonly linkedinUrl = 'https://www.linkedin.com/in/ailin-rutchle/';
  protected readonly gmailComposeUrl = 'https://mail.google.com/mail/?view=cm&fs=1&to=rutchleailin@gmail.com&su=Contacto%20desde%20portfolio';

  protected stopPanelEvent(event: Event): void {
    event.stopPropagation();
  }

  protected openExternal(url: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const opened = window.open(url, '_blank');
    if (opened) {
      opened.opener = null;
      return;
    }
    window.location.href = url;
  }
}
