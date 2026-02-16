import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface CountApiResponse {
  value: number;
}

@Injectable({ providedIn: 'root' })
export class VisitorCounterService {
  private readonly apiBaseUrl = 'https://api.countapi.xyz';
  private readonly namespace = 'ailin-portfolio';
  private readonly key = 'visitas';
  private readonly localStorageKey = 'portfolio-visitor-counted-v1';
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
    const shouldIncrement = this.shouldIncrementVisit();
    const endpoint = shouldIncrement
      ? `/hit/${this.namespace}/${this.key}`
      : `/get/${this.namespace}/${this.key}`;

    try {
      const response = await firstValueFrom(
        this.http.get<CountApiResponse>(`${this.apiBaseUrl}${endpoint}`)
      );

      if (shouldIncrement && this.canUseLocalStorage()) {
        localStorage.setItem(this.localStorageKey, '1');
      }

      return typeof response.value === 'number' ? response.value : null;
    } catch {
      return null;
    }
  }

  private shouldIncrementVisit(): boolean {
    if (!this.canUseLocalStorage()) {
      return false;
    }

    return localStorage.getItem(this.localStorageKey) !== '1';
  }

  private canUseLocalStorage(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }
}
