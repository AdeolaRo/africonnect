import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SearchService } from '../../core/services/search.service';
import { AuthService } from '../../core/services/auth.service';
import { LocationPreferenceService } from '../../core/services/location-preference.service';
import { formatLocationLine } from '../../core/utils/location-list.util';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PublishLocationStepComponent } from '../../shared/components/publish-location-step/publish-location-step.component';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-groupes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, RouterLink, TranslateModule, PublishLocationStepComponent],
  template: `
    <div style="display:flex; justify-content:flex-end; margin-bottom:24px;">
      <button *ngIf="isLoggedIn" class="btn btn-primary" (click)="openModal()">{{ 'common.new' | translate }}</button>
    </div>
    <div *ngIf="items.length === 0" style="text-align:center; padding:48px;">{{ 'common.none' | translate }}</div>
    <div class="items-grid" *ngIf="filteredItems.length">
      <div *ngFor="let item of filteredItems" class="item-card">
        <h3 style="margin-bottom: 6px;">
          <a [routerLink]="['/groupes', item._id]" style="color: inherit; text-decoration: none;">
            {{ item.title || item.name }}
          </a>
        </h3>
        <div *ngIf="getLocLine(item)" class="pub-loc-pill">📍 {{ getLocLine(item) }}</div>
        <div style="color:var(--muted);">{{ 'common.metaBy' | translate:{ author: (item.authorName || ('forumUi.anonymous' | translate)) } }} — {{ item.createdAt | date }}</div>
        <div class="text-muted" style="margin-top:6px;">
          👥 {{ 'groupsList.membersCount' | translate:{ count: (item.members?.length || 0) } }}
        </div>
        <div *ngIf="getImages(item).length > 0" class="thumb-grid">
          <img *ngFor="let url of getImages(item)" class="thumb" [src]="url" [alt]="item.title || item.name || ('groupsList.altGroupCover' | translate)" (click)="openPreview(url)">
        </div>
        <div class="card-excerpt-2" style="margin-top:8px; color: var(--text-muted);">
          {{ (item.desc || item.content || '') }}
        </div>
        <div *ngIf="(item.links?.length || 0) > 0" style="margin-top:10px; padding:10px; border:1px solid var(--border); border-radius:12px; background: var(--surface-2);">
          <div style="font-weight:700; margin-bottom:6px;">{{ 'common.linksTitle' | translate }}</div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <a *ngFor="let l of item.links" [href]="l.url" target="_blank" rel="noopener noreferrer" style="color: var(--secondary); text-decoration:none;">
              🔗 {{ l.label || l.url }}
            </a>
          </div>
        </div>
        <div class="card-actions bottom">
          <a class="btn btn-secondary btn-sm" [routerLink]="['/groupes', item._id]">{{ 'common.view' | translate }}</a>
          <button *ngIf="isLoggedIn" class="btn btn-secondary btn-sm" type="button" (click)="toggleSave(item)">
            {{ isSaved(item?._id) ? ('common.unsavePost' | translate) : ('common.savePost' | translate) }}
          </button>
          <button type="button" (click)="toggleLike(item)" class="btn btn-sm btn-like">{{ 'common.likesCountLabel' | translate:{ count: (item.likes?.length || 0) } }}</button>
          <button *ngIf="isLoggedIn && !isMember(item)" class="btn btn-primary btn-sm" (click)="join(item)">{{ 'groupDetail.join' | translate }}</button>
          <button *ngIf="isLoggedIn && isMember(item)" class="btn btn-secondary btn-sm" (click)="leave(item)">{{ 'groupDetail.leave' | translate }}</button>
          <button *ngIf="canDelete(item)" class="btn btn-danger btn-sm" (click)="deleteItem(item._id)">{{ 'common.delete' | translate }}</button>
        </div>
      </div>
    </div>

    <app-modal [(visible)]="modalVisible" [title]="'sections.groupsNew' | translate">
      <app-publish-location-step
        *ngIf="locationStepActive"
        (confirmed)="onLocConfirm($event)"
        (skipped)="onLocSkip()">
      </app-publish-location-step>
      <form *ngIf="!locationStepActive" [formGroup]="itemForm" (ngSubmit)="submit()" class="form-modal">
        <div class="form-group">
          <label class="form-label">{{ 'groupsList.nameLabel' | translate }}</label>
          <input type="text" formControlName="name" [placeholder]="'groupsList.namePlaceholder' | translate" class="form-control">
          <div *ngIf="itemForm.get('name')?.invalid && itemForm.get('name')?.touched" class="text-error">
            {{ 'groupsList.nameRequired' | translate }}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ 'groupsList.descriptionLabel' | translate }}</label>
          <textarea formControlName="description" [placeholder]="'groupsList.descriptionPlaceholder' | translate" rows="5" class="form-control"></textarea>
          <div class="text-muted" style="font-size:0.875rem; margin-top:4px;">{{ 'groupsList.optionalHint' | translate }}</div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ 'groupsList.categoryLabel' | translate }}</label>
          <input type="text" formControlName="category" [placeholder]="'groupsList.categoryPlaceholder' | translate" class="form-control">
          <div class="text-muted" style="font-size:0.875rem; margin-top:4px;">{{ 'groupsList.optionalHint' | translate }}</div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ 'groupsList.imageOptional' | translate }}</label>
          <div class="file-upload">
            <input #imgInput type="file" accept="image/*" (change)="addFile($event)" style="display:none;">
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
              <button type="button" class="btn btn-secondary" (click)="imgInput.click()" [disabled]="selectedFiles.length >= 3">
                {{ 'common.addPhoto' | translate }}
              </button>
              <div class="text-muted" style="font-size: 0.9rem;">{{ selectedFiles.length }}/3</div>
            </div>

            <div *ngIf="selectedFileUrls.length === 0" class="text-muted" style="margin-top:10px; font-size:0.9rem;">
              {{ 'groupsList.imageHint' | translate }}
            </div>

            <div *ngIf="selectedFileUrls.length > 0" class="thumb-grid" style="margin-top:10px;">
              <div *ngFor="let url of selectedFileUrls; let i = index" style="position:relative;">
                <img class="thumb" [src]="url" [alt]="'groupsList.altSelectedImage' | translate" (click)="openPreview(url)">
                <button type="button" class="btn btn-danger btn-sm"
                  (click)="removeFile(i)"
                  style="position:absolute; top:6px; right:6px; padding:6px 8px; border-radius:999px;">
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group" formArrayName="links">
          <label class="form-label">{{ 'common.linksTitle' | translate }}</label>
          <div *ngFor="let fg of linksArray.controls; let i = index" [formGroupName]="i"
               style="display:grid; grid-template-columns: 1fr 1.2fr auto; gap:10px; align-items:end; margin-top:10px;">
            <div class="form-group" style="margin:0;">
              <label class="form-label">{{ 'common.linkLabel' | translate }}</label>
              <input type="text" class="form-control" formControlName="label" [placeholder]="'common.linkLabel' | translate">
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label">{{ 'common.linkUrl' | translate }}</label>
              <input type="url" class="form-control" formControlName="url" [placeholder]="'common.linkUrl' | translate">
            </div>
            <button type="button" class="btn btn-secondary" (click)="removeLink(i)">{{ 'common.removeLink' | translate }}</button>
          </div>

          <div style="margin-top:10px;">
            <button type="button" class="btn btn-secondary" (click)="addLink()">{{ 'common.addLink' | translate }}</button>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:32px;">
          <button type="button" class="btn btn-secondary" (click)="modalVisible = false" [disabled]="isSubmitting">
            {{ 'common.cancel' | translate }}
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="itemForm.invalid || isSubmitting">
            <span *ngIf="!isSubmitting">{{ 'common.createGroup' | translate }}</span>
            <span *ngIf="isSubmitting">{{ 'common.sending' | translate }}</span>
          </button>
        </div>
      </form>
    </app-modal>

    <app-modal [(visible)]="previewVisible" [title]="'common.preview' | translate">
      <img *ngIf="previewUrl" [src]="previewUrl" [alt]="'common.preview' | translate" style="width:100%; max-height: 70vh; object-fit: contain; border-radius: 12px;">
    </app-modal>
  `
})
export class GroupesComponent implements OnInit {
  items: any[] = [];
  searchQuery = '';
  modalVisible = false;
  itemForm = this.fb.group({
    name: ['', Validators.required],
      description: ['', null],
      category: ['', null],
      links: this.fb.array([]),
  });
  selectedFiles: File[] = [];
  selectedFileUrls: string[] = [];
  previewVisible = false;
  previewUrl = '';
  isLoggedIn = false;
  currentUserId = '';
  currentUserRole = '';
  filteredItems: any[] = [];
  isSubmitting = false;
  savedIds = new Set<string>();
  locationStepActive = true;
  publishContinent = '';
  publishCity = '';

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private searchService: SearchService,
    private locPref: LocationPreferenceService,
    private auth: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.auth.currentUser.subscribe(u => {
      this.isLoggedIn = !!u;
      this.currentUserId = u?.id || '';
      this.currentUserRole = u?.role || '';
      if (this.isLoggedIn) this.loadSavedIds();
      else this.savedIds = new Set<string>();
    });
    this.loadItems();
    this.searchService.query$.subscribe(q => {
      this.searchQuery = q;
      this.updateFilter();
    });
  }
  loadItems() { this.api.get('groups').subscribe((data: any) => { this.items = data; this.updateFilter(); }); }

  getLocLine(item: any): string {
    if (!item) return '';
    return formatLocationLine(item, (c) => this.translate.instant('location.continent.' + c));
  }

  onLocConfirm(e: { continent: string; city: string }) {
    this.publishContinent = e.continent;
    this.publishCity = e.city;
    this.locationStepActive = false;
  }

  onLocSkip() {
    this.locationStepActive = false;
  }

  openModal() {
    this.itemForm.reset({ name: '', description: '', category: '' });
    this.resetLinks([]);
    this.clearFiles();
    const p = this.locPref.get();
    this.publishContinent = p.continent;
    this.publishCity = p.city;
    this.locationStepActive = true;
    this.modalVisible = true;
  }

  addFile(event: any) {
    const input = event?.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    if (this.selectedFiles.length >= 3) return;
    this.selectedFiles.push(file);
    this.selectedFileUrls.push(URL.createObjectURL(file));
    if (input) input.value = '';
  }

  removeFile(index: number) {
    const url = this.selectedFileUrls[index];
    if (url) URL.revokeObjectURL(url);
    this.selectedFiles.splice(index, 1);
    this.selectedFileUrls.splice(index, 1);
  }

  clearFiles() {
    this.selectedFileUrls.forEach(u => { try { URL.revokeObjectURL(u); } catch {} });
    this.selectedFiles = [];
    this.selectedFileUrls = [];
  }
  getImages(item: any): string[] {
    const urls = Array.isArray(item?.imageUrls) && item.imageUrls.length
      ? item.imageUrls
      : (item?.imageUrl ? [item.imageUrl] : []);
    return urls.filter(Boolean).slice(0, 3);
  }
  openPreview(url: string) {
    this.previewUrl = url;
    this.previewVisible = true;
  }
  async submit() {
    if (this.itemForm.invalid) return;

    this.isSubmitting = true;
    try {
      const formValue: any = this.itemForm.value;
      if (Array.isArray(formValue.links)) {
        formValue.links = formValue.links
          .filter((l: any) => String(l?.url || '').trim())
          .map((l: any) => ({ label: String(l?.label || '').trim(), url: String(l?.url || '').trim() }));
      }
      if (this.selectedFiles.length > 0) {
        const fd = new FormData();
        this.selectedFiles.forEach(f => fd.append('images', f));
        const upload: any = await this.api.post('upload', fd).toPromise();
        formValue.imageUrls = Array.isArray(upload?.urls) ? upload.urls : (upload?.url ? [upload.url] : []);
      }
      formValue.continent = String(this.publishContinent || '').trim();
      formValue.city = String(this.publishCity || '').trim();
      await this.api.post('groups', formValue).toPromise();
      this.modalVisible = false;
      this.loadItems();
      this.itemForm.reset();
      this.clearFiles();
    } catch (error) {
      console.error('Error submitting group:', error);
      alert(this.translate.instant('errors.groupsCreateFailed'));
    } finally {
      this.isSubmitting = false;
    }
  }
  deleteItem(id: string) {
    if (confirm(this.translate.instant('common.confirmDelete'))) this.api.delete('groups/' + id).subscribe(() => this.loadItems());
  }
  canDelete(item: any) {
    if (!this.isLoggedIn) return false;
    if (this.currentUserRole === 'admin' || this.currentUserRole === 'moderator') return true;
    return !!item?.userId && String(item.userId) === String(this.currentUserId);
  }

  toggleLike(item: any) {
    if (!this.isLoggedIn) {
      alert(this.translate.instant('errors.likeLogin'));
      return;
    }
    this.api.post('groups/' + item._id + '/like', {}).subscribe({
      next: (updated: any) => item.likes = updated?.likes || item.likes,
      error: (err) => {
        console.error('Error liking group:', err);
        alert(this.translate.instant('errors.likeFailed'));
      }
    });
  }

  isMember(item: any): boolean {
    if (!this.currentUserId) return false;
    const members = Array.isArray(item?.members) ? item.members : [];
    return members.map(String).includes(String(this.currentUserId));
  }

  join(item: any) {
    this.api.post(`groups/${item._id}/join`, {}).subscribe({
      next: (updated: any) => {
        item.members = updated?.members || item.members;
      },
      error: (err) => {
        console.error('Error joining group:', err);
        alert(this.translate.instant('errors.joinGroupFailed'));
      }
    });
  }

  leave(item: any) {
    this.api.post(`groups/${item._id}/leave`, {}).subscribe({
      next: (updated: any) => {
        item.members = updated?.members || item.members;
      },
      error: (err) => {
        console.error('Error leaving group:', err);
        alert(this.translate.instant('errors.leaveGroupFailed'));
      }
    });
  }
  updateFilter() { this.filteredItems = this.items.filter(i => JSON.stringify(i).toLowerCase().includes(this.searchQuery.toLowerCase())); }

  loadSavedIds() {
    this.api.get('user/saved').subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : [];
        this.savedIds = new Set(list.map(p => String(p?._id || '')).filter(Boolean));
      },
      error: () => this.savedIds = new Set<string>()
    });
  }

  isSaved(postId: any): boolean {
    const id = String(postId || '');
    if (!id) return false;
    return this.savedIds.has(id);
  }

  toggleSave(item: any) {
    if (!this.isLoggedIn) return;
    const id = String(item?._id || '');
    if (!id) return;
    if (this.isSaved(id)) {
      this.api.delete(`user/save/${id}`).subscribe({ next: () => this.loadSavedIds(), error: () => {} });
      return;
    }
    this.api.post(`user/save/${id}`, {}).subscribe({ next: () => this.loadSavedIds(), error: () => {} });
  }

  get linksArray(): FormArray {
    return this.itemForm.get('links') as FormArray;
  }

  addLink(value?: any) {
    this.linksArray.push(this.fb.group({
      label: [String(value?.label || ''), []],
      url: [String(value?.url || ''), [Validators.required, Validators.pattern(/^https?:\/\/.+/i)]]
    }));
  }

  removeLink(index: number) {
    this.linksArray.removeAt(index);
  }

  private resetLinks(list: any[]) {
    while (this.linksArray.length) this.linksArray.removeAt(0);
    (Array.isArray(list) ? list : []).forEach(l => this.addLink(l));
  }
}