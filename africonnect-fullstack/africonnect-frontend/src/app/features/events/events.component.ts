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
  selector: 'app-evenements',
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
      <button *ngIf="canDelete(item)" class="btn btn-secondary" (click)="deleteItem(item.id)" style="margin-top:12px;">Supprimer</button>
      <button (click)="toggleLike(item)" class="btn">❤️ {{ item.likes?.length || 0 }}</button>
    </div>

    <app-modal [(visible)]="modalVisible" title="Nouveau evenements">
      <form [formGroup]="itemForm" (ngSubmit)="submit()">
        <input type="text" formControlName="title" placeholder="Titre">
              <textarea formControlName="desc" placeholder="Description" rows="3"></textarea>
              <input type="datetime-local" formControlName="eventDate" placeholder="Date">
              <input type="text" formControlName="location" placeholder="Lieu">
        <button type="submit" class="btn btn-primary" style="margin-top:16px;" [disabled]="itemForm.invalid">Publier</button>
      </form>
    </app-modal>
  `
})
export class EvenementsComponent implements OnInit {
  items: any[] = [];
  searchQuery = '';
  modalVisible = false;
  itemForm = this.fb.group({
    title: ['', Validators.required],
      desc: ['', Validators.required],
      eventDate: ['', null],
      location: ['', null],
  });
  selectedFile: File | null = null;
  isLoggedIn = false;
  filteredItems: any[] = [];

  constructor(private api: ApiService, private fb: FormBuilder, private searchService: SearchService, private auth: AuthService) {}

  ngOnInit() {
    this.auth.currentUser.subscribe(u => this.isLoggedIn = !!u);
    this.loadItems();
    this.searchService.query$.subscribe(q => {
      this.searchQuery = q;
      this.updateFilter();
    });
  }
  loadItems() { this.api.get('events').subscribe((data: any) => { this.items = data; this.updateFilter(); }); }
  openModal() { this.modalVisible = true; }
  onFileSelected(event: any) { this.selectedFile = event.target.files[0]; }
  async submit() {
    const formValue: any = this.itemForm.value;
    if (this.selectedFile) {
      const fd = new FormData();
      fd.append('image', this.selectedFile);
      const upload: any = await this.api.post('upload', fd).toPromise();
      formValue.imageUrl = upload.url;
    }
    this.api.post('events', formValue).subscribe(() => {
      this.modalVisible = false;
      this.loadItems();
      this.itemForm.reset();
      this.selectedFile = null;
    });
  }
  deleteItem(id: string) { if (confirm('Supprimer ?')) this.api.delete('events/' + id).subscribe(() => this.loadItems()); }
  canDelete(item: any) { return true; }
  toggleLike(item: any) { this.api.post('events/' + item.id + '/like', {}).subscribe(() => this.loadItems()); }
  updateFilter() { this.filteredItems = this.items.filter(i => JSON.stringify(i).toLowerCase().includes(this.searchQuery.toLowerCase())); }
}