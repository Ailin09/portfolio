import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface CountApiResponse {
  value?: number;
  count?: number;
}

@Injectable({ providedIn: 'root' })
export class VisitorCounterService {
  private readonly apiBaseUrl = 'https://api.counterapi.dev/v1';
  private readonly namespace = 'ailin-portfolio';
  private readonly key = 'visitas';
  private readonly localFallbackKey = 'portfolio-visitor-fallback-count-v1';
  private readonly _count = signal<number | null>(null);
  private initializationPromise: Promise<number | null> | null = null;

  constructor(private readonly http: HttpClient) {}

  readonly count = this._count.asReadonly();

  async ensureInitialized(): Promise<number | null> {
    if (this._count() !== null) {
      return this._count();
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.registerVisit().finally(() => {
      this.initializationPromise = null;
    });

    const value = await this.initializationPromise;
    this._count.set(value);
    return value;
  }

  private async registerVisit(): Promise<number | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<CountApiResponse>(`${this.apiBaseUrl}/${this.namespace}/${this.key}/up`)
      );
      const remoteCount = this.extractRemoteCount(response);
      if (remoteCount !== null) {
        this.persistFallbackCount(remoteCount);
        return remoteCount;
      }
      return this.nextLocalFallbackCount();
    } catch {
      return this.nextLocalFallbackCount();
    }
  }

  private extractRemoteCount(response: CountApiResponse): number | null {
    const candidate = typeof response.count === 'number'
      ? response.count
      : typeof response.value === 'number'
        ? response.value
        : null;
    if (candidate === null || !Number.isFinite(candidate)) {
      return null;
    }
    return Math.max(0, Math.floor(candidate));
  }

  private nextLocalFallbackCount(): number {
    if (!this.canUseLocalStorage()) {
      return 0;
    }
    const raw = localStorage.getItem(this.localFallbackKey);
    const current = raw ? Number.parseInt(raw, 10) : 0;
    const next = Number.isFinite(current) && current >= 0 ? current + 1 : 1;
    localStorage.setItem(this.localFallbackKey, String(next));
    return next;
  }

  private persistFallbackCount(value: number): void {
    if (!this.canUseLocalStorage()) {
      return;
    }
    const safe = Math.max(0, Math.floor(value));
    localStorage.setItem(this.localFallbackKey, String(safe));
  }

  private canUseLocalStorage(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }
}
