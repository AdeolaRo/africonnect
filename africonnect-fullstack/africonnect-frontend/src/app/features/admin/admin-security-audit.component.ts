import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';

/** Ligne renvoyée par GET /api/admin/security-audit */
export interface SecurityAuditRow {
  at: string;
  actorId: string;
  actorPseudo: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  ip: string;
  details: string;
}

@Component({
  selector: 'app-admin-security-audit',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="sec-audit-page">
      <a routerLink="/profile" class="back-link">← {{ 'securityAudit.back' | translate }}</a>
      <h1>{{ 'securityAudit.title' | translate }}</h1>
      <p class="text-muted small intro">{{ 'securityAudit.intro' | translate }}</p>
      <div class="toolbar">
        <button type="button" class="btn btn-secondary ac-btn" (click)="load()" [disabled]="loading">
          {{ 'common.refresh' | translate }}
        </button>
      </div>
      <p *ngIf="err" class="text-error">{{ err }}</p>
      <div *ngIf="total >= 0" class="text-muted small meta">{{ 'securityAudit.total' | translate:{ count: total } }}</div>
      <div class="table-wrap" *ngIf="items.length">
        <table class="ac-table" role="table" [attr.aria-label]="'securityAudit.title' | translate">
          <thead>
            <tr>
              <th>{{ 'securityAudit.colAt' | translate }}</th>
              <th>{{ 'securityAudit.colActor' | translate }}</th>
              <th>{{ 'securityAudit.colRole' | translate }}</th>
              <th>{{ 'securityAudit.colAction' | translate }}</th>
              <th>{{ 'securityAudit.colTarget' | translate }}</th>
              <th>{{ 'securityAudit.colIp' | translate }}</th>
              <th class="d-th">{{ 'securityAudit.colDetails' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of items">
              <td class="ac-td-nowrap">{{ r.at | date:'dd/MM/yyyy HH:mm:ss' }}</td>
              <td class="mono">
                <span *ngIf="r.actorPseudo">{{ r.actorPseudo }}</span>
                <span *ngIf="!r.actorPseudo && r.actorId" class="id-only">{{ r.actorId }}</span>
                <span *ngIf="!r.actorPseudo && !r.actorId">—</span>
              </td>
              <td>{{ r.actorRole || '—' }}</td>
              <td class="act-cell">{{ r.action }}</td>
              <td class="mono small-target">{{ (r.targetType || '') }}{{ (r.targetType && r.targetId) ? ' / ' : '' }}{{ (r.targetId || '') }}</td>
              <td>{{ r.ip || '—' }}</td>
              <td class="d-cell mono">{{ r.details || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .sec-audit-page {
      padding: max(12px, env(safe-area-inset-top, 0px)) max(12px, env(safe-area-inset-right, 0px))
        max(20px, env(safe-area-inset-bottom, 0px)) max(12px, env(safe-area-inset-left, 0px));
      max-width: 1200px; margin: 0 auto; min-width: 0; box-sizing: border-box;
    }
    .intro { line-height: 1.45; }
    .back-link { display: inline-block; margin-bottom: 12px; color: var(--secondary); min-height: 44px; line-height: 44px; }
    .toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin: 12px 0; }
    .ac-btn { min-height: 44px; padding: 10px 14px; font-size: 0.9rem; border-radius: 12px; }
    .meta { margin: 8px 0; }
    .table-wrap {
      overflow-x: auto; -webkit-overflow-scrolling: touch; touch-action: pan-x pan-y;
      border: 1px solid var(--border); border-radius: 12px; max-width: 100%;
    }
    .ac-table { width: 100%; min-width: 880px; border-collapse: collapse; font-size: 0.86rem; }
    .ac-table th, .ac-table td { padding: 10px 8px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
    .ac-table th { background: var(--surface-2); position: sticky; top: 0; z-index: 1; }
    .ac-td-nowrap { white-space: nowrap; }
    .act-cell { max-width: 200px; overflow-wrap: anywhere; }
    .small-target { max-width: 220px; overflow-wrap: anywhere; font-size: 0.75rem; }
    .d-th { min-width: 100px; }
    .d-cell { max-width: 280px; overflow-wrap: anywhere; font-size: 0.72rem; line-height: 1.3; }
    .id-only { font-size: 0.72rem; }
    .mono { font-size: 0.78rem; }
    @media (max-width: 600px) { .ac-table { font-size: 0.8rem; } }
  `]
})
export class AdminSecurityAuditComponent implements OnInit {
  items: SecurityAuditRow[] = [];
  total = -1;
  loading = false;
  err = '';

  constructor(private api: ApiService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.err = '';
    this.api.get('admin/security-audit?limit=400&skip=0').subscribe({
      next: (res: { items?: SecurityAuditRow[]; total?: number }) => {
        this.items = Array.isArray(res?.items) ? res.items : [];
        this.total = typeof res?.total === 'number' ? res.total : this.items.length;
        this.loading = false;
      },
      error: () => {
        this.err = this.translate.instant('securityAudit.error');
        this.loading = false;
      }
    });
  }
}
