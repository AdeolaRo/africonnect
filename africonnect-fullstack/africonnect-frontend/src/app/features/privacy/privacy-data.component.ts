import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { CookieConsentService } from '../../core/services/cookie-consent.service';

@Component({
  selector: 'app-privacy-data',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink],
  template: `
    <div class="privacy-page">
      <a routerLink="/profile" class="back-link">← {{ 'privacy.backProfile' | translate }}</a>
      <h1>{{ 'privacy.title' | translate }}</h1>
      <p class="lead text-muted">{{ 'privacy.subtitle' | translate }}</p>

      <section class="privacy-card">
        <h2>{{ 'privacy.cookiesTitle' | translate }}</h2>
        <p class="text-muted small">{{ 'privacy.cookiesText' | translate }}</p>
        <label class="opt-row">
          <input type="checkbox" [ngModel]="cc.analytics" (ngModelChange)="onAnalytics($event)">
          <span>{{ 'privacy.cookiesAnalytics' | translate }}</span>
        </label>
        <div class="btn-row">
          <button type="button" class="btn btn-secondary btn-sm" (click)="cookieOnlyEssential()">{{ 'privacy.cookiesEssential' | translate }}</button>
          <button type="button" class="btn btn-primary btn-sm" (click)="cookieAcceptAll()">{{ 'privacy.cookiesAll' | translate }}</button>
        </div>
      </section>

      <section class="privacy-card">
        <h2>{{ 'privacy.exportTitle' | translate }}</h2>
        <p class="text-muted small">{{ 'privacy.exportHint' | translate }}</p>
        <div class="btn-row">
          <button type="button" class="btn btn-primary" (click)="exportJson()" [disabled]="exporting">
            {{ exporting ? ('common.sending' | translate) : ('privacy.exportJson' | translate) }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="exportCsvSummary()" [disabled]="exporting">
            {{ 'privacy.exportCsv' | translate }}
          </button>
        </div>
      </section>

      <section class="privacy-card">
        <h2>{{ 'privacy.deleteTitle' | translate }}</h2>
        <p class="text-muted small">{{ 'privacy.deleteHint' | translate }}</p>
        <a routerLink="/profile" class="btn btn-danger btn-sm inline">{{ 'privacy.goDeleteAccount' | translate }}</a>
      </section>

      <section class="privacy-card" *ngIf="isAdmin">
        <h2>{{ 'privacy.adminTitle' | translate }}</h2>
        <p class="text-muted small">{{ 'privacy.adminHint' | translate }}</p>
        <button type="button" class="btn btn-secondary" (click)="goAccessLogs()">{{ 'privacy.openAccessLogs' | translate }}</button>
      </section>

      <p class="legal-foot text-muted small">{{ 'privacy.legalFoot' | translate }}</p>
    </div>
  `,
  styles: [`
    .privacy-page { max-width: 720px; margin: 0 auto; padding: 20px 16px 48px; }
    .back-link { display: inline-block; margin-bottom: 16px; color: var(--secondary); text-decoration: none; }
    .back-link:hover { text-decoration: underline; }
    .lead { font-size: 1.05rem; line-height: 1.5; }
    .privacy-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 20px;
      margin-top: 20px;
    }
    .privacy-card h2 { margin: 0 0 10px; font-size: 1.15rem; }
    .opt-row { display: flex; align-items: flex-start; gap: 10px; margin: 12px 0; cursor: pointer; }
    .btn-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
    .legal-foot { margin-top: 28px; }
    .small { font-size: 0.9rem; }
    a.inline { text-decoration: none; display: inline-block; }
  `]
})
export class PrivacyDataComponent implements OnInit {
  cc = this.cookie.get();
  isAdmin = false;
  exporting = false;

  constructor(
    private api: ApiService,
    private cookie: CookieConsentService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.api.get('user/profile').subscribe((p: any) => {
      this.isAdmin = p?.role === 'admin';
      if (typeof p?.analyticsOptIn === 'boolean' && p.analyticsOptIn) {
        this.cc = { ...this.cookie.get(), analytics: true, decided: true };
        this.cookie.setAnalytics(true);
      }
    });
  }

  onAnalytics(v: boolean): void {
    this.cc = { ...this.cc, analytics: v, decided: true };
    this.cookie.setAnalytics(v);
    this.api.put('user/cookie-preferences', { analyticsOptIn: v }).subscribe({ error: () => {} });
  }

  cookieOnlyEssential(): void {
    this.cookie.acceptEssentialOnly();
    this.cc = this.cookie.get();
    this.onAnalytics(false);
  }

  cookieAcceptAll(): void {
    this.cookie.acceptAll();
    this.cc = this.cookie.get();
    this.onAnalytics(true);
  }

  exportJson(): void {
    this.exporting = true;
    this.api.get('user/data-export').subscribe({
      next: (data: any) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, `africanconnect-donnees-${Date.now()}.json`);
        this.exporting = false;
      },
      error: () => {
        alert(this.translate.instant('privacy.exportError'));
        this.exporting = false;
      }
    });
  }

  exportCsvSummary(): void {
    this.exporting = true;
    this.api.get('user/data-export').subscribe({
      next: (data: any) => {
        const lines: string[] = [];
        const esc = (x: any) => `"${String(x ?? '').replace(/"/g, '""')}"`;
        lines.push(['section', 'champ', 'valeur'].join(','));

        if (data?.profile) {
          const pr = data.profile;
          for (const k of Object.keys(pr)) {
            if (k === 'password') continue;
            lines.push(['profil', k, esc(typeof pr[k] === 'object' ? JSON.stringify(pr[k]) : pr[k])].join(','));
          }
        }
        if (Array.isArray(data?.posts)) {
          for (const p of data.posts) {
            const title = p.title || p.name || p.subject || '';
            lines.push(['post', String(p._type || ''), esc(title)].join(','));
          }
        }
        if (Array.isArray(data?.messages)) {
          for (const m of data.messages) {
            lines.push(['message', String(m._id), esc((m.content || '').slice(0, 200))].join(','));
          }
        }

        const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        this.downloadBlob(blob, `africanconnect-synthese-${Date.now()}.csv`);
        this.exporting = false;
      },
      error: () => {
        alert(this.translate.instant('privacy.exportError'));
        this.exporting = false;
      }
    });
  }

  private downloadBlob(blob: Blob, name: string): void {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  goAccessLogs(): void {
    this.router.navigate(['/admin/access-logs']);
  }
}
