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
      <p class="text-muted small">{{ 'accessLogs.intro' | translate }}</p>
      <div class="toolbar">
        <button type="button" class="btn btn-secondary btn-sm" (click)="load()" [disabled]="loading">{{ 'common.refresh' | translate }}</button>
        <button type="button" class="btn btn-primary btn-sm" (click)="exportCsv()" [disabled]="exporting">
          {{ 'accessLogs.exportCsv' | translate }}
        </button>
      </div>
      <p *ngIf="err" class="text-error">{{ err }}</p>
      <div *ngIf="total >= 0" class="text-muted small meta">{{ 'accessLogs.total' | translate:{ count: total } }}</div>
      <div class="table-wrap" *ngIf="items.length">
        <table class="ac-table">
          <thead>
            <tr>
              <th>{{ 'accessLogs.colAt' | translate }}</th>
              <th>{{ 'accessLogs.colMethod' | translate }}</th>
              <th>{{ 'accessLogs.colPath' | translate }}</th>
              <th>{{ 'accessLogs.colIp' | translate }}</th>
              <th>userId</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of items">
              <td>{{ r.at | date:'dd/MM/yyyy HH:mm:ss' }}</td>
              <td>{{ r.method }}</td>
              <td class="path-cell">{{ r.path }}</td>
              <td>{{ r.ip }}</td>
              <td class="mono">{{ r.userId || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .access-logs-page { padding: 20px 16px 48px; max-width: 1200px; margin: 0 auto; }
    .back-link { display: inline-block; margin-bottom: 16px; color: var(--secondary); }
    .toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin: 16px 0; }
    .meta { margin: 8px 0; }
    .table-wrap { overflow: auto; border: 1px solid var(--border); border-radius: 12px; }
    .ac-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .ac-table th, .ac-table td { padding: 8px 10px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
    .ac-table th { background: var(--surface-2); }
    .path-cell { max-width: 360px; overflow-wrap: anywhere; word-break: break-all; }
    .mono { font-size: 0.78rem; }
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
