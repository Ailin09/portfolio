import { Injectable, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export type Section = 'home' | 'proyectos' | 'hobbies' | 'sobre-mi' | 'contacto' | 'certificaciones';
export type LightMode = 'day' | 'night';

const PATH_TO_SECTION: Record<string, Section> = {
  '': 'home',
  'proyectos': 'proyectos',
  'hobbies': 'hobbies',
  'sobre-mi': 'sobre-mi',
  'contacto': 'contacto',
  'certificaciones': 'certificaciones'
};

@Injectable({ providedIn: 'root' })
export class PortfolioStateService {
  private readonly _hasEntered = signal(false);
  private readonly _hasEnteredHouse = signal(false);
  private readonly _hasEnteredNeonSign = signal(false);
  private readonly _neonSignZoomRequested = signal(false);
  private readonly _currentSection = signal<Section>('home');
  private readonly _selectedObject = signal<string | null>(null);
  private readonly _selectedProject = signal<string | null>(null);
  private readonly _lightMode = signal<LightMode>('day');

  readonly hasEntered = this._hasEntered.asReadonly();
  readonly hasEnteredHouse = this._hasEnteredHouse.asReadonly();
  readonly hasEnteredNeonSign = this._hasEnteredNeonSign.asReadonly();
  readonly neonSignZoomRequested = this._neonSignZoomRequested.asReadonly();
  readonly currentSection = this._currentSection.asReadonly();
  readonly selectedObject = this._selectedObject.asReadonly();
  readonly selectedProject = this._selectedProject.asReadonly();
  readonly lightMode = this._lightMode.asReadonly();

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.syncSectionFromUrl());
  }

  private syncSectionFromUrl(): void {
    const path = this.router.url.replace(/^\//, '') || '';
    const section = PATH_TO_SECTION[path] ?? 'home';
    this._currentSection.set(section);
  }

  enter(): void {
    this._hasEntered.set(true);
    this.router.navigate(['/']);
  }

  enterHouse(): void {
    this._hasEnteredHouse.set(true);
  }

  exitHouse(): void {
    this._hasEnteredHouse.set(false);
  }

  requestNeonSignZoom(): void {
    this._currentSection.set('sobre-mi');
    this._neonSignZoomRequested.set(true);
    this.router.navigate(['/sobre-mi']);
  }

  enterNeonSign(): void {
    this._hasEnteredNeonSign.set(true);
    this._neonSignZoomRequested.set(false);
  }

  exitNeonSign(): void {
    this._hasEnteredNeonSign.set(false);
  }

  clearNeonSignZoomRequest(): void {
    this._neonSignZoomRequested.set(false);
  }

  setSection(section: Section): void {
    this._currentSection.set(section);
    this._selectedObject.set(null);
    this._selectedProject.set(null);
    if (section !== 'sobre-mi') {
      this._hasEnteredNeonSign.set(false);
      this._neonSignZoomRequested.set(false);
    }
    this.router.navigate([section === 'home' ? '/' : section]);
  }

  selectObject(id: string | null): void {
    this._selectedObject.set(id);
  }

  selectProject(projectId: string | null): void {
    this._selectedProject.set(projectId);
  }

  clearSelection(): void {
    this._selectedObject.set(null);
  }

  clearProjectSelection(): void {
    this._selectedProject.set(null);
  }

  toggleLightMode(): void {
    this._lightMode.update(m => m === 'day' ? 'night' : 'day');
  }
}
