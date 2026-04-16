import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SearchService } from '../../core/services/search.service';
import { AuthService } from '../../core/services/auth.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { QuillModule } from 'ngx-quill';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, QuillModule, FormsModule],
  template: `
    <div style="display:flex; gap:12px; margin-bottom:24px;">
      <input type="text" [(ngModel)]="searchQuery" placeholder="Rechercher..." style="flex:1; padding:12px; border-radius:16px; background:var(--surface-2); border:1px solid var(--border); color:var(--text);">
      <button *ngIf="isLoggedIn" class="btn btn-primary" (click)="openModal()">+ Nouveau</button>
    </div>
    <div *ngIf="items.length === 0" style="text-align:center; padding:48px;">Aucun élément</div>
    <div *ngFor="let item of filteredItems" class="item-card">
      <h3>{{ item.title || item.name }}</h3>
      <div style="color:var(--muted);">Par {{ item.authorName }} - {{ item.createdAt | date }}</div>
      <div *ngIf="item.imageUrl"><img [src]="item.imageUrl" style="max-width:100%; border-radius:16px; margin:12px 0;"></div>
      <div [innerHTML]="item.content || item.desc"></div>
      <button *ngIf="canDelete(item)" class="btn btn-secondary" (click)="deleteItem(item._id)" style="margin-top:12px;">Supprimer</button>
      <button (click)="toggleLike(item)" class="btn">❤️ {{ item.likes?.length || 0 }}</button>
    </div>

    <app-modal [(visible)]="modalVisible" title="Nouveau sujet de forum">
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
            <input type="file" (change)="onFileSelected($event)" accept="image/*">
            <div *ngIf="!selectedFile">
              <div style="font-size: 3rem; margin-bottom: 10px;">🖼️</div>
              <div>Cliquez pour sélectionner une image</div>
              <div class="text-muted" style="font-size: 0.9rem; margin-top: 8px;">{{ fileDescription }}</div>
            </div>
            <div *ngIf="selectedFile" class="file-selected">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 2rem;">🖼️</div>
                <div>
                  <div>{{ selectedFile.name }}</div>
                  <div class="text-muted" style="font-size: 0.9rem;">
                    {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
                  </div>
                </div>
                <button type="button" class="btn btn-secondary" (click)="selectedFile = null" style="margin-left: auto;">
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
  selectedFile: File | null = null;
  isLoggedIn = false;
  filteredItems: any[] = [];
  isSubmitting = false;

  get fileDescription(): string {
    return 'PNG, JPG, GIF jusqu\'à 5MB';
  }

  constructor(private api: ApiService, private fb: FormBuilder, private searchService: SearchService, private auth: AuthService) {}

  ngOnInit() {
    this.auth.currentUser.subscribe(u => this.isLoggedIn = !!u);
    this.loadItems();
    this.searchService.query$.subscribe(q => {
      this.searchQuery = q;
      this.updateFilter();
    });
  }
  loadItems() { this.api.get('forum').subscribe((data: any) => { this.items = data; this.updateFilter(); }); }
  openModal() { this.modalVisible = true; }
  onFileSelected(event: any) { this.selectedFile = event.target.files[0]; }
  async submit() {
    if (this.itemForm.invalid) return;
    
    this.isSubmitting = true;
    try {
      const formValue: any = this.itemForm.value;
      if (this.selectedFile) {
        const fd = new FormData();
        fd.append('image', this.selectedFile);
        const upload: any = await this.api.post('upload', fd).toPromise();
        formValue.imageUrl = upload.url;
      }
      
      await this.api.post('forum', formValue).toPromise();
      this.modalVisible = false;
      this.loadItems();
      this.itemForm.reset();
      this.selectedFile = null;
    } catch (error) {
      console.error('Error submitting forum post:', error);
      alert('Une erreur est survenue lors de la publication. Veuillez réessayer.');
    } finally {
      this.isSubmitting = false;
    }
  }
  deleteItem(id: string) { if (confirm('Supprimer ?')) this.api.delete('forum/' + id).subscribe(() => this.loadItems()); }
  canDelete(item: any) { return true; }
  toggleLike(item: any) { this.api.post('forum/' + item._id + '/like', {}).subscribe(() => this.loadItems()); }
  updateFilter() { this.filteredItems = this.items.filter(i => JSON.stringify(i).toLowerCase().includes(this.searchQuery.toLowerCase())); }
}