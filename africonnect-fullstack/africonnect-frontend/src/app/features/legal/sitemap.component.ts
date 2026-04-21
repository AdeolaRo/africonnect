import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sitemap',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="item-card">
      <h1 style="margin-top:0;">{{ 'footer.sitemap' | translate }}</h1>

      <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
        <a routerLink="/forum" style="color: var(--secondary); text-decoration:none;">{{ 'nav.forum' | translate }}</a>
        <a routerLink="/marketplace" style="color: var(--secondary); text-decoration:none;">{{ 'nav.marketplace' | translate }}</a>
        <a routerLink="/emploi" style="color: var(--secondary); text-decoration:none;">{{ 'nav.jobs' | translate }}</a>
        <a routerLink="/solutions" style="color: var(--secondary); text-decoration:none;">{{ 'nav.solutions' | translate }}</a>
        <a routerLink="/solidarite" style="color: var(--secondary); text-decoration:none;">{{ 'nav.solidarity' | translate }}</a>
        <a routerLink="/evenements" style="color: var(--secondary); text-decoration:none;">{{ 'nav.events' | translate }}</a>
        <a routerLink="/groupes" style="color: var(--secondary); text-decoration:none;">{{ 'nav.groups' | translate }}</a>
        <a routerLink="/recherche" style="color: var(--secondary); text-decoration:none;">{{ 'search.placeholder' | translate }}</a>

        <div style="margin-top:8px; padding-top:10px; border-top:1px solid var(--border);">
          <a routerLink="/legal" style="color: var(--secondary); text-decoration:none;">{{ 'footer.legal' | translate }}</a>
        </div>
      </div>
    </div>
  `
})
export class SitemapComponent {}

