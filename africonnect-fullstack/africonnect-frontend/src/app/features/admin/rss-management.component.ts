import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-rss-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom: 16px;">
        <button class="btn btn-secondary" (click)="goBack()">← Retour</button>
        <h2 style="margin:0;">Gestion RSS</h2>
      </div>

      <div class="card" style="margin-bottom: 16px;">
        <h3 style="margin-top:0;">➕ Ajouter une source</h3>
        <div class="form-row" style="display:flex; gap:12px; flex-wrap:wrap;">
          <input class="form-control" [(ngModel)]="form.label" placeholder="Nom (ex: RFI Afrique)" style="flex:1; min-width:220px;">
          <input class="form-control" [(ngModel)]="form.rssUrl" placeholder="URL RSS (ex: https://.../rss)" style="flex:2; min-width:260px;">
          <button class="btn btn-primary" (click)="addFeed()" [disabled]="!canAdd()">Ajouter</button>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-top:0;">📋 Sources configurées</h3>
        <div *ngIf="feeds.length === 0" class="empty-state">
          Aucune source RSS configurée.
        </div>

        <div *ngFor="let feed of feeds" class="row" style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border);">
          <div style="min-width:0;">
            <div style="font-weight:700;">{{ feed.label }}</div>
            <div class="text-muted" style="font-size:0.9rem; word-break:break-all;">{{ feed.rssUrl }}</div>
          </div>
          <button class="btn btn-danger btn-sm" (click)="removeFeed(feed)">Supprimer</button>
        </div>
      </div>
    </div>
  `
})
export class RssManagementComponent implements OnInit {
  feeds: any[] = [];
  form = { label: '', rssUrl: '' };

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.loadFeeds();
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  loadFeeds() {
    this.api.get('rss/feeds', false).subscribe({
      next: (data: any) => this.feeds = Array.isArray(data) ? data : [],
      error: (err) => console.error('Error loading rss feeds:', err)
    });
  }

  canAdd(): boolean {
    return !!this.form.label.trim() && !!this.form.rssUrl.trim();
  }

  addFeed() {
    if (!this.canAdd()) return;
    this.api.post('rss/feeds', { label: this.form.label.trim(), rssUrl: this.form.rssUrl.trim() }).subscribe({
      next: (created: any) => {
        this.feeds.unshift(created);
        this.form = { label: '', rssUrl: '' };
      },
      error: (err) => {
        console.error('Error adding rss feed:', err);
        alert('Erreur lors de l’ajout du feed');
      }
    });
  }

  removeFeed(feed: any) {
    if (!confirm('Supprimer cette source RSS ?')) return;
    this.api.delete(`rss/feeds/${feed._id}`).subscribe({
      next: () => {
        this.feeds = this.feeds.filter(f => f._id !== feed._id);
      },
      error: (err) => {
        console.error('Error removing rss feed:', err);
        alert('Erreur lors de la suppression');
      }
    });
  }
}

