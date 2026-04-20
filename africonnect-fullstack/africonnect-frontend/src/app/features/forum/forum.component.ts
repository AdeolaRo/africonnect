import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SearchService } from '../../core/services/search.service';
import { AuthService } from '../../core/services/auth.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { QuillModule } from 'ngx-quill';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, QuillModule, FormsModule],
  template: `
    <div style="display:flex; justify-content:flex-end; margin-bottom:24px;">
      <button *ngIf="isLoggedIn" class="btn btn-primary" (click)="openModal()">+ Nouveau</button>
    </div>
    <div *ngIf="items.length === 0" style="text-align:center; padding:48px;">Aucun élément</div>
    <div *ngFor="let item of filteredItems" class="item-card">
      <h3>{{ item.title || item.name }}</h3>
      <div style="color:var(--muted);">Par {{ item.authorName }} - {{ item.createdAt | date }}</div>
      <div *ngIf="getImages(item).length > 0" class="thumb-grid">
        <img *ngFor="let url of getImages(item)" class="thumb" [src]="url" [alt]="item.title || item.name || 'Image'" (click)="openPreview(url)">
      </div>
      <div [innerHTML]="item.content || item.desc"></div>
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; align-items:center;">
        <button *ngIf="canDelete(item)" class="btn btn-secondary" (click)="editItem(item)">Modifier</button>
        <button *ngIf="canDelete(item)" class="btn btn-secondary" (click)="deleteItem(item._id)">Supprimer</button>
        <button (click)="toggleLike(item)" class="btn">❤️ {{ item.likes?.length || 0 }}</button>
        <button class="btn btn-secondary" (click)="toggleReplies(item)" type="button">
          💬 Réponses ({{ item.comments?.length || 0 }})
        </button>
      </div>

      <div *ngIf="isRepliesOpen(item)" style="margin-top:14px;">
        <div *ngIf="(item.comments?.length || 0) === 0" class="text-muted" style="padding:12px; background:var(--surface-2); border-radius:12px; border:1px solid var(--border);">
          Aucune réponse pour le moment.
        </div>

        <div *ngFor="let c of (item.comments || [])" style="margin-top:10px; padding:12px; background:var(--surface-2); border-radius:12px; border:1px solid var(--border);">
          <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; flex-wrap:wrap;">
            <div style="font-weight:700;">{{ c.authorName || 'Anonyme' }}</div>
            <div class="text-muted" style="font-size:0.85rem;">{{ c.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
          </div>
          <div style="margin-top:6px; white-space:pre-wrap;">{{ c.content }}</div>
        </div>

        <div style="margin-top:12px;" *ngIf="isLoggedIn">
          <label class="form-label">Répondre</label>
          <textarea class="form-control" rows="3" [(ngModel)]="replyDraft[item._id]" placeholder="Écrivez votre réponse..."></textarea>
          <div style="display:flex; justify-content:flex-end; margin-top:10px;">
            <button class="btn btn-primary" type="button" (click)="submitReply(item)" [disabled]="!replyDraft[item._id]?.trim()">
              Envoyer
            </button>
          </div>
        </div>

        <div *ngIf="!isLoggedIn" class="text-muted" style="margin-top:10px;">
          Connectez-vous pour répondre.
        </div>
      </div>
    </div>

    <app-modal [(visible)]="modalVisible" [title]="editingItem ? 'Modifier le sujet' : 'Nouveau sujet de forum'">
      <form [formGroup]="itemForm" (ngSubmit)="submit()" class="form-modal">
        <div class="form-group">
          <label class="form-label">Titre *</label>
          <input type="text" formControlName="title" placeholder="Donnez un titre à votre sujet" class="form-control">
          <div *ngIf="itemForm.get('title')?.invalid && itemForm.get('title')?.touched" class="text-error">
            Le titre est requis
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Contenu *</label>
          <quill-editor formControlName="content" placeholder="Développez votre idée..."></quill-editor>
          <div *ngIf="itemForm.get('content')?.invalid && itemForm.get('content')?.touched" class="text-error">
            Le contenu est requis
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Image (optionnelle)</label>
          <div class="file-upload">
            <input type="file" (change)="onFileSelected($event)" accept="image/*" multiple>
            <div *ngIf="selectedFiles.length === 0">
              <div style="font-size: 3rem; margin-bottom: 10px;">🖼️</div>
              <div>Cliquez pour sélectionner jusqu’à 3 images</div>
              <div class="text-muted" style="font-size: 0.9rem; margin-top: 8px;">{{ fileDescription }}</div>
            </div>
            <div *ngIf="selectedFiles.length > 0" class="file-selected">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 2rem;">🖼️</div>
                <div>
                  <div>{{ selectedFiles.length }} image(s) sélectionnée(s)</div>
                  <div class="text-muted" style="font-size: 0.9rem;">Max 3 images</div>
                </div>
                <button type="button" class="btn btn-secondary" (click)="clearFiles()" style="margin-left: auto;">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;">
          <button type="button" class="btn btn-secondary" (click)="modalVisible = false">
            Annuler
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="itemForm.invalid || isSubmitting">
            <span *ngIf="!isSubmitting">Publier le sujet</span>
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
export class ForumComponent implements OnInit {
  items: any[] = [];
  searchQuery = '';
  modalVisible = false;
  itemForm = this.fb.group({
    title: ['', Validators.required],
      content: ['', Validators.required],
  });
  selectedFiles: File[] = [];
  previewVisible = false;
  previewUrl = '';
  isLoggedIn = false;
  currentUserId = '';
  currentUserRole = '';
  filteredItems: any[] = [];
  isSubmitting = false;
  replyDraft: Record<string, string> = {};
  openReplies: Record<string, boolean> = {};
  private pendingOpenNew = false;
  editingItem: any = null;

  get fileDescription(): string {
    return 'PNG, JPG, GIF jusqu\'à 5MB';
  }

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private searchService: SearchService,
    private auth: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.auth.currentUser.subscribe(u => {
      this.isLoggedIn = !!u;
      this.currentUserId = u?.id || '';
      this.currentUserRole = u?.role || '';

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
    this.searchService.query$.subscribe(q => {
      this.searchQuery = q;
      this.updateFilter();
    });
  }
  loadItems() { this.api.get('forum').subscribe((data: any) => { this.items = data; this.updateFilter(); }); }
  openModal() {
    this.editingItem = null;
    this.itemForm.reset({ title: '', content: '' });
    this.selectedFiles = [];
    this.modalVisible = true;
  }

  editItem(item: any) {
    this.editingItem = item;
    this.itemForm.patchValue({
      title: item?.title || '',
      content: item?.content || item?.desc || ''
    });
    this.selectedFiles = [];
    this.modalVisible = true;
  }
  onFileSelected(event: any) {
    const files = Array.from(event?.target?.files || []) as File[];
    this.selectedFiles = files.slice(0, 3);
  }
  clearFiles() { this.selectedFiles = []; }
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
        await this.api.post('forum', formValue).toPromise();
      }
      this.modalVisible = false;
      this.loadItems();
      this.itemForm.reset();
      this.selectedFiles = [];
    } catch (error) {
      console.error('Error submitting forum post:', error);
      alert('Une erreur est survenue lors de la publication. Veuillez réessayer.');
    } finally {
      this.isSubmitting = false;
    }
  }
  deleteItem(id: string) { if (confirm('Supprimer ?')) this.api.delete('forum/' + id).subscribe(() => this.loadItems()); }
  canDelete(item: any) {
    if (!this.isLoggedIn) return false;
    if (this.currentUserRole === 'admin' || this.currentUserRole === 'moderator') return true;
    return !!item?.userId && String(item.userId) === String(this.currentUserId);
  }

  toggleLike(item: any) {
    if (!this.isLoggedIn) {
      alert('Connectez-vous pour liker une publication.');
      return;
    }
    this.api.post('forum/' + item._id + '/like', {}).subscribe({
      next: (updated: any) => {
        // Mise à jour locale pour retour immédiat
        item.likes = updated?.likes || item.likes;
      },
      error: (err) => {
        console.error('Error liking forum post:', err);
        alert('Impossible de liker pour le moment.');
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
      alert('Impossible d’envoyer la réponse.');
    }
  }
  updateFilter() { this.filteredItems = this.items.filter(i => JSON.stringify(i).toLowerCase().includes(this.searchQuery.toLowerCase())); }
}