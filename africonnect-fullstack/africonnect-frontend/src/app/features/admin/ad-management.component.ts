import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-ad-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <div class="admin-container">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom: 12px;">
        <button class="btn btn-secondary" (click)="goBack()">← Retour</button>
        <h1 style="margin:0;">Gestion des publicités</h1>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <button class="btn btn-primary" (click)="openCreateModal()">
          + Nouvelle publicité
        </button>
        
        <div class="stats" style="display: flex; gap: 20px;">
          <div class="stat-card">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ stats.active }}</div>
            <div class="stat-label">Actives</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ stats.videos }}</div>
            <div class="stat-label">Vidéos</div>
          </div>
        </div>
      </div>
      
      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Type</th>
              <th>Sections</th>
              <th>Statut</th>
              <th>Dates</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ad of advertisements">
              <td>
                <strong>{{ ad.title }}</strong>
                <div class="text-muted" style="font-size: 0.875rem;">{{ ad.description | slice:0:50 }}{{ ad.description?.length > 50 ? '...' : '' }}</div>
              </td>
              <td>
                <span class="badge" [class.badge-image]="ad.mediaType === 'image'" [class.badge-video]="ad.mediaType === 'video'">
                  {{ ad.mediaType === 'image' ? '🖼️ Image' : '🎬 Vidéo' }}
                </span>
              </td>
              <td>
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                  <span *ngFor="let section of ad.displayIn" class="section-tag">
                    {{ section }}
                  </span>
                </div>
              </td>
              <td>
                <span class="status" [class.active]="ad.isActive" [class.inactive]="!ad.isActive">
                  {{ ad.isActive ? '✅ Actif' : '❌ Inactif' }}
                </span>
              </td>
              <td>
                <div style="font-size: 0.875rem;">
                  <div>Créé: {{ ad.createdAt | date:'dd/MM/yyyy' }}</div>
                  <div *ngIf="ad.endDate">Expire: {{ ad.endDate | date:'dd/MM/yyyy' }}</div>
                </div>
              </td>
              <td>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-sm" (click)="editAd(ad)">
                    ✏️
                  </button>
                  <button class="btn btn-secondary btn-sm" (click)="toggleAd(ad)">
                    {{ ad.isActive ? '❌' : '✅' }}
                  </button>
                  <button class="btn btn-danger btn-sm" (click)="deleteAd(ad)">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div *ngIf="advertisements.length === 0" class="empty-state">
          <div style="font-size: 3rem; margin-bottom: 16px;">📺</div>
          <h3>Aucune publicité</h3>
          <p>Commencez par créer votre première publicité</p>
          <button class="btn btn-primary" (click)="openCreateModal()">
            + Créer une publicité
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de création/édition -->
    <app-modal [(visible)]="modalVisible" [title]="editingAd ? 'Modifier la publicité' : 'Nouvelle publicité'">
      <form (ngSubmit)="saveAd()" class="form-modal" *ngIf="form && form.isActive !== undefined">
        <div class="form-row" style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Titre *</label>
            <input type="text" [(ngModel)]="form.title" name="title" class="form-control" required>
          </div>
          
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Type de média</label>
            <select [(ngModel)]="form.mediaType" name="mediaType" class="form-control">
              <option value="image">Image</option>
              <option value="video">Vidéo</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea [(ngModel)]="form.description" name="description" rows="3" class="form-control" placeholder="Description de la publicité..."></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">URL de destination</label>
          <input type="url" [(ngModel)]="form.targetUrl" name="targetUrl" class="form-control" placeholder="https://example.com">
        </div>
        
        <div class="form-group">
          <label class="form-label">Texte du bouton</label>
          <input type="text" [(ngModel)]="form.buttonText" name="buttonText" class="form-control" placeholder="En savoir plus">
        </div>
        
        <div class="form-group">
          <label class="form-label">Média *</label>
          <div *ngIf="!selectedFile && !form.mediaUrl" class="file-upload">
            <input type="file" (change)="onFileSelected($event)" [accept]="form.mediaType === 'video' ? 'video/*' : 'image/*'">
            <div>
              <div style="font-size: 3rem; margin-bottom: 10px;">
                {{ form.mediaType === 'video' ? '🎬' : '🖼️' }}
              </div>
              <div>Cliquez pour sélectionner un fichier</div>
              <div class="text-muted" style="font-size: 0.9rem; margin-top: 8px;">
                {{ form.mediaType === 'video' ? videoFileDescription : imageFileDescription }}
              </div>
            </div>
          </div>
          
          <div *ngIf="selectedFile || form.mediaUrl" class="file-selected">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="font-size: 2rem;">
                {{ form.mediaType === 'video' ? '🎬' : '🖼️' }}
              </div>
              <div>
                <div>{{ selectedFile?.name || form.mediaUrl?.split('/').pop() }}</div>
                <div *ngIf="selectedFile" class="text-muted" style="font-size: 0.9rem;">
                  {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
                </div>
              </div>
              <button type="button" class="btn btn-secondary" (click)="clearFile()" style="margin-left: auto;">
                Supprimer
              </button>
            </div>
          </div>
          
          <div class="text-muted" style="font-size: 0.875rem; margin-top: 8px;">
            Ou entrez une URL directe:
          </div>
          <input type="url" [(ngModel)]="form.mediaUrl" name="mediaUrl" class="form-control" style="margin-top: 8px;" placeholder="https://example.com/media.jpg">
        </div>
        
        <div class="form-group">
          <label class="form-label">Sections d'affichage</label>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
            <label *ngFor="let section of allSections" class="checkbox-label">
              <input type="checkbox" [value]="section" [checked]="form.displayIn.includes(section)" (change)="toggleSection(section, $event)">
              {{ section }}
            </label>
          </div>
        </div>
        
        <div class="form-row" style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Ordre d'affichage</label>
            <input type="number" [(ngModel)]="form.order" name="order" class="form-control" min="0">
          </div>
          
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Date d'expiration (optionnelle)</label>
            <input type="date" [(ngModel)]="form.endDate" name="endDate" class="form-control">
          </div>
        </div>
        
        <div class="form-group">
          <label class="checkbox-label" *ngIf="form">
            <input type="checkbox" [(ngModel)]="form.isActive" name="isActive">
            Publicité active
          </label>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;">
          <button type="button" class="btn btn-secondary" (click)="modalVisible = false">
            Annuler
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="isSubmitting">
            <span *ngIf="!isSubmitting">{{ editingAd ? 'Mettre à jour' : 'Créer' }}</span>
            <span *ngIf="isSubmitting">Enregistrement...</span>
          </button>
        </div>
      </form>
    </app-modal>
  `
})
export class AdManagementComponent implements OnInit {
  advertisements: any[] = [];
  modalVisible = false;
  editingAd: any = null;
  selectedFile: File | null = null;
  isSubmitting = false;
  
  allSections = ['forum', 'marketplace', 'jobs', 'solutions', 'solidarity', 'events', 'groups'];
  
  form = {
    title: '',
    description: '',
    mediaType: 'image',
    mediaUrl: '',
    targetUrl: '',
    buttonText: 'En savoir plus',
    displayIn: [...this.allSections],
    order: 0,
    endDate: '',
    isActive: true
  };
  
  stats = {
    total: 0,
    active: 0,
    videos: 0
  };

  get videoFileDescription(): string {
    return 'MP4, MOV, AVI, WEBM jusqu\'à 50MB';
  }

  get imageFileDescription(): string {
    return 'PNG, JPG, GIF jusqu\'à 50MB';
  }

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.loadAds();
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  loadAds() {
    this.api.get('advertisements/all').subscribe({
      next: (ads: any) => {
        this.advertisements = ads;
        this.updateStats();
      },
      error: (err) => console.error('Error loading ads:', err)
    });
  }

  updateStats() {
    this.stats.total = this.advertisements.length;
    this.stats.active = this.advertisements.filter(ad => ad.isActive).length;
    this.stats.videos = this.advertisements.filter(ad => ad.mediaType === 'video').length;
  }

  openCreateModal() {
    this.editingAd = null;
    this.resetForm();
    this.modalVisible = true;
  }

  editAd(ad: any) {
    this.editingAd = ad;
    this.form = {
      title: ad.title,
      description: ad.description || '',
      mediaType: ad.mediaType,
      mediaUrl: ad.mediaUrl,
      targetUrl: ad.targetUrl || '',
      buttonText: ad.buttonText || 'En savoir plus',
      displayIn: [...ad.displayIn],
      order: ad.order || 0,
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : '',
      isActive: ad.isActive
    };
    this.selectedFile = null;
    this.modalVisible = true;
  }

  resetForm() {
    this.form = {
      title: '',
      description: '',
      mediaType: 'image',
      mediaUrl: '',
      targetUrl: '',
      buttonText: 'En savoir plus',
      displayIn: [...this.allSections],
      order: 0,
      endDate: '',
      isActive: true
    };
    this.selectedFile = null;
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      // Détecter le type de média
      if (this.selectedFile.type.startsWith('video/')) {
        this.form.mediaType = 'video';
      } else if (this.selectedFile.type.startsWith('image/')) {
        this.form.mediaType = 'image';
      }
    }
  }

  clearFile() {
    this.selectedFile = null;
    this.form.mediaUrl = '';
  }

  toggleSection(section: string, event: any) {
    if (event.target.checked) {
      if (!this.form.displayIn.includes(section)) {
        this.form.displayIn.push(section);
      }
    } else {
      this.form.displayIn = this.form.displayIn.filter(s => s !== section);
    }
  }

  async saveAd() {
    if (!this.form.title) {
      alert('Le titre est requis');
      return;
    }

    this.isSubmitting = true;
    
    try {
      const formData = new FormData();
      
      // Ajouter les champs texte
      Object.keys(this.form).forEach(key => {
        if (key === 'displayIn') {
          formData.append(key, this.form.displayIn.join(','));
        } else {
          formData.append(key, (this.form as any)[key]);
        }
      });
      
      // Ajouter le fichier si sélectionné
      if (this.selectedFile) {
        formData.append('media', this.selectedFile);
      }
      
      if (this.editingAd) {
        // Mise à jour
        await this.api.put(`advertisements/${this.editingAd._id}`, formData).toPromise();
      } else {
        // Création
        await this.api.post('advertisements', formData).toPromise();
      }
      
      this.modalVisible = false;
      this.loadAds();
      this.resetForm();
      
    } catch (error) {
      console.error('Error saving ad:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      this.isSubmitting = false;
    }
  }

  toggleAd(ad: any) {
    if (confirm(`Voulez-vous vraiment ${ad.isActive ? 'désactiver' : 'activer'} cette publicité ?`)) {
      this.api.patch(`advertisements/${ad._id}/toggle`, {}).subscribe({
        next: () => {
          ad.isActive = !ad.isActive;
          this.updateStats();
        },
        error: (err) => console.error('Error toggling ad:', err)
      });
    }
  }

  deleteAd(ad: any) {
    if (confirm('Voulez-vous vraiment supprimer cette publicité ? Cette action est irréversible.')) {
      this.api.delete(`advertisements/${ad._id}`).subscribe({
        next: () => {
          this.advertisements = this.advertisements.filter(a => a._id !== ad._id);
          this.updateStats();
        },
        error: (err) => console.error('Error deleting ad:', err)
      });
    }
  }
}