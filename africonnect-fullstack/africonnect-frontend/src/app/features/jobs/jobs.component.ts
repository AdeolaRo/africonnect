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
    <div *ngFor="let item of filteredItems" class="item-card">
      <h3>{{ item.title || item.name }}</h3>
      <div style="color:var(--muted);">Par {{ item.authorName }} - {{ item.createdAt | date }}</div>
      <div *ngIf="item.imageUrl"><img [src]="item.imageUrl" style="max-width:100%; border-radius:16px; margin:12px 0;"></div>
      <div [innerHTML]="item.content || item.desc"></div>
      <button *ngIf="canDelete(item)" class="btn btn-secondary" (click)="deleteItem(item._id)" style="margin-top:12px;">Supprimer</button>
      <button (click)="toggleLike(item)" class="btn">❤️ {{ item.likes?.length || 0 }}</button>
    </div>

    <app-modal [(visible)]="modalVisible" title="Nouvelle offre d'emploi">
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
            <input type="file" (change)="onFileSelected($event)" accept="image/*">
            <div *ngIf="!selectedFile">
              <div style="font-size: 3rem; margin-bottom: 10px;">🖼️</div>
              <div>Cliquez pour sélectionner une image</div>
              <div class="text-muted" style="font-size: 0.9rem; margin-top: 8px;">{{ fileDescription }}</div>
            </div>
            <div *ngIf="selectedFile" class="file-selected">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="font-size:2rem;">📷</div>
                <div>
                  <div>{{ selectedFile.name }}</div>
                  <div class="text-muted" style="font-size: 0.9rem;">
                    {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
                  </div>
                </div>
                <button type="button" class="btn btn-secondary" (click)="selectedFile = null" style="margin-left:auto;">
                  Supprimer
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
  selectedFile: File | null = null;
  isLoggedIn = false;
  currentUserId = '';
  currentUserRole = '';
  filteredItems: any[] = [];
  isSubmitting = false;

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

      await this.api.post('jobs', formValue).toPromise();
      this.modalVisible = false;
      this.loadItems();
      this.itemForm.reset();
      this.selectedFile = null;
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