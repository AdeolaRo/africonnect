import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-ad-request',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="admin-container">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom: 16px;">
        <button class="btn btn-secondary" (click)="goBack()">{{ 'common.back' | translate }}</button>
        <h1 style="margin:0;">{{ 'adRequest.title' | translate }}</h1>
      </div>

      <div class="card" style="padding:16px; border:1px solid var(--border); border-radius:16px; background: var(--surface);">
        <div class="form-group">
          <label class="form-label">{{ 'adRequest.optionLabel' | translate }}</label>
          <select class="form-control" [(ngModel)]="option">
            <option value="create_and_publish">{{ 'adRequest.optionCreatePublish' | translate }}</option>
            <option value="publish_only">{{ 'adRequest.optionPublishOnly' | translate }}</option>
          </select>
        </div>

        <div class="form-group" style="margin-top: 10px;">
          <label class="form-label">{{ 'adRequest.messageLabel' | translate }}</label>
          <textarea class="form-control" [(ngModel)]="message" rows="5"
                    [placeholder]="'adRequest.messagePlaceholder' | translate"></textarea>
          <div class="text-muted" style="font-size:0.9rem; margin-top:6px;" *ngIf="option === 'create_and_publish'">
            {{ 'adRequest.createPublishHelp' | translate }}
          </div>
        </div>

        <div class="form-group" *ngIf="option === 'publish_only'">
          <label class="form-label">{{ 'adRequest.mediaLabel' | translate }}</label>
          <div class="file-upload">
            <input #pubInput type="file" accept="image/*,video/*" (change)="addPublishOnlyFile($event)" style="display:none;">
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
              <button type="button" class="btn btn-secondary" (click)="pubInput.click()" [disabled]="!!selectedFile">
                {{ 'common.addImageVideo' | translate }}
              </button>
              <div class="text-muted" style="font-size: 0.9rem;">{{ 'adRequest.oneMediaRequired' | translate }}</div>
            </div>

            <div *ngIf="!selectedFile" class="text-muted" style="margin-top:10px; font-size:0.9rem;">
              {{ 'adRequest.mediaFormats' | translate }}
            </div>

            <div *ngIf="selectedFile" class="file-selected" style="margin-top:10px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="font-size:2rem;">✅</div>
                <div style="min-width:0;">
                  <div style="word-break:break-word;">{{ selectedFile.name }}</div>
                  <div class="text-muted" style="font-size: 0.9rem;">
                    {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
                  </div>
                </div>
                <button type="button" class="btn btn-danger btn-sm" (click)="removePublishOnlyFile()" style="margin-left:auto;">
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group" *ngIf="option === 'create_and_publish'">
          <label class="form-label">{{ 'adRequest.attachmentLabel' | translate }}</label>
          <div class="file-upload">
            <input #attInput type="file" accept="image/*,video/*" (change)="addAttachmentFile($event)" style="display:none;">
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
              <button type="button" class="btn btn-secondary" (click)="attInput.click()" [disabled]="!!attachmentFile">
                {{ 'common.addExample' | translate }}
              </button>
              <div class="text-muted" style="font-size: 0.9rem;">{{ 'adRequest.optional' | translate }}</div>
            </div>

            <div *ngIf="!attachmentFile" class="text-muted" style="margin-top:10px; font-size:0.9rem;">
              {{ 'adRequest.attachmentFormats' | translate }}
            </div>

            <div *ngIf="attachmentFile" class="file-selected" style="margin-top:10px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="font-size:2rem;">✅</div>
                <div style="min-width:0;">
                  <div style="word-break:break-word;">{{ attachmentFile.name }}</div>
                  <div class="text-muted" style="font-size: 0.9rem;">
                    {{ (attachmentFile.size / 1024 / 1024).toFixed(2) }} MB
                  </div>
                </div>
                <button type="button" class="btn btn-danger btn-sm" (click)="removeAttachmentFile()" style="margin-left:auto;">
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:12px; margin-top: 12px;">
          <button class="btn btn-primary" (click)="submit()" [disabled]="isSubmitting || !message.trim() || (option==='publish_only' && !selectedFile)">
            {{ isSubmitting ? ('adRequest.submitting' | translate) : (option === 'publish_only' ? ('adRequest.ctaPublishOnly' | translate) : ('adRequest.ctaCreate' | translate)) }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class AdRequestComponent {
  option: 'create_and_publish' | 'publish_only' = 'create_and_publish';
  selectedFile: File | null = null;
  attachmentFile: File | null = null;
  message = '';
  isSubmitting = false;

  constructor(private api: ApiService, private router: Router, private translate: TranslateService) {}

  goBack() {
    this.router.navigate(['/profile']);
  }

  addPublishOnlyFile(event: any) {
    const input = event?.target as HTMLInputElement;
    const file = input?.files?.[0] || null;
    if (!file) return;
    this.selectedFile = file;
    if (input) input.value = '';
  }

  removePublishOnlyFile() {
    this.selectedFile = null;
  }

  addAttachmentFile(event: any) {
    const input = event?.target as HTMLInputElement;
    const file = input?.files?.[0] || null;
    if (!file) return;
    this.attachmentFile = file;
    if (input) input.value = '';
  }

  removeAttachmentFile() {
    this.attachmentFile = null;
  }

  async submit() {
    this.isSubmitting = true;
    try {
      let mediaUrl = '';
      if (this.option === 'publish_only' && this.selectedFile) {
        const fd = new FormData();
        fd.append('media', this.selectedFile);
        const upload: any = await this.api.post('upload', fd).toPromise();
        mediaUrl = upload?.url || '';
      }

      const attachments: string[] = [];
      if (this.option === 'create_and_publish' && this.attachmentFile) {
        const fd = new FormData();
        fd.append('media', this.attachmentFile);
        const upload: any = await this.api.post('upload', fd).toPromise();
        if (upload?.url) attachments.push(String(upload.url));
      }

      const created: any = await this.api.post('ad-requests', { option: this.option, mediaUrl, message: this.message, attachments }).toPromise();
      const id = created?._id;
      if (this.option === 'publish_only') {
        this.router.navigate(['/paiement'], { queryParams: { requestId: id } });
      } else {
        alert(this.translate.instant('ads.requestSent'));
        this.router.navigate(['/profile']);
      }
    } catch (e) {
      console.error(e);
      alert(this.translate.instant('errors.generic'));
    } finally {
      this.isSubmitting = false;
    }
  }
}

