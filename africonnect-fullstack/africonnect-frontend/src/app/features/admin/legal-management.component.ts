import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-legal-management',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="item-card">
      <h2 style="margin-top:0;">{{ 'admin.legal.title' | translate }}</h2>

      <div class="text-muted" style="margin-bottom:12px;">
        {{ 'admin.legal.currentVersion' | translate:{ n: termsVersion } }}
      </div>

      <button type="button" class="btn btn-primary" (click)="bump()" [disabled]="isBumping">
        {{ isBumping ? ('common.saving' | translate) : ('admin.legal.bump' | translate) }}
      </button>
    </div>
  `
})
export class LegalManagementComponent implements OnInit {
  termsVersion = 1;
  isBumping = false;

  constructor(private api: ApiService, private translate: TranslateService) {}

  ngOnInit() {
    this.api.get('site-settings/public', false).subscribe({
      next: (res: any) => this.termsVersion = Number(res?.termsVersion || 1),
      error: () => this.termsVersion = 1
    });
  }

  bump() {
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
}

