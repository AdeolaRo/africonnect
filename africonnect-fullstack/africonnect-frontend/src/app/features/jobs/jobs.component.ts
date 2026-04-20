import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SearchService } from '../../core/services/search.service';
import { AuthService } from '../../core/services/auth.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-emploi',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, QuillModule],
  template: `
    <div style="display:flex; justify-content:flex-end; margin-bottom:24px;">
      <button *ngIf="isLoggedIn" class="btn btn-primary" (click)="openModal()">+ Nouveau</button>
    </div>
    <div *ngIf="items.length === 0" style="text-align:center; padding:48px;">Aucun élément</div>
    <div class="items-grid" *ngIf="filteredItems.length">
      <div *ngFor="let item of filteredItems" class="item-card">
      <h3>{{ item.title || item.name }}</h3>
      <div style="color:var(--muted);">Par {{ item.authorName }} - {{ item.createdAt | date }}</div>
      <div class="item-meta" *ngIf="item.company || item.contact" style="margin-top:6px;">
        <span *ngIf="item.company">🏢 {{ item.company }}</span>
        <span *ngIf="item.contact">📩 {{ item.contact }}</span>
      </div>
      <div *ngIf="getImages(item).length > 0" class="thumb-grid">
        <img *ngFor="let url of getImages(item)" class="thumb" [src]="url" [alt]="item.title || 'Image'" (click)="openPreview(url)">
      </div>
      <div [innerHTML]="item.content || item.desc"></div>
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
        <button *ngIf="canDelete(item)" class="btn btn-secondary" (click)="editItem(item)">Modifier</button>
        <button *ngIf="canDelete(item)" class="btn btn-secondary" (click)="deleteItem(item._id)">Supprimer</button>
        <button (click)="toggleLike(item)" class="btn">❤️ {{ item.likes?.length || 0 }}</button>
      </div>
      </div>
    </div>

    <app-modal [(visible)]="modalVisible" [title]="editingItem ? 'Modifier l\\'offre d\\'emploi' : 'Nouvelle offre d\\'emploi'">
      <form [formGroup]="itemForm" (ngSubmit)="submit()" class="form-modal">
        <div class="form-group">
          <label class="form-label">Intitulé du poste *</label>
          <input type="text" formControlName="title" placeholder="Ex: Développeur Fullstack (Angular/Node)" class="form-control">
          <div *ngIf="itemForm.get('title')?.invalid && itemForm.get('title')?.touched" class="text-error">
            L'intitulé est requis
          </div>
        </div>

        <div class="form-row" style="display:flex; gap:20px; margin-bottom:20px;">
          <div class="form-group" style="flex:1;">
            <label class="form-label">Entreprise</label>
            <input type="text" formControlName="company" placeholder="Ex: AfriConnect" class="form-control">
            <div class="text-muted" style="font-size:0.875rem; margin-top:4px;">Optionnel</div>
          </div>
          <div class="form-group" style="flex:1;">
            <label class="form-label">Contact</label>
            <input type="text" formControlName="contact" placeholder="Email, téléphone ou lien" class="form-control">
            <div class="text-muted" style="font-size:0.875rem; margin-top:4px;">Optionnel</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Description *</label>
          <textarea formControlName="desc" placeholder="Décrivez le poste, les missions, le profil recherché..." rows="5" class="form-control"></textarea>
          <div *ngIf="itemForm.get('desc')?.invalid && itemForm.get('desc')?.touched" class="text-error">
            La description est requise
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Image (optionnelle)</label>
          <div class="file-upload">
            <input #imgInput type="file" accept="image/*" (change)="addFile($event)" style="display:none;">
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
              <button type="button" class="btn btn-secondary" (click)="imgInput.click()" [disabled]="selectedFiles.length >= 3">
                + Ajouter une photo
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
            Annuler
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="itemForm.invalid || isSubmitting">
            <span *ngIf="!isSubmitting">Publier l'offre</span>
            <span *ngIf="isSubmitting">Publication en cours...</span>
          </button>
        </div>
      </form>
    </app-modal>

    <app-modal [(visible)]="previewVisible" title="Aperçu">
      <img *ngIf="previewUrl" [src]="previewUrl" alt="Aperçu" style="width:100%; max-height: 70vh; object-fit: contain; border-radius: 12px;">
    </app-modal>
  `
})
export class EmploiComponent implements OnInit {
  items: any[] = [];
  searchQuery = '';
  modalVisible = false;
  itemForm = this.fb.group({
    title: ['', Validators.required],
      company: ['', null],
      desc: ['', Validators.required],
      contact: ['', null],
      image: ['', null],
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
  editingItem: any = null;

  get fileDescription(): string {
    return 'PNG, JPG, GIF jusqu\'à 5MB';
  }

  constructor(private api: ApiService, private fb: FormBuilder, private searchService: SearchService, private auth: AuthService) {}

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
  loadItems() { this.api.get('jobs').subscribe((data: any) => { this.items = data; this.updateFilter(); }); }
  openModal() {
    this.editingItem = null;
    this.itemForm.reset({ title: '', company: '', desc: '', contact: '', image: '' });
    this.clearFiles();
    this.modalVisible = true;
  }

  editItem(item: any) {
    this.editingItem = item;
    this.itemForm.patchValue({
      title: item?.title || '',
      company: item?.company || '',
      contact: item?.contact || '',
      desc: item?.desc || item?.content || ''
    });
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
      // keep existing images unless user selects new ones
      if (this.editingItem?.imageUrls && !formValue.imageUrls) formValue.imageUrls = this.editingItem.imageUrls;
      if (this.selectedFiles.length > 0) {
        const fd = new FormData();
        this.selectedFiles.forEach(f => fd.append('images', f));
        const upload: any = await this.api.post('upload', fd).toPromise();
        formValue.imageUrls = Array.isArray(upload?.urls) ? upload.urls : (upload?.url ? [upload.url] : []);
      }

      if (this.editingItem?._id) {
        await this.api.put(`user/posts/${this.editingItem._id}`, formValue).toPromise();
      } else {
        await this.api.post('jobs', formValue).toPromise();
      }
      this.modalVisible = false;
      this.loadItems();
      this.itemForm.reset();
      this.selectedFiles = [];
    } catch (error) {
      console.error('Error submitting job:', error);
      alert('Une erreur est survenue lors de la publication. Veuillez réessayer.');
    } finally {
      this.isSubmitting = false;
    }
  }
  deleteItem(id: string) { if (confirm('Supprimer ?')) this.api.delete('jobs/' + id).subscribe(() => this.loadItems()); }
  canDelete(item: any) {
    if (!this.isLoggedIn) return false;
    if (this.currentUserRole === 'admin' || this.currentUserRole === 'moderator') return true;
    return !!item?.userId && String(item.userId) === String(this.currentUserId);
  }

  toggleLike(item: any) {
    if (!this.isLoggedIn) {
      alert('Connectez-vous pour liker.');
      return;
    }
    this.api.post('jobs/' + item._id + '/like', {}).subscribe({
      next: (updated: any) => item.likes = updated?.likes || item.likes,
      error: (err) => {
        console.error('Error liking job:', err);
        alert('Impossible de liker pour le moment.');
      }
    });
  }
  updateFilter() { this.filteredItems = this.items.filter(i => JSON.stringify(i).toLowerCase().includes(this.searchQuery.toLowerCase())); }
}