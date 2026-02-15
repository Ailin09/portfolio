import { Component, inject } from '@angular/core';
import { PortfolioStateService } from '../../core/portfolio-state.service';

@Component({
  selector: 'app-sobre-mi',
  standalone: true,
  template: `
    <div
      class="sobre-panel"
      [class.night]="state.lightMode() === 'night'"
      [class.sobre-panel--expanded]="state.hasEnteredNeonSign()"
    >
      <section class="board-zoom" aria-label="Presentación personal estilo pizarra">
        <header class="board-header">
          <h2 class="board-title">Sobre mí</h2>
        </header>

        <div class="board-surface">
          <article class="sticky sticky--intro">
            <span class="pin" aria-hidden="true"></span>
            <h3>Frontend Angular</h3>
            <p>
              Soy desarrolladora Frontend especializada en Angular, con experiencia construyendo
              aplicaciones web orientadas a negocio.
            </p>
          </article>

          <article class="sticky sticky--impact">
            <span class="pin" aria-hidden="true"></span>
            <h3>Lo que me mueve</h3>
            <p>
              Me gusta transformar ideas en productos reales, funcionales y bien pensados.
            </p>
          </article>

          <article class="sticky sticky--method">
            <span class="pin" aria-hidden="true"></span>
            <h3>MI FORMA DE TRABAJAR</h3>
            <p>
              Disfruto trabajar en equipos donde las decisiones técnicas tienen impacto, optimizando
              flujos, mejorando el rendimiento y cuidando la experiencia del usuario.
            </p>
          </article>

          <article class="sticky sticky--photo">
            <span class="pin" aria-hidden="true"></span>
            @if (profileImageUrl) {
              <img [src]="profileImageUrl" alt="Foto de Ailín" class="profile-photo" />
            } @else {
              <div class="photo-placeholder">
                <span>Tu foto</span>
              </div>
            }
          </article>

          <article class="sticky sticky--signature">
            <span class="pin" aria-hidden="true"></span>
            <p class="signature-text">AQUÍ SE SUEÑA</p>
          </article>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .sobre-panel {
      width: 100%;
      padding: 0.42rem;
    }

    .sobre-panel--expanded {
      padding: 0.42rem;
    }

    .board-zoom {
      position: relative;
      border-radius: 4px;
      border: 8px solid #eceff1;
      background: linear-gradient(160deg, #f7fafc, #e6eaef);
      box-shadow: 0 18px 24px rgba(71, 64, 54, 0.2);
      padding: 0.9rem;
      overflow: hidden;
      transform: scale(1.015);
      transform-origin: center;
      transition: transform 180ms ease, box-shadow 180ms ease;
    }

    .sobre-panel--expanded .board-zoom {
      transform: scale(1.03);
      box-shadow: 0 22px 30px rgba(71, 64, 54, 0.28);
    }

    .sobre-panel.night .board-zoom {
      border-color: rgba(190, 228, 255, 0.95) !important;
      background:
        radial-gradient(circle at 50% 44%, rgba(159, 96, 255, 0.24), rgba(28, 20, 70, 0) 54%),
        linear-gradient(155deg, #222b63, #141b44 66%, #101638) !important;
      box-shadow:
        0 0 0 1px rgba(152, 228, 255, 0.24) inset,
        0 0 26px rgba(89, 201, 255, 0.28),
        0 20px 34px rgba(3, 5, 18, 0.66) !important;
    }

    .board-header {
      position: relative;
      z-index: 2;
      margin-bottom: 0.65rem;
    }

    .board-title {
      margin: 0.2rem 0 0 0;
      color: #5a5246;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 1.34rem;
      letter-spacing: 0.03em;
    }

    .sobre-panel.night .board-title {
      color: #e8f3ff;
    }

    .board-surface {
      position: relative;
      min-height: 0;
      aspect-ratio: 1.7 / 1;
      border-radius: 3px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.62), rgba(255, 255, 255, 0)),
        #ffffff;
      border: 3px solid #e8edf2;
      overflow: hidden;
    }

    .board-surface::before,
    .board-surface::after {
      content: '';
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #cf1822;
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.32) inset, 0 1px 2px rgba(0, 0, 0, 0.25);
      opacity: 0.95;
      pointer-events: none;
    }

    .board-surface::before {
      top: 1.2rem;
      left: 2.9rem;
    }

    .board-surface::after {
      right: 2.2rem;
      bottom: 2.7rem;
    }

    .sobre-panel.night .board-surface {
      background:
        radial-gradient(circle at 50% 40%, rgba(173, 104, 255, 0.34), rgba(29, 20, 74, 0) 52%),
        linear-gradient(180deg, #1d2f6f 0%, #111c4a 56%, #0b1437 100%) !important;
      border-color: rgba(140, 229, 255, 0.56) !important;
      box-shadow: inset 0 0 0 1px rgba(168, 228, 255, 0.12);
    }

    .sticky {
      position: absolute;
      width: calc(50% - 0.95rem);
      min-height: 110px;
      padding: 1.05rem 0.7rem 0.65rem;
      border-radius: 2px;
      border: 1px solid rgba(173, 154, 98, 0.45);
      box-shadow: 0 7px 8px rgba(47, 40, 24, 0.18);
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 0.28rem;
      transform-origin: top center;
      transition: transform 150ms ease;
      isolation: isolate;
    }

    .sticky:hover {
      transform: translateY(-4px) scale(1.03) rotate(var(--r, 0deg));
    }

    .sticky::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: -6px;
      height: 8px;
      background:
        linear-gradient(
          -45deg,
          rgba(0, 0, 0, 0.12) 0 2px,
          transparent 2px 4px
        );
      opacity: 0.22;
      pointer-events: none;
    }

    .sticky h3 {
      margin: 0;
      font-size: 0.98rem;
      color: #5b4f22;
      line-height: 1.25;
    }

    .sticky p {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.38;
      color: #665934;
    }

    .sticky--intro h3,
    .sticky--intro p {
      font-family: 'Patrick Hand', 'Segoe Print', cursive;
    }

    .sticky--impact h3,
    .sticky--impact p {
      font-family: 'Gloria Hallelujah', 'Segoe Print', cursive;
    }

    .sticky--method h3 {
      font-family: 'Permanent Marker', 'Segoe Print', cursive;
      letter-spacing: 0.01em;
    }

    .sticky--method p {
      font-family: 'Caveat Brush', 'Segoe Print', cursive;
      font-size: 0.92rem;
      line-height: 1.3;
    }

    .pin {
      position: absolute;
      top: 0.28rem;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background:
        radial-gradient(circle at 32% 30%, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0) 44%),
        linear-gradient(145deg, #e82a30, #b90d1c);
      box-shadow: 0 1px 3px rgba(45, 16, 16, 0.45);
    }

    .sticky--intro {
      --r: -7deg;
      left: 0.85rem;
      top: 0.9rem;
      transform: rotate(var(--r));
      background: #d7c14f;
    }

    .sticky--impact {
      --r: 5deg;
      right: 0.8rem;
      top: 1rem;
      transform: rotate(var(--r));
      background: #d8c253;
    }

    .sticky--method {
      --r: -4deg;
      left: 0.95rem;
      top: 12.5rem;
      transform: rotate(var(--r));
      background: #d4bf50;
    }

    .sticky--photo {
      --r: -6deg;
      right: 0.85rem;
      top: 12.8rem;
      width: calc(50% - 0.95rem);
      min-height: 130px;
      transform: rotate(var(--r));
      background: #f0eadf;
    }

    .sticky--signature {
      --r: 6deg;
      left: 50%;
      bottom: 1rem;
      width: calc(100% - 1.8rem);
      min-height: 86px;
      transform: translateX(-50%) rotate(var(--r));
      background: #d7c14f;
      justify-content: center;
      align-items: center;
    }

    .sobre-panel.night .sticky {
      border-color: rgba(172, 157, 88, 0.72);
      box-shadow: 0 8px 14px rgba(3, 5, 18, 0.55);
    }

    .sobre-panel.night .sticky::after {
      opacity: 0.32;
    }

    .sobre-panel.night .sticky h3,
    .sobre-panel.night .sticky p {
      color: #4f451d;
    }

    .sobre-panel.night .sticky--intro {
      background: #f2e8b3;
    }

    .sobre-panel.night .sticky--impact {
      background: #f4e7af;
    }

    .sobre-panel.night .sticky--method {
      background: #f5e9b7;
    }

    .sobre-panel.night .sticky--signature {
      background: #f0e2a1;
    }

    .sobre-panel.night .photo-placeholder {
      background: rgba(228, 236, 255, 0.88);
      border-color: rgba(189, 210, 255, 0.56);
      color: #394568;
    }

    .sobre-panel.night .pin {
      background:
        radial-gradient(circle at 32% 30%, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0) 44%),
        linear-gradient(145deg, #ff3f47, #c20f21);
      box-shadow: 0 0 8px rgba(255, 52, 68, 0.45), 0 1px 3px rgba(45, 16, 16, 0.45);
    }

    .signature-text {
      font-family: 'Caveat Brush', 'Dancing Script', cursive;
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #53471f;
      text-align: center;
      line-height: 1.05;
      text-shadow: none;
    }

    .profile-photo {
      width: 100%;
      aspect-ratio: 1 / 1;
      border-radius: 3px;
      object-fit: cover;
      border: 1px solid rgba(122, 112, 93, 0.32);
      box-shadow: 0 5px 8px rgba(56, 45, 31, 0.14);
    }

    .photo-placeholder {
      width: 100%;
      aspect-ratio: 1 / 1;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.45);
      border: 1px dashed rgba(68, 42, 24, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.74rem;
      color: #6f644b;
    }

    @media (min-width: 861px) {
      .sobre-panel:not(.night) .board-zoom {
        padding: 1rem;
      }

      .board-zoom {
        max-width: 1200px;
        margin: 0 auto;
      }

      .board-surface {
        min-height: 0;
        aspect-ratio: 2.05 / 1;
      }

      .sticky {
        width: clamp(178px, 22%, 246px);
      }

      .sticky h3 {
        font-size: 1.14rem;
        line-height: 1.2;
      }

      .sticky p {
        font-size: 1.02rem;
        line-height: 1.33;
      }

      .sticky--method p {
        font-size: 1.1rem;
      }

      .sticky--intro {
        left: 6%;
        top: 12%;
      }

      .sticky--impact {
        right: auto;
        left: 39%;
        top: 10%;
      }

      .sticky--method {
        left: auto;
        right: 6%;
        top: 14%;
      }

      .sticky--photo {
        left: 18%;
        right: auto;
        top: auto;
        bottom: 12%;
        width: clamp(194px, 23%, 252px);
      }

      .sticky--signature {
        left: auto;
        right: 10%;
        bottom: 14%;
        width: clamp(194px, 22%, 246px);
        min-height: 112px;
        transform: rotate(6deg);
      }

      .signature-text {
        font-size: 1.62rem;
      }
    }

    @media (max-width: 768px) {
      .board-zoom {
        padding: 0.72rem;
      }

      .board-title {
        font-size: 1.08rem;
      }

      .board-surface {
        aspect-ratio: auto;
        min-height: min(500px, 70dvh);
      }

      .sticky {
        width: calc(50% - 0.7rem);
        min-height: 96px;
        padding: 0.88rem 0.58rem 0.52rem;
      }

      .sticky h3 {
        font-size: 0.8rem;
      }

      .sticky p {
        font-size: 0.76rem;
      }

      .sticky--intro {
        left: 0.55rem;
        top: 0.72rem;
      }

      .sticky--impact {
        right: 0.52rem;
        top: 0.78rem;
      }

      .sticky--method {
        left: 0.62rem;
        top: 10.8rem;
      }

      .sticky--photo {
        right: 0.56rem;
        top: 11.15rem;
        width: calc(50% - 0.72rem);
      }

      .sticky--signature {
        width: calc(100% - 1.15rem);
        min-height: 78px;
        bottom: 0.68rem;
      }

      .signature-text {
        font-size: 1rem;
      }
    }

    @media (max-width: 480px) {
      .sobre-panel,
      .sobre-panel--expanded {
        padding: 0.3rem;
      }

      .board-zoom {
        padding: 0.58rem;
        border-radius: 14px;
      }

      .board-title {
        font-size: 0.96rem;
      }

      .board-surface {
        aspect-ratio: auto;
        min-height: min(450px, 65dvh);
      }

      .sticky {
        width: calc(50% - 0.5rem);
        min-height: 84px;
        padding: 0.72rem 0.45rem 0.42rem;
      }

      .sticky h3 {
        font-size: 0.74rem;
        line-height: 1.2;
      }

      .sticky p {
        font-size: 0.7rem;
        line-height: 1.3;
      }

      .sticky--intro {
        left: 0.42rem;
      }

      .sticky--impact {
        right: 0.4rem;
      }

      .sticky--method {
        left: 0.44rem;
        top: 9.8rem;
      }

      .sticky--photo {
        right: 0.4rem;
        top: 10rem;
      }

      .sticky--signature {
        width: calc(100% - 0.9rem);
        min-height: 68px;
        bottom: 0.45rem;
      }

      .signature-text {
        font-size: 0.86rem;
      }

      .pin {
        width: 10px;
        height: 10px;
      }
    }
  `]
})
export class SobreMiComponent {
  protected readonly state = inject(PortfolioStateService);
  profileImageUrl = '/images/ailin.png';
}
