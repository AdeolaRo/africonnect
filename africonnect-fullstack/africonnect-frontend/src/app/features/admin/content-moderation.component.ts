import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-content-moderation',
  standalone: true,
  imports: [CommonModule, NgClass, TranslateModule],
  template: `
    <div class="admin-container">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom: 12px;">
        <button type="button" class="btn btn-secondary" (click)="goBack()">{{ 'common.back' | translate }}</button>
        <h1 style="margin:0;">{{ 'moderation.title' | translate }}</h1>
      </div>
      
      <div class="tabs" style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid var(--border);">
        <button 
          type="button"
          *ngFor="let tab of tabs" 
          class="tab-btn" 
          [class.active]="activeTab === tab.id"
          (click)="activeTab = tab.id; loadContent()">
          {{ tab.label }} ({{ getCount(tab.id) }})
        </button>
      </div>
      
      <div *ngIf="isLoading" class="loading">
        {{ 'moderation.loading' | translate }}
      </div>
      
      <div *ngIf="!isLoading && contents.length === 0" class="empty-state">
        <div style="font-size: 3rem; margin-bottom: 16px;">📝</div>
        <h3>{{ 'moderation.emptyTitle' | translate }}</h3>
        <p>{{ 'moderation.emptySubtitle' | translate }}</p>
      </div>
      
      <div *ngIf="!isLoading && contents.length > 0" class="content-list">
        <div *ngFor="let item of contents" class="moderation-item">
          <div class="item-header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="item-type" [ngClass]="'type-' + activeTab">
                {{ getTypeLabel(activeTab) }}
              </div>
              <div>
                <h4 style="margin: 0;">{{ item.title || item.subject || ('moderation.untitled' | translate) }}</h4>
                <div style="font-size: 0.875rem; color: var(--text-muted);">
                  {{ 'moderation.by' | translate }}:
                  {{ item.authorName || item.createdByName || item.author?.pseudo || item.createdBy?.pseudo || ('moderation.anonymous' | translate) }} •
                  {{ item.createdAt | date:'dd/MM/yyyy HH:mm' }}
                </div>
              </div>
            </div>
            
            <div class="item-actions">
              <button type="button" class="btn btn-secondary btn-sm" (click)="viewDetails(item)">
                👁️ {{ 'moderation.view' | translate }}
              </button>
              <button type="button" class="btn btn-danger btn-sm" (click)="deleteContent(item)">
                🗑️ {{ 'moderation.delete' | translate }}
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
    { id: 'jobs', label: 'Jobs' },
    { id: 'solutions', label: 'Solutions' },
    { id: 'solidarity', label: 'Solidarity' },
    { id: 'events', label: 'Events' },
    { id: 'groups', label: 'Groups' }
  ];
  
  activeTab = 'forum';
  contents: any[] = [];
  isLoading = false;
  counts: any = {};

  constructor(private api: ApiService, private auth: AuthService, private router: Router, private translate: TranslateService) {}

  ngOnInit() {
    this.loadContent();
    this.loadCounts();
  }

  goBack() {
    this.router.navigate(['/profile']);
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
    const title = item.title || item.subject || this.translate.instant('moderation.untitled');
    const author = item.authorName || item.createdByName || item.author?.pseudo || item.createdBy?.pseudo || this.translate.instant('moderation.anonymous');
    const date = new Date(item.createdAt).toLocaleString();
    alert(
      `${this.translate.instant('moderation.detailsTitle')}:\n` +
      `${this.translate.instant('moderation.detailsLabelTitle')}: ${title}\n` +
      `${this.translate.instant('moderation.detailsLabelAuthor')}: ${author}\n` +
      `${this.translate.instant('moderation.detailsLabelDate')}: ${date}`
    );
  }

  deleteContent(item: any) {
    if (confirm(this.translate.instant('moderation.deleteConfirm'))) {
      const endpoint = this.getEndpoint();
      this.api.delete(`${endpoint}/${item._id}`).subscribe({
        next: () => {
          this.contents = this.contents.filter(c => c._id !== item._id);
          this.counts[this.activeTab] = (this.counts[this.activeTab] || 1) - 1;
          alert(this.translate.instant('moderation.deletedOk'));
        },
        error: (err) => {
          console.error('Error deleting content:', err);
          alert(this.translate.instant('moderation.deleteErr'));
        }
      });
    }
  }
}