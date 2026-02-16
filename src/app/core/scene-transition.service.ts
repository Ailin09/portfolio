import { Injectable, signal } from '@angular/core';

export type SceneTransitionKind = 'theme' | 'door' | 'entry';
export type SceneTransitionPhase = 'idle' | 'fading-in' | 'active' | 'fading-out';

interface BeginTransitionOptions {
  kind: SceneTransitionKind;
  label?: string;
  minVisibleMs?: number;
  fadeInMs?: number;
  fadeOutMs?: number;
  startTaskDelayMs?: number;
}

const DEFAULT_LABELS: Record<SceneTransitionKind, string> = {
  theme: 'Sincronizando iluminacion...',
  door: 'Entrando a la oficina...',
  entry: 'Cargando escena principal...'
};

const DEFAULT_FADE_IN_MS = 240;
const DEFAULT_FADE_OUT_MS = 360;
const DEFAULT_MIN_VISIBLE_MS = 520;

@Injectable({ providedIn: 'root' })
export class SceneTransitionService {
  private readonly _isVisible = signal(false);
  private readonly _phase = signal<SceneTransitionPhase>('idle');
  private readonly _label = signal<string>('');
  private readonly _kind = signal<SceneTransitionKind | null>(null);

  readonly isVisible = this._isVisible.asReadonly();
  readonly phase = this._phase.asReadonly();
  readonly label = this._label.asReadonly();
  readonly kind = this._kind.asReadonly();

  private activeCount = 0;
  private minVisibleUntil = 0;
  private closeSequence = 0;

  begin(options: BeginTransitionOptions): symbol {
    const token = Symbol(options.kind);
    const now = performance.now();
    const fadeInMs = options.fadeInMs ?? DEFAULT_FADE_IN_MS;
    const minVisibleMs = options.minVisibleMs ?? DEFAULT_MIN_VISIBLE_MS;

    this.activeCount += 1;
    this.minVisibleUntil = Math.max(this.minVisibleUntil, now + minVisibleMs);
    this._label.set(options.label ?? DEFAULT_LABELS[options.kind]);
    this._kind.set(options.kind);

    if (!this._isVisible()) {
      this._isVisible.set(true);
      this._phase.set('fading-in');
      const sequence = ++this.closeSequence;
      window.setTimeout(() => {
        if (sequence !== this.closeSequence || !this._isVisible()) return;
        this._phase.set('active');
      }, Math.max(0, fadeInMs));
    } else if (this._phase() === 'fading-out') {
      this._phase.set('active');
      this.closeSequence += 1;
    }

    return token;
  }

  async end(token: symbol, options?: Pick<BeginTransitionOptions, 'fadeOutMs'>): Promise<void> {
    if (!token) return;
    if (this.activeCount <= 0) return;
    this.activeCount = Math.max(0, this.activeCount - 1);
    if (this.activeCount > 0 || !this._isVisible()) return;

    const now = performance.now();
    const waitMs = Math.max(0, this.minVisibleUntil - now);
    if (waitMs > 0) await this.wait(waitMs);
    if (this.activeCount > 0 || !this._isVisible()) return;

    this._phase.set('fading-out');
    const sequence = ++this.closeSequence;
    await this.wait(options?.fadeOutMs ?? DEFAULT_FADE_OUT_MS);
    if (sequence !== this.closeSequence || this.activeCount > 0) return;

    this._isVisible.set(false);
    this._phase.set('idle');
    this._label.set('');
    this._kind.set(null);
    this.minVisibleUntil = 0;
  }

  async run<T>(
    options: BeginTransitionOptions,
    task: () => Promise<T> | T
  ): Promise<T> {
    const token = this.begin(options);
    try {
      const startDelay = options.startTaskDelayMs ?? 0;
      if (startDelay > 0) await this.wait(startDelay);
      return await task();
    } finally {
      await this.end(token, { fadeOutMs: options.fadeOutMs });
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, Math.max(0, ms));
    });
  }
}
