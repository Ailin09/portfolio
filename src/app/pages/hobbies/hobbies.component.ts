import { Component, inject } from '@angular/core';
import { PortfolioStateService } from '../../core/portfolio-state.service';

@Component({
  selector: 'app-hobbies',
  standalone: true,
  template: `
    <section class="hobbies-panel" [class.night]="state.lightMode() === 'night'">
      <p class="section-kicker">Perfil creativo</p>
      <h2 class="section-title">Hobbies</h2>
      <p class="section-intro">
        Más allá del desarrollo de software, disfruto de actividades creativas y expresivas
        que forman parte de mi identidad.
      </p>

      <div class="hobby-grid">
        <article class="hobby-block hobby-pasteleria">
          <p class="hobby-kicker">Creatividad manual</p>
          <h3 class="hobby-title">Pastelería profesional</h3>
          <p class="hobby-copy">
            Durante varios años trabajé de manera independiente creando mesas dulces y
            tortas para eventos. La cocina sigue siendo uno de mis espacios favoritos para
            experimentar y crear.
          </p>
        </article>

        <article class="hobby-block hobby-musica">
          <p class="hobby-kicker">Expresión escénica</p>
          <h3 class="hobby-title">Tango y DJ</h3>
          <p class="hobby-copy">
            También soy maestra de tango y DJ, dos formas distintas de conectar con la
            música, el movimiento y las personas. El tango me enseñó disciplina, escucha y
            sensibilidad; la música, improvisación y energía.
          </p>
        </article>

        <article class="hobby-block hobby-rituales">
          <p class="hobby-kicker">Bienestar diario</p>
          <h3 class="hobby-title">Rituales cotidianos</h3>
          <p class="hobby-copy">
            En lo cotidiano, encuentro disfrute en las cosas simples: cuidar mis plantas,
            tomar mate y jugar al vóley. Son espacios que me ayudan a mantener equilibrio,
            creatividad y foco.
          </p>
        </article>
      </div>

      <article class="hobby-quote">
        <p class="hobby-kicker">Transferencia a producto</p>
        <h3 class="hobby-title">Lo que me llevó a tecnología</h3>
        <p class="hobby-copy">
          Todo este recorrido creativo también se refleja en cómo diseño experiencias:
          observación, ritmo, detalle y conexión humana.
        </p>
      </article>
    </section>
  `,
  styles: [`
    .hobbies-panel {
      --hobbies-kicker: #516179;
      --hobbies-title: #101828;
      --hobbies-subtitle: #2a3648;
      --hobbies-muted: #5e6c80;
      --hobbies-border-soft: rgba(99, 122, 154, 0.24);
      width: min(95vw, 430px);
      max-height: min(54dvh, 460px);
      overflow-y: auto;
      padding: 0.95rem;
      background:
        radial-gradient(circle at 92% -8%, rgba(72, 129, 242, 0.08) 0%, transparent 42%),
        linear-gradient(180deg, color-mix(in srgb, var(--color-card-bg) 85%, #ffffff) 0%, var(--color-card-bg) 100%);
      border-radius: 16px;
      border: 1px solid var(--color-card-border);
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2);
      backdrop-filter: blur(12px);
      color: var(--color-primary);
      scrollbar-width: thin;
      scrollbar-color: rgba(90, 110, 138, 0.32) transparent;
      display: grid;
      gap: 0.72rem;
    }

    .hobbies-panel.night {
      --hobbies-kicker: #c4d5ec;
      --hobbies-title: #f5f9ff;
      --hobbies-subtitle: #e2ebf7;
      --hobbies-muted: #b9c7d9;
      --hobbies-border-soft: rgba(120, 153, 197, 0.3);
      background:
        radial-gradient(circle at 18% -12%, rgba(255, 77, 184, 0.18) 0%, transparent 44%),
        radial-gradient(circle at 84% -10%, rgba(64, 224, 255, 0.2) 0%, transparent 42%),
        linear-gradient(180deg, rgba(13, 18, 33, 0.9) 0%, rgba(10, 14, 26, 0.96) 100%);
      border-color: rgba(64, 224, 255, 0.46);
      box-shadow:
        0 0 20px rgba(64, 224, 255, 0.26),
        0 0 34px rgba(255, 77, 184, 0.18),
        0 14px 32px rgba(5, 8, 19, 0.64);
    }

    .section-kicker {
      margin: 0;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--hobbies-kicker);
    }

    .section-title {
      margin: 0;
      font-size: 1.13rem;
      font-weight: 800;
      color: var(--hobbies-title);
    }

    .section-intro {
      margin: 0;
      font-size: 0.81rem;
      line-height: 1.52;
      color: var(--hobbies-muted);
    }

    .hobby-grid {
      display: grid;
      gap: 0.6rem;
    }

    .hobby-block {
      --hobby-accent: #7da2db;
      position: relative;
      overflow: hidden;
      padding: 0.66rem 0.72rem;
      border: 1px solid color-mix(in srgb, var(--hobby-accent) 32%, var(--hobbies-border-soft));
      border-radius: 12px;
      background:
        linear-gradient(180deg, color-mix(in srgb, var(--hobby-accent) 7%, transparent) 0%, transparent 100%),
        rgba(255, 255, 255, 0.03);
      transition: transform 180ms ease, border-color 180ms ease, box-shadow 200ms ease;
    }

    .hobbies-panel.night .hobby-block {
      border-color: color-mix(in srgb, var(--hobby-accent) 45%, rgba(64, 224, 255, 0.46));
      background:
        linear-gradient(180deg, color-mix(in srgb, var(--hobby-accent) 14%, rgba(8, 14, 27, 0.7)) 0%, rgba(9, 14, 26, 0.72) 100%);
      box-shadow: inset 0 0 16px rgba(64, 224, 255, 0.08);
    }

    .hobby-block::before {
      content: '';
      position: absolute;
      inset: 0 0 auto 0;
      height: 2px;
      background: linear-gradient(90deg, color-mix(in srgb, var(--hobby-accent) 70%, #ffffff), transparent 85%);
    }

    .hobby-pasteleria { --hobby-accent: #9f8cf3; }
    .hobby-musica { --hobby-accent: #58b8f2; }
    .hobby-rituales { --hobby-accent: #74c6a0; }

    .hobby-kicker {
      margin: 0 0 0.24rem 0;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: color-mix(in srgb, var(--hobby-accent) 76%, var(--hobbies-kicker));
    }

    .hobby-title {
      margin: 0 0 0.3rem 0;
      font-size: 0.84rem;
      color: var(--hobbies-subtitle);
      letter-spacing: 0.01em;
    }

    .hobby-copy {
      margin: 0;
      font-size: 0.78rem;
      line-height: 1.45;
      color: var(--hobbies-muted);
    }

    .hobby-quote {
      --hobby-accent: #5fb0ff;
      margin-top: 0.14rem;
      padding: 0.72rem;
      border-radius: 12px;
      border: 1px solid color-mix(in srgb, var(--hobby-accent) 28%, var(--hobbies-border-soft));
      background:
        linear-gradient(90deg, color-mix(in srgb, var(--hobby-accent) 18%, transparent), transparent 42%),
        rgba(255, 255, 255, 0.04);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
    }

    .hobbies-panel.night .hobby-quote {
      border-color: rgba(64, 224, 255, 0.42);
      background:
        linear-gradient(90deg, rgba(64, 224, 255, 0.2) 0%, rgba(255, 77, 184, 0.09) 44%, transparent 78%),
        rgba(9, 14, 28, 0.78);
      box-shadow:
        inset 0 0 16px rgba(64, 224, 255, 0.08),
        0 8px 18px rgba(3, 8, 18, 0.5);
    }

    @media (hover: hover) {
      .hobby-block:hover {
        transform: translateY(-2px);
        border-color: color-mix(in srgb, var(--hobby-accent) 56%, var(--hobbies-border-soft));
        box-shadow: 0 9px 18px rgba(15, 23, 42, 0.15);
      }

      .hobbies-panel.night .hobby-block:hover {
        border-color: color-mix(in srgb, var(--hobby-accent) 55%, rgba(64, 224, 255, 0.62));
        box-shadow:
          0 0 14px color-mix(in srgb, var(--hobby-accent) 28%, rgba(64, 224, 255, 0.42)),
          0 12px 24px rgba(3, 8, 18, 0.58);
      }
    }

    @media (min-width: 600px) {
      .hobbies-panel {
        width: min(90vw, 560px);
        max-height: min(62dvh, 580px);
        padding: 1.05rem;
        gap: 0.8rem;
      }

      .section-title {
        font-size: 1.28rem;
      }

      .section-intro {
        font-size: 0.9rem;
      }

      .hobby-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.7rem;
      }

      .hobby-block {
        min-height: 100%;
      }

      .hobby-title {
        font-size: 0.9rem;
      }

      .hobby-copy {
        font-size: 0.83rem;
      }
    }

    @media (min-width: 900px) {
      .hobbies-panel {
        width: min(70vw, 680px);
        max-height: min(70dvh, 620px);
        padding: 1.15rem;
      }

      .hobby-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
  `]
})
export class HobbiesComponent {
  protected readonly state = inject(PortfolioStateService);
}
