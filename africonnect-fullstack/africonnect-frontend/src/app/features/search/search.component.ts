import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { SearchService } from '../../core/services/search.service';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="item-card">
      <h2 style="margin-bottom:6px;">{{ 'searchPage.title' | translate }}</h2>
      <div class="text-muted" *ngIf="query">{{ 'searchPage.forQuery' | translate }} <strong>{{ query }}</strong></div>
      <div class="text-muted" *ngIf="!query">{{ 'searchPage.hintKeyword' | translate }}</div>
    </div>

    <div *ngIf="query && !isLoading && totalResults === 0" class="empty-state">
      {{ 'searchPage.noResults' | translate }}
    </div>

    <div *ngIf="isLoading" class="loading">{{ 'searchPage.loading' | translate }}</div>

    <div *ngIf="query && !isLoading">
      <div class="item-card" *ngFor="let section of sections">
        <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:center;">
          <h3 style="margin:0;">{{ section.labelKey | translate }}</h3>
          <a [routerLink]="section.route" class="btn btn-secondary btn-sm">{{ 'searchPage.open' | translate }}</a>
        </div>

        <div *ngIf="section.results.length === 0" class="text-muted" style="margin-top:10px;">
          {{ 'searchPage.noResultsInSection' | translate }}
        </div>

        <div *ngFor="let r of section.results" style="margin-top:12px; padding:12px; background:var(--surface-2); border:1px solid var(--border); border-radius:14px;">
          <div style="font-weight:800;">{{ r.title }}</div>
          <div class="text-muted" style="font-size:0.9rem; margin-top:4px;">{{ r.meta }}</div>
          <div style="margin-top:6px;">{{ r.snippet }}</div>
        </div>
      </div>
    </div>
  `
})
export class SearchComponent implements OnInit, OnDestroy {
  query = '';
  isLoading = false;
  totalResults = 0;
  private sub?: Subscription;

  sections: Array<{
    key: string;
    labelKey: string;
    route: string;
    results: Array<{ title: string; meta: string; snippet: string }>;
  }> = [
    { key: 'forum', labelKey: 'nav.forum', route: '/forum', results: [] },
    { key: 'marketplace', labelKey: 'nav.marketplace', route: '/marketplace', results: [] },
    { key: 'jobs', labelKey: 'nav.jobs', route: '/emploi', results: [] },
    { key: 'solutions', labelKey: 'nav.solutions', route: '/solutions', results: [] },
    { key: 'solidarity', labelKey: 'nav.solidarity', route: '/solidarite', results: [] },
    { key: 'events', labelKey: 'nav.events', route: '/evenements', results: [] },
    { key: 'groups', labelKey: 'nav.groups', route: '/groupes', results: [] },
  ];

  constructor(
    private api: ApiService,
    private search: SearchService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.sub = this.search.query$.subscribe(q => {
      this.query = (q || '').trim();
      if (!this.query) {
        this.sections.forEach(s => (s.results = []));
        this.totalResults = 0;
        return;
      }
      this.runSearch();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private byLine(author?: string): string {
    if (!author) return '';
    return this.translate.instant('searchPage.by', { author });
  }

  private runSearch() {
    this.isLoading = true;
    const q = this.query.toLowerCase();
    const untitled = this.translate.instant('searchPage.untitled');

    forkJoin({
      forum: this.api.get('forum', false).pipe(catchError(() => of([]))),
      marketplace: this.api.get('marketplace', false).pipe(catchError(() => of([]))),
      jobs: this.api.get('jobs', false).pipe(catchError(() => of([]))),
      solutions: this.api.get('solutions', false).pipe(catchError(() => of([]))),
      solidarity: this.api.get('solidarity', false).pipe(catchError(() => of([]))),
      events: this.api.get('events', false).pipe(catchError(() => of([]))),
      groups: this.api.get('groups', false).pipe(catchError(() => of([]))),
    }).subscribe({
      next: (data: any) => {
        const mapped: any = {
          forum: (data.forum || []).map((x: any) => ({
            title: x.title || untitled,
            meta: this.byLine(x.authorName),
            snippet: (x.content || '').replace(/<[^>]+>/g, '').slice(0, 180)
          })),
          marketplace: (data.marketplace || []).map((x: any) => ({
            title: x.title || untitled,
            meta: this.byLine(x.authorName),
            snippet: (x.desc || '').slice(0, 180)
          })),
          jobs: (data.jobs || []).map((x: any) => ({
            title: x.title || untitled,
            meta: this.byLine(x.authorName),
            snippet: (x.desc || '').slice(0, 180)
          })),
          solutions: (data.solutions || []).map((x: any) => ({
            title: x.title || untitled,
            meta: this.byLine(x.authorName),
            snippet: (x.desc || '').slice(0, 180)
          })),
          solidarity: (data.solidarity || []).map((x: any) => ({
            title: x.title || untitled,
            meta: this.byLine(x.authorName),
            snippet: (x.desc || '').slice(0, 180)
          })),
          events: (data.events || []).map((x: any) => ({
            title: x.title || untitled,
            meta: this.byLine(x.authorName),
            snippet: (x.desc || '').slice(0, 180)
          })),
          groups: (data.groups || []).map((x: any) => ({
            title: x.name || x.title || untitled,
            meta: this.byLine(x.authorName),
            snippet: (x.description || x.desc || '').slice(0, 180)
          })),
        };

        this.totalResults = 0;
        this.sections.forEach(s => {
          const all = mapped[s.key] || [];
          const filtered = all.filter((r: any) => JSON.stringify(r).toLowerCase().includes(q));
          s.results = filtered.slice(0, 5);
          this.totalResults += s.results.length;
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
