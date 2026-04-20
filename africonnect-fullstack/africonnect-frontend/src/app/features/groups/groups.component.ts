import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SearchService } from '../../core/services/search.service';
import { AuthService } from '../../core/services/auth.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { QuillModule } from 'ngx-quill';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-groupes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, QuillModule, RouterLink, TranslateModule],
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
        <div style="color:var(--muted);">Par {{ item.authorName }} - {{ item.createdAt | date }}</div>
        <div class="text-muted" style="margin-top:6px;">
          👥 {{ (item.members?.length || 0) }} membre(s)
        </div>
        <div *ngIf="getImages(item).length > 0" class="thumb-grid">
          <img *ngFor="let url of getImages(item)" class="thumb" [src]="url" [alt]="item.title || item.name || 'Image'" (click)="openPreview(url)">
        </div>
        <div [innerHTML]="item.content || item.desc"></div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; align-items:center;">
          <button *ngIf="isLoggedIn && !isMember(item)" class="btn btn-primary" (click)="join(item)">Rejoindre</button>
          <button *ngIf="isLoggedIn && isMember(item)" class="btn btn-secondary" (click)="leave(item)">Quitter</button>
          <button *ngIf="canDelete(item)" class="btn btn-secondary" (click)="deleteItem(item._id)">{{ 'common.delete' | translate }}</button>
          <button (click)="toggleLike(item)" class="btn">❤️ {{ item.likes?.length || 0 }}</button>
        </div>
      </div>
    </div>

    <app-modal [(visible)]="modalVisible" [title]="'sections.groupsNew' | translate">
      <form [formGroup]="itemForm" (ngSubmit)="submit()" class="form-modal">
        <div class="form-group">
          <label class="form-label">Nom du groupe *</label>
          <input type="text" formControlName="name" placeholder="Ex: Entrepreneurs Africains Paris" class="form-control">
          <div *ngIf="itemForm.get('name')?.invalid && itemForm.get('name')?.touched" class="text-error">
            Le nom est requis
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea formControlName="description" placeholder="But du groupe, règles, thématiques..." rows="5" class="form-control"></textarea>
          <div class="text-muted" style="font-size:0.875rem; margin-top:4px;">Optionnel</div>
        </div>

        <div class="form-group">
          <label class="form-label">Catégorie</label>
          <input type="text" formControlName="category" placeholder="Ex: Business, Culture, Sport..." class="form-control">
          <div class="text-muted" style="font-size:0.875rem; margin-top:4px;">Optionnel</div>
        </div>

        <div class="form-group">
          <label class="form-label">Image (optionnelle)</label>
          <div class="file-upload">
            <input #imgInput type="file" accept="image/*" (change)="addFile($event)" style="display:none;">
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
              <button type="button" class="btn btn-secondary" (click)="imgInput.click()" [disabled]="selectedFiles.length >= 3">
                {{ 'common.addPhoto' | translate }}
              </button>
              <div class="text-muted" style="font-size: 0.9rem;">{{ selectedFiles.length }}/3</div>
            </div>

            <div *ngIf="selectedFileUrls.length === 0" class="text-muted" style="margin-top:10px; font-size:0.9rem;">
              {{ fileDescription }}
            </div>

            <div *ngIf="selectedFileUrls.length > 0" class="thumb-grid" style="margin-top:10px;">
              <div *ngFor="let url of selectedFileUrls; let i = index" style="position:relative;">
                <img class="thumb" [src]="url" alt="Image sélectionnée" (click)="openPreview(url)">
                <button type="button" class="btn btn-danger btn-sm"
                  (click)="removeFile(i)"
                  style="position:absolute; top:6px; right:6px; padding:6px 8px; border-radius:999px;">
                  ✕
                </button>
              </div>
            </div>
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

  get fileDescription(): string {
    return 'PNG, JPG, GIF jusqu\'à 5MB';
  }

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private searchService: SearchService,
    private auth: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.auth.currentUser.subscribe(u => {
      this.isLoggedIn = !!u;
      this.currentUserId = u?.id || '';
      this.currentUserRole = u?.role || '';
    });
    this.loadItems();
    this.searchService.query$.subscribe(q => {
      this.searchQuery = q;
      this.updateFilter();
    });
  }
  loadItems() { this.api.get('groups').subscribe((data: any) => { this.items = data; this.updateFilter(); }); }
  openModal() {
    this.itemForm.reset({ name: '', description: '', category: '' });
    this.clearFiles();
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
      if (this.selectedFiles.length > 0) {
        const fd = new FormData();
        this.selectedFiles.forEach(f => fd.append('images', f));
        const upload: any = await this.api.post('upload', fd).toPromise();
        formValue.imageUrls = Array.isArray(upload?.urls) ? upload.urls : (upload?.url ? [upload.url] : []);
      }
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
}