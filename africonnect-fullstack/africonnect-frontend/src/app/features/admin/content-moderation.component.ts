import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-content-moderation',
  standalone: true,
  imports: [CommonModule, NgClass],
  template: `
    <div class="admin-container">
      <h1>Modération des contenus</h1>
      
      <div class="tabs" style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid var(--border);">
        <button 
          *ngFor="let tab of tabs" 
          class="tab-btn" 
          [class.active]="activeTab === tab.id"
          (click)="activeTab = tab.id; loadContent()">
          {{ tab.label }} ({{ getCount(tab.id) }})
        </button>
      </div>
      
      <div *ngIf="isLoading" class="loading">
        Chargement des contenus...
      </div>
      
      <div *ngIf="!isLoading && contents.length === 0" class="empty-state">
        <div style="font-size: 3rem; margin-bottom: 16px;">📝</div>
        <h3>Aucun contenu à modérer</h3>
        <p>Tout est propre !</p>
      </div>
      
      <div *ngIf="!isLoading && contents.length > 0" class="content-list">
        <div *ngFor="let item of contents" class="moderation-item">
          <div class="item-header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="item-type" [ngClass]="'type-' + activeTab">
                {{ getTypeLabel(activeTab) }}
              </div>
              <div>
                <h4 style="margin: 0;">{{ item.title || item.subject || 'Sans titre' }}</h4>
                <div style="font-size: 0.875rem; color: var(--text-muted);">
                  Par: {{ item.author?.email || item.createdBy?.email || 'Anonyme' }} • 
                  {{ item.createdAt | date:'dd/MM/yyyy HH:mm' }}
                </div>
              </div>
            </div>
            
            <div class="item-actions">
              <button class="btn btn-secondary btn-sm" (click)="viewDetails(item)">
                👁️ Voir
              </button>
              <button class="btn btn-danger btn-sm" (click)="deleteContent(item)">
                🗑️ Supprimer
              </button>
            </div>
          </div>
          
          <div class="item-content" *ngIf="item.content || item.desc">
            <div [innerHTML]="item.content" *ngIf="item.content"></div>
            <div *ngIf="item.desc">{{ item.desc | slice:0:200 }}{{ item.desc?.length > 200 ? '...' : '' }}</div>
          </div>
          
          <div class="item-meta" *ngIf="item.price || item.location">
            <span *ngIf="item.price">💰 {{ item.price }} €</span>
            <span *ngIf="item.location">📍 {{ item.location }}</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ContentModerationComponent implements OnInit {
  tabs = [
    { id: 'forum', label: 'Forum' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'jobs', label: 'Emplois' },
    { id: 'solutions', label: 'Solutions' },
    { id: 'solidarity', label: 'Solidarité' },
    { id: 'events', label: 'Événements' },
    { id: 'groups', label: 'Groupes' }
  ];
  
  activeTab = 'forum';
  contents: any[] = [];
  isLoading = false;
  counts: any = {};

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.loadContent();
    this.loadCounts();
  }

  loadContent() {
    this.isLoading = true;
    this.contents = [];
    
    const endpoint = this.getEndpoint();
    this.api.get(endpoint).subscribe({
      next: (data: any) => {
        this.contents = Array.isArray(data) ? data : [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading content:', err);
        this.isLoading = false;
      }
    });
  }

  loadCounts() {
    this.tabs.forEach(tab => {
      const endpoint = this.getEndpoint(tab.id);
      this.api.get(endpoint).subscribe({
        next: (data: any) => {
          this.counts[tab.id] = Array.isArray(data) ? data.length : 0;
        },
        error: (err) => {
          console.error(`Error loading count for ${tab.id}:`, err);
          this.counts[tab.id] = 0;
        }
      });
    });
  }

  getEndpoint(tab?: string) {
    const currentTab = tab || this.activeTab;
    switch(currentTab) {
      case 'forum': return 'forum';
      case 'marketplace': return 'marketplace';
      case 'jobs': return 'jobs';
      case 'solutions': return 'solutions';
      case 'solidarity': return 'solidarity';
      case 'events': return 'events';
      case 'groups': return 'groups';
      default: return 'forum';
    }
  }

  getCount(tabId: string): number {
    return this.counts[tabId] || 0;
  }

  getTypeLabel(tabId: string): string {
    const tab = this.tabs.find(t => t.id === tabId);
    return tab ? tab.label : tabId;
  }

  viewDetails(item: any) {
    // Pour l'instant, affichons simplement une alerte
    alert(`Détails:\nTitre: ${item.title || item.subject}\nAuteur: ${item.author?.email || item.createdBy?.email}\nDate: ${new Date(item.createdAt).toLocaleString()}`);
  }

  deleteContent(item: any) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contenu ? Cette action est irréversible.')) {
      const endpoint = this.getEndpoint();
      this.api.delete(`${endpoint}/${item._id}`).subscribe({
        next: () => {
          this.contents = this.contents.filter(c => c._id !== item._id);
          this.counts[this.activeTab] = (this.counts[this.activeTab] || 1) - 1;
          alert('Contenu supprimé avec succès');
        },
        error: (err) => {
          console.error('Error deleting content:', err);
          alert('Erreur lors de la suppression');
        }
      });
    }
  }
}