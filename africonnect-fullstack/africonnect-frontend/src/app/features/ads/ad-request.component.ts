import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-ad-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom: 16px;">
        <button class="btn btn-secondary" (click)="goBack()">← Retour</button>
        <h1 style="margin:0;">Demande de publicité</h1>
      </div>

      <div class="card" style="padding:16px; border:1px solid var(--border); border-radius:16px; background: var(--surface);">
        <div class="form-group">
          <label class="form-label">Option *</label>
          <select class="form-control" [(ngModel)]="option">
            <option value="create_and_publish">Création + publication (admin)</option>
            <option value="publish_only">Publication seulement (j’ai déjà ma pub)</option>
          </select>
        </div>

        <div class="form-group" *ngIf="option === 'publish_only'">
          <label class="form-label">Votre média (image ou vidéo) *</label>
          <div class="file-upload">
            <input type="file" (change)="onFileSelected($event)" accept="image/*,video/*">
            <div *ngIf="!selectedFile">
              <div style="font-size: 3rem; margin-bottom: 10px;">📺</div>
              <div>Cliquez pour sélectionner votre pub</div>
              <div class="text-muted" style="font-size: 0.9rem; margin-top: 8px;">PNG/JPG/GIF/MP4/WebM jusqu’à ~50MB</div>
            </div>
            <div *ngIf="selectedFile" class="file-selected">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="font-size:2rem;">✅</div>
                <div>
                  <div>{{ selectedFile.name }}</div>
                  <div class="text-muted" style="font-size: 0.9rem;">
                    {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
                  </div>
                </div>
                <button type="button" class="btn btn-secondary" (click)="selectedFile = null" style="margin-left:auto;">
                  Retirer
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:12px; margin-top: 12px;">
          <button class="btn btn-primary" (click)="continue()" [disabled]="isSubmitting || (option==='publish_only' && !selectedFile)">
            {{ isSubmitting ? 'Traitement...' : 'Continuer vers paiement' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class AdRequestComponent {
  option: 'create_and_publish' | 'publish_only' = 'create_and_publish';
  selectedFile: File | null = null;
  isSubmitting = false;

  constructor(private api: ApiService, private router: Router) {}

  goBack() {
    this.router.navigate(['/profile']);
  }

  onFileSelected(event: any) {
    this.selectedFile = event?.target?.files?.[0] || null;
  }

  async continue() {
    this.isSubmitting = true;
    try {
      let mediaUrl = '';
      if (this.option === 'publish_only' && this.selectedFile) {
        const fd = new FormData();
        fd.append('media', this.selectedFile);
        const upload: any = await this.api.post('upload', fd).toPromise();
        mediaUrl = upload?.url || '';
      }

      const created: any = await this.api.post('ad-requests', { option: this.option, mediaUrl }).toPromise();
      const id = created?._id;
      this.router.navigate(['/paiement'], { queryParams: { requestId: id } });
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la création de la demande.');
    } finally {
      this.isSubmitting = false;
    }
  }
}

