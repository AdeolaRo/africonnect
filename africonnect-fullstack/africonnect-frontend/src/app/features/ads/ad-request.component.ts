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

        <div class="form-group" style="margin-top: 10px;">
          <label class="form-label">Détails / message *</label>
          <textarea class="form-control" [(ngModel)]="message" rows="5"
                    placeholder="Explique ce que tu veux: objectif, texte à mettre, cible, durée, lien, etc."></textarea>
          <div class="text-muted" style="font-size:0.9rem; margin-top:6px;" *ngIf="option === 'create_and_publish'">
            Pour cette option, l’admin te renverra un lien de paiement après validation.
          </div>
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

        <div class="form-group" *ngIf="option === 'create_and_publish'">
          <label class="form-label">Pièce jointe (optionnel) : exemple image/vidéo</label>
          <div class="file-upload">
            <input type="file" (change)="onAttachmentSelected($event)" accept="image/*,video/*">
            <div *ngIf="!attachmentFile">
              <div style="font-size: 3rem; margin-bottom: 10px;">📎</div>
              <div>Ajouter un exemple (optionnel)</div>
              <div class="text-muted" style="font-size: 0.9rem; margin-top: 8px;">PNG/JPG/GIF/MP4/WebM</div>
            </div>
            <div *ngIf="attachmentFile" class="file-selected">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="font-size:2rem;">✅</div>
                <div>
                  <div>{{ attachmentFile.name }}</div>
                  <div class="text-muted" style="font-size: 0.9rem;">
                    {{ (attachmentFile.size / 1024 / 1024).toFixed(2) }} MB
                  </div>
                </div>
                <button type="button" class="btn btn-secondary" (click)="attachmentFile = null" style="margin-left:auto;">
                  Retirer
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:12px; margin-top: 12px;">
          <button class="btn btn-primary" (click)="submit()" [disabled]="isSubmitting || !message.trim() || (option==='publish_only' && !selectedFile)">
            {{ isSubmitting ? 'Traitement...' : (option === 'publish_only' ? 'Continuer vers paiement' : 'Envoyer la demande') }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class AdRequestComponent {
  option: 'create_and_publish' | 'publish_only' = 'create_and_publish';
  selectedFile: File | null = null;
  attachmentFile: File | null = null;
  message = '';
  isSubmitting = false;

  constructor(private api: ApiService, private router: Router) {}

  goBack() {
    this.router.navigate(['/profile']);
  }

  onFileSelected(event: any) {
    this.selectedFile = event?.target?.files?.[0] || null;
  }

  onAttachmentSelected(event: any) {
    this.attachmentFile = event?.target?.files?.[0] || null;
  }

  async submit() {
    this.isSubmitting = true;
    try {
      let mediaUrl = '';
      if (this.option === 'publish_only' && this.selectedFile) {
        const fd = new FormData();
        fd.append('media', this.selectedFile);
        const upload: any = await this.api.post('upload', fd).toPromise();
        mediaUrl = upload?.url || '';
      }

      const attachments: string[] = [];
      if (this.option === 'create_and_publish' && this.attachmentFile) {
        const fd = new FormData();
        fd.append('media', this.attachmentFile);
        const upload: any = await this.api.post('upload', fd).toPromise();
        if (upload?.url) attachments.push(String(upload.url));
      }

      const created: any = await this.api.post('ad-requests', { option: this.option, mediaUrl, message: this.message, attachments }).toPromise();
      const id = created?._id;
      if (this.option === 'publish_only') {
        this.router.navigate(['/paiement'], { queryParams: { requestId: id } });
      } else {
        alert('Demande envoyée. L’administrateur vous enverra un lien de paiement après validation.');
        this.router.navigate(['/profile']);
      }
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la création de la demande.');
    } finally {
      this.isSubmitting = false;
    }
  }
}

