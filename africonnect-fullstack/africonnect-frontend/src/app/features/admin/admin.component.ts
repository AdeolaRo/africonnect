import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, TranslateModule],
  template: `
    <div class="admin-container">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <h1 style="margin:0;">{{ 'admin.home.title' | translate }}</h1>
        <button type="button" class="btn btn-secondary btn-sm" (click)="goBack()">{{ 'admin.home.back' | translate }}</button>
      </div>

      <div class="admin-grid">
        <a class="admin-card" routerLink="/moderation">
          <div class="admin-emoji">🛡️</div>
          <div class="admin-title">{{ 'admin.home.moderationTitle' | translate }}</div>
          <div class="admin-desc">{{ 'admin.home.moderationDesc' | translate }}</div>
        </a>
        <a class="admin-card" routerLink="/admin/users">
          <div class="admin-emoji">👥</div>
          <div class="admin-title">{{ 'admin.home.usersTitle' | translate }}</div>
          <div class="admin-desc">{{ 'admin.home.usersDesc' | translate }}</div>
        </a>
        <a class="admin-card" routerLink="/admin/ads">
          <div class="admin-emoji">📺</div>
          <div class="admin-title">{{ 'admin.home.adsTitle' | translate }}</div>
          <div class="admin-desc">{{ 'admin.home.adsDesc' | translate }}</div>
        </a>
        <a class="admin-card" routerLink="/admin/ad-requests">
          <div class="admin-emoji">📣</div>
          <div class="admin-title">{{ 'admin.home.adRequestsTitle' | translate }}</div>
          <div class="admin-desc">{{ 'admin.home.adRequestsDesc' | translate }}</div>
        </a>
        <a class="admin-card" routerLink="/admin/rss">
          <div class="admin-emoji">📰</div>
          <div class="admin-title">{{ 'admin.home.rssTitle' | translate }}</div>
          <div class="admin-desc">{{ 'admin.home.rssDesc' | translate }}</div>
        </a>
        <a class="admin-card" routerLink="/admin/legal">
          <div class="admin-emoji">📜</div>
          <div class="admin-title">{{ 'admin.home.legalTitle' | translate }}</div>
          <div class="admin-desc">{{ 'admin.home.legalDesc' | translate }}</div>
        </a>
        <a class="admin-card" routerLink="/admin/access-logs">
          <div class="admin-emoji">📡</div>
          <div class="admin-title">{{ 'admin.home.accessLogTitle' | translate }}</div>
          <div class="admin-desc">{{ 'admin.home.accessLogDesc' | translate }}</div>
        </a>
      </div>

      <div class="admin-panel">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .admin-container { background: var(--surface); border-radius: 24px; padding: 24px; border: 1px solid var(--border); }
    .admin-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
    .admin-card { display: block; padding: 18px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text); text-decoration: none; }
    .admin-card:hover { border-color: var(--primary); }
    .admin-emoji { font-size: 1.8rem; margin-bottom: 8px; }
    .admin-title { font-weight: 800; margin-bottom: 4px; }
    .admin-desc { color: var(--text-muted); font-size: 0.95rem; }
    .admin-panel { padding-top: 8px; }
    @media (max-width: 900px) { .admin-grid { grid-template-columns: 1fr; } }
    @media (max-width: 768px) {
      .admin-container { padding: 12px; border-radius: 18px; }
      .admin-grid { gap: 10px; }
      .admin-card { padding: 14px; border-radius: 16px; }
      .admin-emoji { font-size: 1.45rem; margin-bottom: 6px; }
      .admin-desc { font-size: 0.88rem; line-height: 1.35; }
    }
  `]
})
export class AdminComponent {
  constructor(private router: Router) {}

  goBack() {
    if (this.router.url === '/admin') {
      this.router.navigate(['/forum']);
      return;
    }
    this.router.navigate(['/admin']);
  }
}
