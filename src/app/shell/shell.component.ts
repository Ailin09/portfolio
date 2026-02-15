import { Component, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EntryComponent } from '../pages/entry/entry.component';
import { PortfolioComponent } from '../pages/portfolio/portfolio.component';
import { PortfolioStateService } from '../core/portfolio-state.service';

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
  `
})
export class ShellComponent {
  protected readonly state = inject(PortfolioStateService);
}
