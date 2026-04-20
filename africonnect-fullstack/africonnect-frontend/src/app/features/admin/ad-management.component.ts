import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-ad-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TranslateModule],
  template: `
    <div class="admin-container">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom: 12px;">
        <button class="btn btn-secondary" (click)="goBack()">{{ 'admin.adsPage.back' | translate }}</button>
        <h1 style="margin:0;">{{ 'admin.adsPage.title' | translate }}</h1>
      </div>

      <div class="admin-toolbar-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <button class="btn btn-primary" (click)="openCreateModal()">
          {{ 'admin.adsPage.new' | translate }}
        </button>

        <div class="stats" style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div class="stat-card">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">{{ 'admin.adsPage.statsTotal' | translate }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ stats.active }}</div>
            <div class="stat-label">{{ 'admin.adsPage.statsActive' | translate }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ stats.videos }}</div>
            <div class="stat-label">{{ 'admin.adsPage.statsVideos' | translate }}</div>
          </div>
        </div>
      </div>

      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>{{ 'admin.adsPage.thTitle' | translate }}</th>
              <th>{{ 'admin.adsPage.thType' | translate }}</th>
              <th>{{ 'admin.adsPage.thSections' | translate }}</th>
              <th>{{ 'admin.adsPage.thStatus' | translate }}</th>
              <th>{{ 'admin.adsPage.thDates' | translate }}</th>
              <th>{{ 'admin.adsPage.thActions' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ad of advertisements">
              <td>
                <strong>{{ ad.title }}</strong>
                <div class="text-muted" style="font-size: 0.875rem;">{{ ad.description | slice:0:50 }}{{ ad.description?.length > 50 ? '...' : '' }}</div>
              </td>
              <td>
                <span class="badge" [class.badge-image]="ad.mediaType === 'image'" [class.badge-video]="ad.mediaType === 'video'">
                  {{ (ad.mediaType === 'image' ? 'admin.adsPage.badgeImage' : 'admin.adsPage.badgeVideo') | translate }}
                </span>
              </td>
              <td>
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                  <span *ngFor="let section of ad.displayIn" class="section-tag">
                    {{ ('nav.' + section) | translate }}
                  </span>
                </div>
              </td>
              <td>
                <span class="status" [class.active]="ad.isActive" [class.inactive]="!ad.isActive">
                  {{ ad.isActive ? ('✅ ' + ('admin.adsPage.statusOn' | translate)) : ('❌ ' + ('admin.adsPage.statusOff' | translate)) }}
                </span>
              </td>
              <td>
                <div style="font-size: 0.875rem;">
                  <div>{{ 'admin.adsPage.created' | translate }}: {{ ad.createdAt | date:'dd/MM/yyyy' }}</div>
                  <div *ngIf="ad.endDate">{{ 'admin.adsPage.expires' | translate }}: {{ ad.endDate | date:'dd/MM/yyyy' }}</div>
                </div>
              </td>
              <td>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-sm" (click)="editAd(ad)">
                    ✏️
                  </button>
                  <button class="btn btn-secondary btn-sm" (click)="toggleAd(ad)">
                    {{ ad.isActive ? '❌' : '✅' }}
                  </button>
                  <button class="btn btn-danger btn-sm" (click)="deleteAd(ad)">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="advertisements.length === 0" class="empty-state">
          <div style="font-size: 3rem; margin-bottom: 16px;">📺</div>
          <h3>{{ 'admin.adsPage.emptyTitle' | translate }}</h3>
          <p>{{ 'admin.adsPage.emptyText' | translate }}</p>
          <button class="btn btn-primary" (click)="openCreateModal()">
            {{ 'admin.adsPage.emptyCta' | translate }}
          </button>
        </div>
      </div>
    </div>

    <app-modal [(visible)]="modalVisible" [title]="(editingAd ? 'admin.adsPage.modalEdit' : 'admin.adsPage.modalNew') | translate">
      <form (ngSubmit)="saveAd()" class="form-modal" *ngIf="form && form.isActive !== undefined">
        <div class="form-row" style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
          <div class="form-group" style="flex: 1; min-width: 200px;">
            <label class="form-label">{{ 'admin.adsPage.labelTitle' | translate }}</label>
            <input type="text" [(ngModel)]="form.title" name="title" class="form-control" required>
          </div>

          <div class="form-group" style="flex: 1; min-width: 200px;">
            <label class="form-label">{{ 'admin.adsPage.labelMediaType' | translate }}</label>
            <select [(ngModel)]="form.mediaType" name="mediaType" class="form-control">
              <option value="image">{{ 'admin.adsPage.typeImage' | translate }}</option>
              <option value="video">{{ 'admin.adsPage.typeVideo' | translate }}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ 'admin.adsPage.labelDescription' | translate }}</label>
          <textarea [(ngModel)]="form.description" name="description" rows="3" class="form-control" [placeholder]="'admin.adsPage.descPlaceholder' | translate"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">{{ 'admin.adsPage.labelTargetUrl' | translate }}</label>
          <input type="url" [(ngModel)]="form.targetUrl" name="targetUrl" class="form-control" placeholder="https://example.com">
        </div>

        <div class="form-group">
          <label class="form-label">{{ 'admin.adsPage.labelButtonText' | translate }}</label>
          <input type="text" [(ngModel)]="form.buttonText" name="buttonText" class="form-control" [placeholder]="'admin.adsPage.buttonPlaceholder' | translate">
        </div>

        <div class="form-group">
          <label class="form-label">{{ 'admin.adsPage.labelMedia' | translate }}</label>
          <div *ngIf="!selectedFile && !form.mediaUrl" class="file-upload">
            <input #mediaInput type="file" (change)="addMediaFile($event)" [accept]="form.mediaType === 'video' ? 'video/*' : 'image/*'" style="display:none;">
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
              <button type="button" class="btn btn-secondary" (click)="mediaInput.click()" [disabled]="!!selectedFile">
                {{ form.mediaType === 'video' ? ('admin.adsPage.addVideo' | translate) : ('admin.adsPage.addImage' | translate) }}
              </button>
              <div class="text-muted" style="font-size: 0.9rem;">
                {{ form.mediaType === 'video' ? ('admin.adsPage.videoHint' | translate) : ('admin.adsPage.imageHint' | translate) }}
              </div>
            </div>
          </div>

          <div *ngIf="selectedFile || form.mediaUrl" class="file-selected">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="font-size: 2rem;">
                {{ form.mediaType === 'video' ? '🎬' : '🖼️' }}
              </div>
              <div>
                <div>{{ selectedFile?.name || form.mediaUrl?.split('/').pop() }}</div>
                <div *ngIf="selectedFile" class="text-muted" style="font-size: 0.9rem;">
                  {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
                </div>
              </div>
              <button type="button" class="btn btn-danger btn-sm" (click)="clearFile()" style="margin-left: auto;">
                ✕
              </button>
            </div>
          </div>

          <div class="text-muted" style="font-size: 0.875rem; margin-top: 8px;">
            {{ 'admin.adsPage.directUrl' | translate }}
          </div>
          <input type="url" [(ngModel)]="form.mediaUrl" name="mediaUrl" class="form-control" style="margin-top: 8px;" [placeholder]="'admin.adsPage.mediaUrlPlaceholder' | translate">
        </div>

        <div class="form-group">
          <label class="form-label">{{ 'admin.adsPage.labelSections' | translate }}</label>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
            <label *ngFor="let section of allSections" class="checkbox-label">
              <input type="checkbox" [value]="section" [checked]="form.displayIn.includes(section)" (change)="toggleSection(section, $event)">
              {{ ('nav.' + section) | translate }}
            </label>
          </div>
        </div>

        <div class="form-row" style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
          <div class="form-group" style="flex: 1; min-width: 200px;">
            <label class="form-label">{{ 'admin.adsPage.labelOrder' | translate }}</label>
            <input type="number" [(ngModel)]="form.order" name="order" class="form-control" min="0">
          </div>

          <div class="form-group" style="flex: 1; min-width: 200px;">
            <label class="form-label">{{ 'admin.adsPage.labelEndDate' | translate }}</label>
            <input type="date" [(ngModel)]="form.endDate" name="endDate" class="form-control">
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label" *ngIf="form">
            <input type="checkbox" [(ngModel)]="form.isActive" name="isActive">
            {{ 'admin.adsPage.labelActive' | translate }}
          </label>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;">
          <button type="button" class="btn btn-secondary" (click)="modalVisible = false">
            {{ 'common.cancel' | translate }}
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="isSubmitting">
            <span *ngIf="!isSubmitting">{{ editingAd ? ('admin.adsPage.submitUpdate' | translate) : ('admin.adsPage.submitCreate' | translate) }}</span>
            <span *ngIf="isSubmitting">{{ 'common.saving' | translate }}</span>
          </button>
        </div>
      </form>
    </app-modal>
  `
})
export class AdManagementComponent implements OnInit {
  advertisements: any[] = [];
  modalVisible = false;
  editingAd: any = null;
  selectedFile: File | null = null;
  isSubmitting = false;

  allSections = ['forum', 'marketplace', 'jobs', 'solutions', 'solidarity', 'events', 'groups'];

  form = {
    title: '',
    description: '',
    mediaType: 'image',
    mediaUrl: '',
    targetUrl: '',
    buttonText: '',
    displayIn: [] as string[],
    order: 0,
    endDate: '',
    isActive: true
  };

  stats = {
    total: 0,
    active: 0,
    videos: 0
  };

  constructor(
    private api: ApiService,
    private router: Router,
    private translate: TranslateService
  ) {
    this.form.displayIn = [...this.allSections];
  }

  ngOnInit() {
    this.resetForm();
    this.loadAds();
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  loadAds() {
    this.api.get('advertisements/all').subscribe({
      next: (ads: any) => {
        this.advertisements = ads;
        this.updateStats();
      },
      error: (err) => console.error('Error loading ads:', err)
    });
  }

  updateStats() {
    this.stats.total = this.advertisements.length;
    this.stats.active = this.advertisements.filter(ad => ad.isActive).length;
    this.stats.videos = this.advertisements.filter(ad => ad.mediaType === 'video').length;
  }

  openCreateModal() {
    this.editingAd = null;
    this.resetForm();
    this.modalVisible = true;
  }

  editAd(ad: any) {
    this.editingAd = ad;
    this.form = {
      title: ad.title,
      description: ad.description || '',
      mediaType: ad.mediaType,
      mediaUrl: ad.mediaUrl,
      targetUrl: ad.targetUrl || '',
      buttonText: ad.buttonText || this.translate.instant('admin.adsPage.defaultButton'),
      displayIn: [...ad.displayIn],
      order: ad.order || 0,
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : '',
      isActive: ad.isActive
    };
    this.selectedFile = null;
    this.modalVisible = true;
  }

  resetForm() {
    this.form = {
      title: '',
      description: '',
      mediaType: 'image',
      mediaUrl: '',
      targetUrl: '',
      buttonText: this.translate.instant('admin.adsPage.defaultButton'),
      displayIn: [...this.allSections],
      order: 0,
      endDate: '',
      isActive: true
    };
    this.selectedFile = null;
  }

  addMediaFile(event: any) {
    const input = event?.target as HTMLInputElement;
    const file = input?.files?.[0] || null;
    if (!file) return;
    this.selectedFile = file;
    if (file.type.startsWith('video/')) this.form.mediaType = 'video';
    if (file.type.startsWith('image/')) this.form.mediaType = 'image';
    if (input) input.value = '';
  }

  clearFile() {
    this.selectedFile = null;
    this.form.mediaUrl = '';
  }

  toggleSection(section: string, event: any) {
    if (event.target.checked) {
      if (!this.form.displayIn.includes(section)) {
        this.form.displayIn.push(section);
      }
    } else {
      this.form.displayIn = this.form.displayIn.filter(s => s !== section);
    }
  }

  async saveAd() {
    if (!this.form.title) {
      alert(this.translate.instant('admin.adsPage.titleRequired'));
      return;
    }

    this.isSubmitting = true;

    try {
      const formData = new FormData();

      Object.keys(this.form).forEach(key => {
        if (key === 'displayIn') {
          formData.append(key, this.form.displayIn.join(','));
        } else {
          formData.append(key, (this.form as any)[key]);
        }
      });

      if (this.selectedFile) {
        formData.append('media', this.selectedFile);
      }

      if (this.editingAd) {
        await this.api.put(`advertisements/${this.editingAd._id}`, formData).toPromise();
      } else {
        await this.api.post('advertisements', formData).toPromise();
      }

      this.modalVisible = false;
      this.loadAds();
      this.resetForm();
    } catch (error) {
      console.error('Error saving ad:', error);
      alert(this.translate.instant('admin.adsPage.saveError'));
    } finally {
      this.isSubmitting = false;
    }
  }

  toggleAd(ad: any) {
    const msg = ad.isActive
      ? this.translate.instant('admin.adsPage.confirmDeactivate')
      : this.translate.instant('admin.adsPage.confirmActivate');
    if (!confirm(msg)) return;
    this.api.patch(`advertisements/${ad._id}/toggle`, {}).subscribe({
      next: () => {
        ad.isActive = !ad.isActive;
        this.updateStats();
      },
      error: (err) => console.error('Error toggling ad:', err)
    });
  }

  deleteAd(ad: any) {
    if (!confirm(this.translate.instant('admin.adsPage.confirmDelete'))) return;
    this.api.delete(`advertisements/${ad._id}`).subscribe({
      next: () => {
        this.advertisements = this.advertisements.filter(a => a._id !== ad._id);
        this.updateStats();
      },
      error: (err) => console.error('Error deleting ad:', err)
    });
  }
}
