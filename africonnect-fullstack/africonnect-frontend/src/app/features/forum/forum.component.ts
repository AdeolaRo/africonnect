import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SearchService } from '../../core/services/search.service';
import { LocationPreferenceService } from '../../core/services/location-preference.service';
import { AuthService } from '../../core/services/auth.service';
import { applySectionListFilters } from '../../core/utils/list-filter.helper';
import { formatLocationLine } from '../../core/utils/location-list.util';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PublishLocationStepComponent } from '../../shared/components/publish-location-step/publish-location-step.component';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, FormsModule, TranslateModule, PublishLocationStepComponent],
  template: `
    <div style="display:flex; justify-content:flex-end; margin-bottom:24px;">
      <button *ngIf="isLoggedIn" class="btn btn-primary" (click)="openModal()">{{ 'common.new' | translate }}</button>
    </div>
    <div *ngIf="items.length === 0" style="text-align:center; padding:48px;">{{ 'common.none' | translate }}</div>
      <div *ngFor="let item of filteredItems" class="item-card">
      <h3>{{ item.title || item.name }}</h3>
      <div *ngIf="getLocLine(item)" class="pub-loc-pill">📍 {{ getLocLine(item) }}</div>
      <div style="color:var(--muted);">{{ 'common.metaBy' | translate:{ author: (item.authorName || ('forumUi.anonymous' | translate)) } }} — {{ item.createdAt | date }}</div>
      <div *ngIf="getImages(item).length > 0" class="thumb-grid">
        <img *ngFor="let url of getImages(item)" class="thumb" [src]="url" [alt]="item.title || item.name || 'Image'" (click)="openPreview(url)">
      </div>
      <div class="card-excerpt-2" style="margin-top:8px; color: var(--text-muted);">
        {{ stripHtml(item.content || item.desc || '') }}
      </div>

      <div class="card-actions bottom">
        <button class="btn btn-secondary btn-sm" type="button" (click)="openView(item)">{{ 'common.view' | translate }}</button>
        <button *ngIf="isLoggedIn" class="btn btn-secondary btn-sm" type="button" (click)="toggleSave(item)">
          {{ isSaved(item?._id) ? ('common.unsavePost' | translate) : ('common.savePost' | translate) }}
        </button>
        <button type="button" (click)="toggleLike(item)" class="btn btn-sm btn-like">{{ 'common.likesCountLabel' | translate:{ count: (item.likes?.length || 0) } }}</button>
        <button class="btn btn-secondary btn-sm" (click)="toggleReplies(item)" type="button">
          {{ 'forumUi.replies' | translate:{ count: item.comments?.length || 0 } }}
        </button>
        <button *ngIf="canDelete(item)" class="btn btn-secondary btn-sm" (click)="editItem(item)">{{ 'common.edit' | translate }}</button>
        <button *ngIf="canDelete(item)" class="btn btn-danger btn-sm" (click)="deleteItem(item._id)">{{ 'common.delete' | translate }}</button>
      </div>

      <div *ngIf="isRepliesOpen(item)" style="margin-top:14px;">
        <div *ngIf="(item.comments?.length || 0) === 0" class="text-muted" style="padding:12px; background:var(--surface-2); border-radius:12px; border:1px solid var(--border);">
          {{ 'forumUi.noReplies' | translate }}
        </div>

        <div *ngFor="let c of (item.comments || [])" style="margin-top:10px; padding:12px; background:var(--surface-2); border-radius:12px; border:1px solid var(--border);">
          <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; flex-wrap:wrap;">
            <div style="font-weight:700;">{{ c.authorName || ('forumUi.anonymous' | translate) }}</div>
            <div class="text-muted" style="font-size:0.85rem;">{{ c.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
          </div>
          <div style="margin-top:6px; white-space:pre-wrap;">{{ c.content }}</div>
        </div>

        <div style="margin-top:12px;" *ngIf="isLoggedIn">
          <label class="form-label">{{ 'forumUi.replyLabel' | translate }}</label>
          <textarea class="form-control" rows="3" [(ngModel)]="replyDraft[item._id]" [placeholder]="'forumUi.replyPlaceholder' | translate"></textarea>
          <div style="display:flex; justify-content:flex-end; margin-top:10px;">
            <button class="btn btn-primary" type="button" (click)="submitReply(item)" [disabled]="!replyDraft[item._id]?.trim()">
              {{ 'forumUi.sendReply' | translate }}
            </button>
          </div>
        </div>

        <div *ngIf="!isLoggedIn" class="text-muted" style="margin-top:10px;">
          {{ 'forumUi.loginToReply' | translate }}
        </div>
      </div>
    </div>

    <app-modal [(visible)]="modalVisible" [title]="(editingItem ? 'sections.forumEdit' : 'sections.forumNew') | translate">
      <app-publish-location-step
        *ngIf="!editingItem && locationStepActive"
        (confirmed)="onLocConfirm($event)"
        (skipped)="onLocSkip()">
      </app-publish-location-step>
      <form *ngIf="editingItem || !locationStepActive" [formGroup]="itemForm" (ngSubmit)="submit()" class="form-modal">
        <div class="form-group">
          <label class="form-label">{{ 'forumUi.titleLabel' | translate }}</label>
          <input type="text" formControlName="title" [placeholder]="'forumUi.titlePlaceholder' | translate" class="form-control">
          <div *ngIf="itemForm.get('title')?.invalid && itemForm.get('title')?.touched" class="text-error">
            {{ 'forumUi.titleRequired' | translate }}
          </div>
        </div>
        
        <div class="form-group form-modal-forum-content">
          <label class="form-label">{{ 'forumUi.contentLabel' | translate }}</label>
          <textarea
            class="form-control form-modal-field-desc forum-content-textarea"
            formControlName="content"
            rows="4"
            spellcheck="true"
            [placeholder]="'forumUi.contentPlaceholder' | translate"
            [attr.aria-label]="'forumUi.contentLabel' | translate"></textarea>
          <div *ngIf="itemForm.get('content')?.invalid && itemForm.get('content')?.touched" class="text-error">
            {{ 'forumUi.contentRequired' | translate }}
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ 'forumUi.imageOptional' | translate }}</label>
          <div class="file-upload">
            <input #imgInput type="file" accept="image/*" (change)="addFile($event)" style="display:none;">
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
              <button type="button" class="btn btn-secondary" (click)="imgInput.click()" [disabled]="selectedFiles.length >= 3">
                {{ 'common.addPhoto' | translate }}
              </button>
              <div class="text-muted" style="font-size: 0.9rem;">{{ selectedFiles.length }}/3</div>
            </div>

            <div *ngIf="selectedFileUrls.length === 0" class="text-muted" style="margin-top:10px; font-size:0.9rem;">
              {{ 'forumUi.imageHint' | translate }}
            </div>

            <div *ngIf="selectedFileUrls.length > 0" class="thumb-grid" style="margin-top:10px;">
              <div *ngFor="let url of selectedFileUrls; let i = index" style="position:relative;">
                <img class="thumb" [src]="url" [alt]="'forumUi.altSelectedImage' | translate" (click)="openPreview(url)">
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
          <div *ngIf="linksArray.controls.length === 0" class="text-muted" style="font-size:0.9rem;">
            {{ 'common.addLink' | translate }}
          </div>

          <div *ngFor="let fg of linksArray.controls; let i = index" [formGroupName]="i" class="form-modal-links-row">
            <div class="form-group" style="margin:0;">
              <label class="form-label">{{ 'common.linkLabel' | translate }}</label>
              <input type="text" class="form-control" formControlName="label" [placeholder]="'common.linkLabel' | translate">
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label">{{ 'common.linkUrl' | translate }}</label>
              <input type="url" class="form-control" formControlName="url" [placeholder]="'common.linkUrl' | translate">
              <div *ngIf="fg.get('url')?.invalid && fg.get('url')?.touched" class="text-error">
                {{ 'common.linkUrl' | translate }}
              </div>
            </div>
            <button type="button" class="btn btn-secondary" (click)="removeLink(i)">{{ 'common.removeLink' | translate }}</button>
          </div>

          <div style="margin-top:10px;">
            <button type="button" class="btn btn-secondary" (click)="addLink()">{{ 'common.addLink' | translate }}</button>
          </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;">
          <button type="button" class="btn btn-secondary" (click)="modalVisible = false">
            {{ 'common.cancel' | translate }}
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="itemForm.invalid || isSubmitting">
            <span *ngIf="!isSubmitting">{{ 'sections.forumPublish' | translate }}</span>
            <span *ngIf="isSubmitting">{{ 'common.sending' | translate }}</span>
          </button>
        </div>
      </form>
    </app-modal>

    <app-modal [(visible)]="previewVisible" [title]="'common.preview' | translate">
      <img *ngIf="previewUrl" [src]="previewUrl" [alt]="'common.preview' | translate" style="width:100%; max-height: 70vh; object-fit: contain; border-radius: 12px;">
    </app-modal>

    <app-modal [(visible)]="viewVisible" [title]="'common.details' | translate" [size]="'wide'">
      <div *ngIf="viewItem">
        <h3 style="margin-top:0;">{{ viewItem.title || viewItem.name || ('common.details' | translate) }}</h3>
        <div *ngIf="getLocLine(viewItem)" class="pub-loc-pill" style="margin-top:6px;">📍 {{ getLocLine(viewItem) }}</div>
        <div class="text-muted" style="margin-top:6px;">
          {{ viewItem.createdAt | date:'dd/MM/yyyy HH:mm' }}
        </div>

        <div *ngIf="getImages(viewItem).length > 0" class="thumb-grid" style="margin-top:12px;">
          <img *ngFor="let url of getImages(viewItem)" class="thumb" [src]="url" [alt]="viewItem.title || viewItem.name || 'Image'" (click)="openPreview(url)">
        </div>

        <div class="modal-body forum-view-plain" style="margin-top:12px; white-space: pre-wrap;">{{ plainTextFromStored(viewItem.content || viewItem.desc || '') }}</div>

        <div *ngIf="(viewItem.links?.length || 0) > 0" style="margin-top:12px; padding:10px; border:1px solid var(--border); border-radius:12px; background: var(--surface-2);">
          <div style="font-weight:700; margin-bottom:6px;">{{ 'common.linksTitle' | translate }}</div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <a *ngFor="let l of viewItem.links" [href]="l.url" target="_blank" rel="noopener noreferrer" style="color: var(--secondary); text-decoration:none;">
              🔗 {{ l.label || l.url }}
            </a>
          </div>
        </div>

        <div class="card-actions bottom">
          <button class="btn btn-secondary btn-sm" type="button" (click)="viewVisible=false">{{ 'common.close' | translate }}</button>
        </div>
      </div>
    </app-modal>
  `
})
export class ForumComponent implements OnInit {
  items: any[] = [];
  searchQuery = '';
  modalVisible = false;
  itemForm = this.fb.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
    links: this.fb.array([])
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
  viewVisible = false;
  viewItem: any = null;
  savedIds = new Set<string>();
  replyDraft: Record<string, string> = {};
  openReplies: Record<string, boolean> = {};
  private pendingOpenNew = false;
  editingItem: any = null;
  locationStepActive = true;
  publishContinent = '';
  publishCity = '';

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private searchService: SearchService,
    private locPref: LocationPreferenceService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.auth.currentUser.subscribe(u => {
      this.isLoggedIn = !!u;
      this.currentUserId = u?.id || '';
      this.currentUserRole = u?.role || '';
      if (this.isLoggedIn) this.loadSavedIds();
      else this.savedIds = new Set<string>();

      if (this.pendingOpenNew && this.isLoggedIn) {
        this.pendingOpenNew = false;
        this.openModal();
      }
    });
    this.route.queryParams.subscribe(params => {
      if (params?.new) {
        if (this.auth.isLoggedIn()) this.openModal();
        else this.pendingOpenNew = true;
      }
    });
    this.loadItems();
    this.searchService.state$.subscribe((st) => {
      this.searchQuery = st.query;
      this.updateFilter();
    });
  }

  getLocLine(item: any): string {
    if (!item) return '';
    return formatLocationLine(item, (code) => this.translate.instant('location.continent.' + code));
  }

  onLocConfirm(e: { continent: string; city: string }) {
    this.publishContinent = e.continent;
    this.publishCity = e.city;
    this.locationStepActive = false;
  }

  onLocSkip() {
    this.locationStepActive = false;
  }
  loadItems() { this.api.get('forum').subscribe((data: any) => { this.items = data; this.updateFilter(); }); }
  openModal() {
    this.editingItem = null;
    this.itemForm.reset({ title: '', content: '' });
    this.resetLinks([]);
    this.clearFiles();
    const p = this.locPref.get();
    this.publishContinent = p.continent;
    this.publishCity = p.city;
    this.locationStepActive = true;
    this.modalVisible = true;
  }

  editItem(item: any) {
    this.editingItem = item;
    this.itemForm.patchValue({
      title: item?.title || '',
      content: this.plainTextFromStored(item?.content || item?.desc || '')
    });
    this.resetLinks(Array.isArray(item?.links) ? item.links : []);
    this.clearFiles();
    this.locationStepActive = false;
    this.publishContinent = String(item?.continent || '');
    this.publishCity = String(item?.city || '');
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

  openView(item: any) {
    this.viewItem = item;
    this.viewVisible = true;
  }

  stripHtml(html: string): string {
    return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /** Texte simple pour saisie / affichage (anciens messages pouvant être en HTML) */
  plainTextFromStored(raw: string): string {
    const s = String(raw || '');
    if (!s) return '';
    if (!s.includes('<')) return s;
    if (typeof document === 'undefined') {
      return this.stripHtml(s);
    }
    const tmp = document.createElement('div');
    tmp.innerHTML = s;
    return (tmp.textContent || tmp.innerText || '').trim();
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
      if (this.editingItem?.imageUrls && !formValue.imageUrls) formValue.imageUrls = this.editingItem.imageUrls;
      if (this.selectedFiles.length > 0) {
        const fd = new FormData();
        this.selectedFiles.forEach(f => fd.append('images', f));
        const upload: any = await this.api.post('upload', fd).toPromise();
        formValue.imageUrls = Array.isArray(upload?.urls) ? upload.urls : (upload?.url ? [upload.url] : []);
      }
      
      formValue.continent = this.publishContinent || '';
      formValue.city = this.publishCity || '';
      if (this.editingItem?._id) {
        await this.api.put(`user/posts/${this.editingItem._id}`, formValue).toPromise();
      } else {
        await this.api.post('forum', formValue).toPromise();
      }
      this.modalVisible = false;
      this.loadItems();
      this.itemForm.reset();
      this.selectedFiles = [];
    } catch (error) {
      console.error('Error submitting forum post:', error);
      alert(this.translate.instant('errors.publishFailed'));
    } finally {
      this.isSubmitting = false;
    }
  }
  deleteItem(id: string) {
    if (confirm(this.translate.instant('common.confirmDelete'))) this.api.delete('forum/' + id).subscribe(() => this.loadItems());
  }
  canDelete(item: any) {
    if (!this.isLoggedIn) return false;
    if (this.currentUserRole === 'admin' || this.currentUserRole === 'moderator') return true;
    return !!item?.userId && String(item.userId) === String(this.currentUserId);
  }

  toggleLike(item: any) {
    if (!this.isLoggedIn) {
      alert(this.translate.instant('errors.likeLoginPost'));
      return;
    }
    this.api.post('forum/' + item._id + '/like', {}).subscribe({
      next: (updated: any) => {
        // Mise à jour locale pour retour immédiat
        item.likes = updated?.likes || item.likes;
      },
      error: (err) => {
        console.error('Error liking forum post:', err);
        alert(this.translate.instant('errors.likeFailed'));
      }
    });
  }

  toggleReplies(item: any) {
    const id = String(item?._id || '');
    if (!id) return;
    this.openReplies[id] = !this.openReplies[id];
  }

  isRepliesOpen(item: any): boolean {
    const id = String(item?._id || '');
    return !!this.openReplies[id];
  }

  async submitReply(item: any) {
    if (!this.isLoggedIn) return;
    const id = String(item?._id || '');
    const content = String(this.replyDraft[id] || '').trim();
    if (!id || !content) return;

    try {
      const updated: any = await this.api.post(`forum/${id}/comments`, { content }).toPromise();
      item.comments = updated?.comments || item.comments;
      this.replyDraft[id] = '';
    } catch (err) {
      console.error('Error posting reply:', err);
      alert(this.translate.instant('errors.replyFailed'));
    }
  }
  updateFilter() {
    this.filteredItems = applySectionListFilters(this.items, this.searchService, this.locPref);
  }

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