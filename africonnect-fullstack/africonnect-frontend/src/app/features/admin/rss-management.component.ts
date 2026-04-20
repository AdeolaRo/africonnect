import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-rss-management',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="admin-container">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom: 16px;">
        <button class="btn btn-secondary" (click)="goBack()">{{ 'admin.rssPage.back' | translate }}</button>
        <h2 style="margin:0;">{{ 'admin.rssPage.title' | translate }}</h2>
      </div>

      <div class="card" style="margin-bottom: 16px;">
        <h3 style="margin-top:0;">{{ 'admin.rssPage.addSourceTitle' | translate }}</h3>
        <div class="form-row" style="display:flex; gap:12px; flex-wrap:wrap;">
          <input class="form-control" [(ngModel)]="form.label" [placeholder]="'admin.rssPage.labelNamePlaceholder' | translate" style="flex:1; min-width:220px;">
          <input class="form-control" [(ngModel)]="form.rssUrl" [placeholder]="'admin.rssPage.urlPlaceholder' | translate" style="flex:2; min-width:260px;">
          <button class="btn btn-primary" (click)="addFeed()" [disabled]="!canAdd()">{{ 'admin.rssPage.add' | translate }}</button>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-top:0;">{{ 'admin.rssPage.sourcesTitle' | translate }}</h3>
        <div *ngIf="feeds.length === 0" class="empty-state">
          {{ 'admin.rssPage.empty' | translate }}
        </div>

        <div *ngFor="let feed of feeds" class="row" style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border); flex-wrap:wrap;">
          <div style="min-width:0;">
            <div style="font-weight:700;">{{ feed.label }}</div>
            <div class="text-muted" style="font-size:0.9rem; word-break:break-all;">{{ feed.rssUrl }}</div>
          </div>
          <button class="btn btn-danger btn-sm" (click)="removeFeed(feed)">{{ 'common.delete' | translate }}</button>
        </div>
      </div>
    </div>
  `
})
export class RssManagementComponent implements OnInit {
  feeds: any[] = [];
  form = { label: '', rssUrl: '' };

  constructor(
    private api: ApiService,
    private router: Router,
    private translate: TranslateService
  ) {}

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
        alert(this.translate.instant('admin.rssPage.addError'));
      }
    });
  }

  removeFeed(feed: any) {
    if (!confirm(this.translate.instant('admin.rssPage.confirmDelete'))) return;
    this.api.delete(`rss/feeds/${feed._id}`).subscribe({
      next: () => {
        this.feeds = this.feeds.filter(f => f._id !== feed._id);
      },
      error: (err) => {
        console.error('Error removing rss feed:', err);
        alert(this.translate.instant('admin.rssPage.deleteError'));
      }
    });
  }
}
