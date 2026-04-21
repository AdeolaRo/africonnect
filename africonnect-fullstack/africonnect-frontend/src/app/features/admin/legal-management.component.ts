import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-legal-management',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="item-card">
      <h2 style="margin-top:0;">{{ 'admin.legal.title' | translate }}</h2>

      <div class="text-muted" style="margin-bottom:12px;">
        {{ 'admin.legal.currentVersion' | translate:{ n: termsVersion } }}
      </div>

      <p class="text-muted" style="font-size:0.92rem; margin-bottom:14px;">
        {{ 'admin.legal.help' | translate }}
      </p>

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

      <div class="legal-admin-actions">
        <button type="button" class="btn btn-secondary" (click)="saveDraft()" [disabled]="isSaving || isPublishing">
          {{ isSaving ? ('common.saving' | translate) : ('admin.legal.saveDraft' | translate) }}
        </button>
        <button type="button" class="btn btn-primary" (click)="publishNewVersion()" [disabled]="isSaving || isPublishing">
          {{ isPublishing ? ('common.saving' | translate) : ('admin.legal.publishNew' | translate) }}
        </button>
        <button type="button" class="btn btn-secondary btn-sm" (click)="bumpOnly()" [disabled]="isSaving || isPublishing || isBumping">
          {{ isBumping ? ('common.saving' | translate) : ('admin.legal.bump' | translate) }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .legal-editor { font-family: ui-monospace, monospace; font-size: 0.88rem; }
    .legal-admin-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
    @media (max-width: 768px) {
      .legal-admin-actions .btn { flex: 1 1 auto; min-width: 140px; }
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

  constructor(private api: ApiService, private translate: TranslateService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.get('site-settings/admin').subscribe({
      next: (res: any) => {
        this.termsVersion = Number(res?.termsVersion || 1);
        this.termsHtmlFr = String(res?.termsHtmlFr || '');
        this.termsHtmlEn = String(res?.termsHtmlEn || '');
      },
      error: () => {}
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
