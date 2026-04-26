import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-legal-management',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="item-card legal-admin-card">
      <div class="legal-admin-top">
        <button type="button" class="btn btn-secondary btn-sm" (click)="goBack()">{{ 'admin.legal.back' | translate }}</button>
        <div class="legal-admin-title-row">
          <h2 style="margin:0;">{{ 'admin.legal.title' | translate }}</h2>
          <span class="legal-version-badge">{{ 'admin.legal.currentVersion' | translate:{ n: termsVersion } }}</span>
        </div>
      </div>

      <p class="text-muted legal-help">
        {{ 'admin.legal.help' | translate }}
      </p>

      <div class="legal-admin-actions legal-admin-actions-primary">
        <button type="button" class="btn btn-secondary" (click)="saveDraft()" [disabled]="isSaving || isPublishing">
          {{ isSaving ? ('common.saving' | translate) : ('admin.legal.saveDraft' | translate) }}
        </button>
        <button type="button" class="btn btn-primary legal-btn-publish" (click)="publishNewVersion()" [disabled]="isSaving || isPublishing">
          {{ isPublishing ? ('common.saving' | translate) : ('admin.legal.publishNew' | translate) }}
        </button>
        <button type="button" class="btn btn-secondary btn-sm legal-btn-bump" (click)="bumpOnly()" [disabled]="isSaving || isPublishing || isBumping">
          {{ isBumping ? ('common.saving' | translate) : ('admin.legal.bump' | translate) }}
        </button>
      </div>

      <div class="form-group">
        <label class="form-label">{{ 'admin.legal.labelFr' | translate }}</label>
        <textarea class="form-control legal-editor" rows="12" [(ngModel)]="termsHtmlFr" name="termsHtmlFr"
                  [placeholder]="'admin.legal.placeholderFr' | translate"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">{{ 'admin.legal.labelEn' | translate }}</label>
        <textarea class="form-control legal-editor" rows="12" [(ngModel)]="termsHtmlEn" name="termsHtmlEn"
                  [placeholder]="'admin.legal.placeholderEn' | translate"></textarea>
      </div>

      <div class="legal-admin-actions legal-admin-actions-sticky">
        <button type="button" class="btn btn-secondary" (click)="saveDraft()" [disabled]="isSaving || isPublishing">
          {{ isSaving ? ('common.saving' | translate) : ('admin.legal.saveDraft' | translate) }}
        </button>
        <button type="button" class="btn btn-primary legal-btn-publish" (click)="publishNewVersion()" [disabled]="isSaving || isPublishing">
          {{ isPublishing ? ('common.saving' | translate) : ('admin.legal.publishNew' | translate) }}
        </button>
        <button type="button" class="btn btn-secondary btn-sm legal-btn-bump" (click)="bumpOnly()" [disabled]="isSaving || isPublishing || isBumping">
          {{ isBumping ? ('common.saving' | translate) : ('admin.legal.bump' | translate) }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .legal-admin-card { padding-bottom: max(20px, env(safe-area-inset-bottom)); }
    .legal-admin-top { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
    .legal-admin-title-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; justify-content: space-between; }
    .legal-version-badge {
      font-size: 0.88rem;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 999px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--secondary);
    }
    .legal-help { font-size: 0.92rem; margin-bottom: 14px; line-height: 1.45; }
    .legal-editor { font-size: 0.95rem; line-height: 1.45; }
    .legal-admin-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }
    .legal-admin-actions-primary {
      margin-bottom: 18px;
      padding: 14px;
      border-radius: 16px;
      background: var(--surface-2);
      border: 1px solid var(--border);
    }
    .legal-btn-publish { font-weight: 700; }
    .legal-admin-actions-sticky {
      position: sticky;
      bottom: 0;
      z-index: 20;
      margin-top: 20px;
      padding-top: 14px;
      padding-bottom: 8px;
      background: linear-gradient(180deg, transparent 0%, var(--surface) 18%);
      border-top: 1px solid var(--border);
    }
    @media (max-width: 768px) {
      .legal-admin-actions-primary,
      .legal-admin-actions-sticky {
        flex-direction: column;
        align-items: stretch;
      }
      .legal-admin-actions-primary .btn,
      .legal-admin-actions-sticky .btn {
        width: 100%;
        min-height: 48px;
        justify-content: center;
      }
      .legal-admin-actions-primary .legal-btn-publish,
      .legal-admin-actions-sticky .legal-btn-publish { order: -1; }
    }
  `]
})
export class LegalManagementComponent implements OnInit {
  termsVersion = 1;
  termsHtmlFr = '';
  termsHtmlEn = '';
  isSaving = false;
  isPublishing = false;
  isBumping = false;

  constructor(
    private api: ApiService,
    private translate: TranslateService,
    private router: Router
  ) {}

  ngOnInit() {
    this.load();
  }

  goBack() {
    this.router.navigate(['/admin']);
  }

  load() {
    this.api.get('site-settings/admin').subscribe({
      next: (res: any) => {
        this.termsVersion = Number(res?.termsVersion || 1);
        this.termsHtmlFr = String(res?.termsHtmlFr || '');
        this.termsHtmlEn = String(res?.termsHtmlEn || '');
      },
      error: (err) => {
        console.error(err);
        alert(this.translate.instant('admin.legal.loadError'));
      }
    });
  }

  saveDraft() {
    this.isSaving = true;
    this.api.put('site-settings/terms-content', { termsHtmlFr: this.termsHtmlFr, termsHtmlEn: this.termsHtmlEn }).subscribe({
      next: (res: any) => {
        this.termsVersion = Number(res?.termsVersion || this.termsVersion);
        this.isSaving = false;
        alert(this.translate.instant('admin.legal.savedDraftOk'));
      },
      error: (err) => {
        console.error(err);
        this.isSaving = false;
        alert(err?.error?.error || this.translate.instant('errors.generic'));
      }
    });
  }

  bumpOnly() {
    this.isBumping = true;
    this.api.post('site-settings/terms-version/bump', {}).subscribe({
      next: (res: any) => {
        this.termsVersion = Number(res?.termsVersion || this.termsVersion);
        this.isBumping = false;
        alert(this.translate.instant('admin.legal.bumpedOk', { n: this.termsVersion }));
      },
      error: (err) => {
        console.error(err);
        this.isBumping = false;
        alert(err?.error?.error || this.translate.instant('errors.generic'));
      }
    });
  }

  publishNewVersion() {
    this.isPublishing = true;
    this.api.post('site-settings/terms-publish', { termsHtmlFr: this.termsHtmlFr, termsHtmlEn: this.termsHtmlEn }).subscribe({
      next: (res: any) => {
        this.termsVersion = Number(res?.termsVersion || this.termsVersion);
        this.isPublishing = false;
        alert(this.translate.instant('admin.legal.publishedOk', { n: this.termsVersion }));
      },
      error: (err) => {
        console.error(err);
        this.isPublishing = false;
        alert(err?.error?.error || this.translate.instant('errors.generic'));
      }
    });
  }
}
