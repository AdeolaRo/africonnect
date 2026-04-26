import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-ad-requests-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TranslateModule],
  template: `
    <div class="admin-container">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom: 12px;">
        <button class="btn btn-secondary" (click)="goBack()">{{ 'admin.requestsPage.back' | translate }}</button>
        <h1 style="margin:0;">{{ 'admin.requestsPage.title' | translate }}</h1>
      </div>

      <div class="admin-filter-bar card" style="padding:12px; border:1px solid var(--border); border-radius:16px; background: var(--surface); margin-bottom: 12px;">
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
          <select class="form-control" style="max-width:260px;" [(ngModel)]="filterOption">
            <option value="">{{ 'admin.requestsPage.filterAllTypes' | translate }}</option>
            <option value="create_and_publish">{{ 'admin.requestsPage.filterCreatePublish' | translate }}</option>
            <option value="publish_only">{{ 'admin.requestsPage.filterPublishOnly' | translate }}</option>
          </select>
          <select class="form-control" style="max-width:260px;" [(ngModel)]="filterStatus">
            <option value="">{{ 'admin.requestsPage.filterAllStatus' | translate }}</option>
            <option value="awaiting_admin_payment_link">{{ 'admin.requestsPage.status.awaiting_admin_payment_link' | translate }}</option>
            <option value="payment_link_sent">{{ 'admin.requestsPage.status.payment_link_sent' | translate }}</option>
            <option value="awaiting_payment">{{ 'admin.requestsPage.status.awaiting_payment' | translate }}</option>
            <option value="paid">{{ 'admin.requestsPage.status.paid' | translate }}</option>
            <option value="under_review">{{ 'admin.requestsPage.status.under_review' | translate }}</option>
            <option value="needs_resubmission">{{ 'admin.requestsPage.status.needs_resubmission' | translate }}</option>
            <option value="approved">{{ 'admin.requestsPage.status.approved' | translate }}</option>
            <option value="rejected">{{ 'admin.requestsPage.status.rejected' | translate }}</option>
            <option value="refused">{{ 'admin.requestsPage.status.refused' | translate }}</option>
          </select>
          <button class="btn btn-secondary btn-sm" (click)="load()">{{ 'common.refresh' | translate }}</button>
        </div>
      </div>

      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>{{ 'admin.requestsPage.thUser' | translate }}</th>
              <th>{{ 'admin.requestsPage.thOption' | translate }}</th>
              <th>{{ 'admin.requestsPage.thStatus' | translate }}</th>
              <th>{{ 'admin.requestsPage.thMedia' | translate }}</th>
              <th>{{ 'admin.requestsPage.thDate' | translate }}</th>
              <th>{{ 'admin.requestsPage.thActions' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of filtered()">
              <td>
                <strong>{{ r.userPseudo || '—' }}</strong>
                <div class="text-muted" style="font-size:0.85rem;">{{ r.userEmail }}</div>
              </td>
              <td>{{ optionLabel(r.option) }}</td>
              <td><span class="status">{{ statusLabel(r.status) }}</span></td>
              <td>
                <a *ngIf="r.mediaUrl" [href]="r.mediaUrl" target="_blank">{{ 'admin.requestsPage.viewMedia' | translate }}</a>
                <span *ngIf="!r.mediaUrl" class="text-muted">—</span>
              </td>
              <td style="white-space:nowrap;">{{ r.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                  <button class="btn btn-secondary btn-sm" (click)="openDetails(r)">{{ 'common.details' | translate }}</button>

                  <button *ngIf="r.option==='create_and_publish' && (r.status==='awaiting_admin_payment_link' || r.status==='payment_link_sent')"
                          class="btn btn-primary btn-sm"
                          (click)="sendPaymentLink(r)">
                    {{ 'admin.requestsPage.sendPaymentLink' | translate }}
                  </button>

                  <button *ngIf="r.option==='publish_only' && r.status==='under_review'"
                          class="btn btn-primary btn-sm"
                          (click)="approve(r)">
                    {{ 'admin.requestsPage.approve' | translate }}
                  </button>

                  <button *ngIf="r.option==='publish_only' && (r.status==='under_review' || r.status==='needs_resubmission')"
                          class="btn btn-danger btn-sm"
                          (click)="askResubmission(r)">
                    {{ 'admin.requestsPage.askNewMedia' | translate }}
                  </button>

                  <button *ngIf="r.status!=='rejected'"
                          class="btn btn-danger btn-sm"
                          (click)="reject(r)">
                    {{ 'admin.requestsPage.reject' | translate }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="requests.length === 0" class="empty-state">
          <div style="font-size: 3rem; margin-bottom: 10px;">📣</div>
          <h3>{{ 'admin.requestsPage.emptyTitle' | translate }}</h3>
        </div>
      </div>
    </div>

    <app-modal [(visible)]="detailsVisible" [title]="'admin.requestsPage.detailsTitle' | translate" [size]="'wide'">
      <div *ngIf="selected">
        <div class="text-muted" style="margin-bottom:10px;">
          <div><strong>{{ 'admin.requestsPage.detailUser' | translate }}</strong>: {{ selected.userPseudo || '—' }} ({{ selected.userEmail }})</div>
          <div><strong>{{ 'admin.requestsPage.detailOption' | translate }}</strong>: {{ optionLabel(selected.option) }}</div>
          <div><strong>{{ 'admin.requestsPage.detailStatus' | translate }}</strong>: {{ statusLabel(selected.status) }}</div>
          <div><strong>{{ 'admin.requestsPage.detailDate' | translate }}</strong>: {{ selected.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
        </div>
        <div style="font-weight:900; margin-bottom:8px;">{{ 'admin.requestsPage.message' | translate }}</div>
        <div style="white-space:pre-wrap; padding:12px; border-radius:12px; border:1px solid var(--border); background: var(--surface-2);">
          {{ selected.message || '—' }}
        </div>

        <div *ngIf="selected.attachments?.length" style="margin-top:12px;">
          <div style="font-weight:900; margin-bottom:8px;">{{ 'admin.requestsPage.attachments' | translate }}</div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <a *ngFor="let u of selected.attachments" [href]="u" target="_blank">{{ u.split('/').pop() }}</a>
          </div>
        </div>

        <div *ngIf="selected.adminMessage" style="margin-top:12px;">
          <div style="font-weight:900; margin-bottom:8px;">{{ 'admin.requestsPage.adminMessage' | translate }}</div>
          <div style="white-space:pre-wrap; padding:12px; border-radius:12px; border:1px solid var(--border); background: rgba(245,101,101,.08);">
            {{ selected.adminMessage }}
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap; margin-top:14px;">
          <button class="btn btn-secondary" (click)="detailsVisible=false">{{ 'common.close' | translate }}</button>
        </div>
      </div>
    </app-modal>
  `
})
export class AdRequestsManagementComponent implements OnInit {
  requests: any[] = [];
  filterOption: '' | 'create_and_publish' | 'publish_only' = '';
  filterStatus = '';

  detailsVisible = false;
  selected: any = null;

  constructor(
    private api: ApiService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.load();
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  optionLabel(opt: string): string {
    if (opt === 'create_and_publish') return this.translate.instant('admin.requestsPage.filterCreatePublish');
    if (opt === 'publish_only') return this.translate.instant('admin.requestsPage.filterPublishOnly');
    return opt || '—';
  }

  statusLabel(status: string): string {
    if (!status) return '—';
    const key = `admin.requestsPage.status.${status}`;
    const t = this.translate.instant(key);
    return t !== key ? t : status;
  }

  load() {
    this.api.get('ad-requests').subscribe({
      next: (items: any) => this.requests = Array.isArray(items) ? items : [],
      error: () => alert(this.translate.instant('admin.requestsPage.loadError'))
    });
  }

  filtered() {
    return (this.requests || []).filter(r => {
      if (this.filterOption && r.option !== this.filterOption) return false;
      if (this.filterStatus && r.status !== this.filterStatus) return false;
      return true;
    });
  }

  openDetails(r: any) {
    this.selected = r;
    this.detailsVisible = true;
  }

  async sendPaymentLink(r: any) {
    try {
      const res: any = await this.api.post(`ad-requests/${r._id}/send-payment-link`, {}).toPromise();
      if (res?.url) alert(this.translate.instant('admin.requestsPage.linkSent'));
      this.load();
    } catch (e) {
      console.error(e);
      alert(this.translate.instant('admin.requestsPage.linkSendError'));
    }
  }

  async askResubmission(r: any) {
    const msg = prompt(
      this.translate.instant('admin.requestsPage.promptResubmission'),
      this.translate.instant('admin.requestsPage.promptResubmissionDefault')
    );
    if (msg === null) return;
    try {
      await this.api.post(`ad-requests/${r._id}/request-resubmission`, { message: msg }).toPromise();
      alert(this.translate.instant('admin.requestsPage.resubmissionSent'));
      this.load();
    } catch (e) {
      console.error(e);
      alert(this.translate.instant('admin.requestsPage.resubmissionError'));
    }
  }

  async approve(r: any) {
    if (!confirm(this.translate.instant('admin.requestsPage.confirmApprove'))) return;
    try {
      await this.api.post(`ad-requests/${r._id}/approve`, {}).toPromise();
      this.load();
    } catch (e) {
      console.error(e);
      alert(this.translate.instant('admin.requestsPage.approveError'));
    }
  }

  async reject(r: any) {
    const msg = prompt(this.translate.instant('admin.requestsPage.promptReject'), r.adminMessage || '');
    if (msg === null) return;
    try {
      await this.api.post(`ad-requests/${r._id}/reject`, { message: msg }).toPromise();
      this.load();
    } catch (e) {
      console.error(e);
      alert(this.translate.instant('admin.requestsPage.rejectError'));
    }
  }
}
