import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-admin-access-logs',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="access-logs-page">
      <a routerLink="/profile" class="back-link">← {{ 'accessLogs.back' | translate }}</a>
      <h1>{{ 'accessLogs.title' | translate }}</h1>
      <p class="text-muted small intro">{{ 'accessLogs.intro' | translate }}</p>
      <div class="toolbar">
        <button type="button" class="btn btn-secondary ac-btn" (click)="load()" [disabled]="loading">{{ 'common.refresh' | translate }}</button>
        <button type="button" class="btn btn-primary ac-btn" (click)="exportCsv()" [disabled]="exporting">
          {{ 'accessLogs.exportCsv' | translate }}
        </button>
      </div>
      <p *ngIf="err" class="text-error">{{ err }}</p>
      <div *ngIf="total >= 0" class="text-muted small meta">{{ 'accessLogs.total' | translate:{ count: total } }}</div>
      <div class="table-wrap" *ngIf="items.length">
        <table class="ac-table" role="table" aria-label="Access log">
          <thead>
            <tr>
              <th>{{ 'accessLogs.colAt' | translate }}</th>
              <th>{{ 'accessLogs.colMethod' | translate }}</th>
              <th>{{ 'accessLogs.colPath' | translate }}</th>
              <th>{{ 'accessLogs.colIp' | translate }}</th>
              <th>{{ 'accessLogs.colUser' | translate }}</th>
              <th class="ua-th">{{ 'accessLogs.colUa' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of items">
              <td class="ac-td-nowrap">{{ r.at | date:'dd/MM/yyyy HH:mm:ss' }}</td>
              <td>{{ r.method }}</td>
              <td class="path-cell">{{ r.path }}</td>
              <td>{{ r.ip }}</td>
              <td class="mono">{{ r.userId || '—' }}</td>
              <td class="ua-cell mono">{{ userAgentExcerpt(r.userAgent) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .access-logs-page {
      padding: max(12px, env(safe-area-inset-top, 0px)) max(12px, env(safe-area-inset-right, 0px))
        max(20px, env(safe-area-inset-bottom, 0px)) max(12px, env(safe-area-inset-left, 0px));
      max-width: 1200px; margin: 0 auto; min-width: 0; box-sizing: border-box;
    }
    .intro { line-height: 1.45; }
    .back-link { display: inline-block; margin-bottom: 12px; color: var(--secondary); min-height: 44px; line-height: 44px; }
    .toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin: 12px 0; align-items: center; }
    .ac-btn { min-height: 44px; padding: 10px 14px; font-size: 0.9rem; border-radius: 12px; }
    .meta { margin: 8px 0; }
    .table-wrap {
      overflow-x: auto; -webkit-overflow-scrolling: touch; touch-action: pan-x pan-y;
      border: 1px solid var(--border); border-radius: 12px;
      max-width: 100%;
    }
    .ac-table { width: 100%; min-width: 720px; border-collapse: collapse; font-size: 0.86rem; }
    .ac-table th, .ac-table td { padding: 10px 8px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
    .ac-table th { background: var(--surface-2); position: sticky; top: 0; z-index: 1; }
    .ac-td-nowrap { white-space: nowrap; }
    .path-cell { max-width: min(360px, 40vw); overflow-wrap: anywhere; word-break: break-all; }
    .ua-cell { max-width: 200px; overflow-wrap: anywhere; }
    .ua-th { min-width: 120px; }
    .mono { font-size: 0.72rem; line-height: 1.3; }
    @media (max-width: 600px) {
      .ac-table { font-size: 0.8rem; }
      .path-cell { max-width: none; }
    }
  `]
})
export class AdminAccessLogsComponent implements OnInit {
  items: any[] = [];
  total = -1;
  loading = false;
  exporting = false;
  err = '';

  constructor(private api: ApiService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.err = '';
    this.api.get('admin/access-logs?limit=800&skip=0').subscribe({
      next: (res: any) => {
        this.items = Array.isArray(res?.items) ? res.items : [];
        this.total = typeof res?.total === 'number' ? res.total : this.items.length;
        this.loading = false;
      },
      error: () => {
        this.err = this.translate.instant('accessLogs.error');
        this.loading = false;
      }
    });
  }

  userAgentExcerpt(ua: string | undefined): string {
    const s = String(ua || '').trim();
    if (!s) return '—';
    return s.length > 120 ? s.slice(0, 120) + '…' : s;
  }

  exportCsv(): void {
    this.exporting = true;
    this.api.getText('admin/access-logs/export.csv?limit=3000').subscribe({
      next: (text) => {
        const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `access-logs-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        this.exporting = false;
      },
      error: () => {
        this.err = this.translate.instant('accessLogs.exportError');
        this.exporting = false;
      }
    });
  }
}
