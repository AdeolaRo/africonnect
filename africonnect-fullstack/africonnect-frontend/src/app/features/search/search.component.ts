import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { SearchService } from '../../core/services/search.service';
import { LocationPreferenceService } from '../../core/services/location-preference.service';
import { applyListSearchFilters } from '../../core/utils/location-list.util';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="item-card">
      <h2 style="margin-bottom:6px;">{{ 'searchPage.title' | translate }}</h2>
      <div class="text-muted" *ngIf="hasRefinedSearch">{{ 'searchPage.forQuery' | translate }} <strong>{{ displayQueryOrFilters }}</strong></div>
      <div class="text-muted" *ngIf="!hasRefinedSearch">{{ 'searchPage.hintKeyword' | translate }}</div>
    </div>

    <div *ngIf="hasRefinedSearch && !isLoading && totalResults === 0" class="empty-state">
      {{ 'searchPage.noResults' | translate }}
    </div>

    <div *ngIf="isLoading" class="loading">{{ 'searchPage.loading' | translate }}</div>

    <div *ngIf="hasRefinedSearch && !isLoading">
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
    { key: 'groups', labelKey: 'nav.groups', route: '/groupes', results: [] }
  ];

  get hasRefinedSearch(): boolean {
    return !!(this.query || this.svcSnapshot.filterContinent || this.svcSnapshot.filterCity);
  }

  get displayQueryOrFilters(): string {
    const q = (this.query || '').trim();
    const bits: string[] = [];
    if (q) bits.push(`« ${q} »`);
    if (this.svcSnapshot.filterContinent) {
      const lab = this.translate.instant('location.continent.' + this.svcSnapshot.filterContinent);
      bits.push(lab);
    }
    if (this.svcSnapshot.filterCity) bits.push(this.svcSnapshot.filterCity);
    return bits.join(' — ') || '…';
  }

  get svcSnapshot() {
    return this.search.snapshot;
  }

  constructor(
    private api: ApiService,
    private search: SearchService,
    private locPref: LocationPreferenceService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.sub = this.search.state$.subscribe((st) => {
      this.query = (st.query || '').trim();
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

  private locLine(x: any): string {
    const city = String(x?.city || x?.location || '').trim();
    const c = String(x?.continent || '').trim();
    if (!city && !c) return '';
    if (city && c) {
      return ` · ${city} / ${this.translate.instant('location.continent.' + c)}`;
    }
    if (city) return ` · ${city}`;
    return ` · ${this.translate.instant('location.continent.' + c)}`;
  }

  private runSearch() {
    this.isLoading = true;
    const st = this.search.snapshot;
    const userLoc = this.locPref.get();
    const untitled = this.translate.instant('searchPage.untitled');

    forkJoin({
      forum: this.api.get('forum', false).pipe(catchError(() => of([]))),
      marketplace: this.api.get('marketplace', false).pipe(catchError(() => of([]))),
      jobs: this.api.get('jobs', false).pipe(catchError(() => of([]))),
      solutions: this.api.get('solutions', false).pipe(catchError(() => of([]))),
      solidarity: this.api.get('solidarity', false).pipe(catchError(() => of([]))),
      events: this.api.get('events', false).pipe(catchError(() => of([]))),
      groups: this.api.get('groups', false).pipe(catchError(() => of([])))
    }).subscribe({
      next: (data: any) => {
        if (!st.query?.trim() && !st.filterContinent && !st.filterCity) {
          this.sections.forEach((s) => (s.results = []));
          this.totalResults = 0;
          this.isLoading = false;
          return;
        }

        const stFull = { ...st, query: st.query || '' };
        const sortLoc = st.preferLocal ? userLoc : { continent: '', city: '' };
        const fForum = applyListSearchFilters(
          (Array.isArray(data.forum) ? data.forum : []) as object[],
          stFull,
          sortLoc
        ).slice(0, 5);
        const fMp = applyListSearchFilters(
          (Array.isArray(data.marketplace) ? data.marketplace : []) as object[],
          stFull,
          sortLoc
        ).slice(0, 5);
        const fJobs = applyListSearchFilters(
          (Array.isArray(data.jobs) ? data.jobs : []) as object[],
          stFull,
          sortLoc
        ).slice(0, 5);
        const fSol = applyListSearchFilters(
          (Array.isArray(data.solutions) ? data.solutions : []) as object[],
          stFull,
          sortLoc
        ).slice(0, 5);
        const fSoli = applyListSearchFilters(
          (Array.isArray(data.solidarity) ? data.solidarity : []) as object[],
          stFull,
          sortLoc
        ).slice(0, 5);
        const fEv = applyListSearchFilters(
          (Array.isArray(data.events) ? data.events : []) as object[],
          stFull,
          sortLoc
        ).slice(0, 5);
        const fGr = applyListSearchFilters(
          (Array.isArray(data.groups) ? data.groups : []) as object[],
          stFull,
          sortLoc
        ).slice(0, 5);

        const mapped: any = {
          forum: fForum.map((x: any) => ({
            title: x.title || untitled,
            meta: this.byLine(x.authorName) + this.locLine(x),
            snippet: (x.content || '').replace(/<[^>]+>/g, '').slice(0, 180)
          })),
          marketplace: fMp.map((x: any) => ({
            title: x.title || untitled,
            meta: this.byLine(x.authorName) + this.locLine(x),
            snippet: (x.desc || '').slice(0, 180)
          })),
          jobs: fJobs.map((x: any) => ({
            title: x.title || untitled,
            meta: this.byLine(x.authorName) + this.locLine(x),
            snippet: (x.desc || '').slice(0, 180)
          })),
          solutions: fSol.map((x: any) => ({
            title: x.title || untitled,
            meta: this.byLine(x.authorName) + this.locLine(x),
            snippet: (x.desc || '').slice(0, 180)
          })),
          solidarity: fSoli.map((x: any) => ({
            title: x.title || untitled,
            meta: this.byLine(x.authorName) + this.locLine(x),
            snippet: (x.desc || '').slice(0, 180)
          })),
          events: fEv.map((x: any) => ({
            title: x.title || untitled,
            meta: this.byLine(x.authorName) + this.locLine(x),
            snippet: (x.desc || '').slice(0, 180)
          })),
          groups: fGr.map((x: any) => ({
            title: x.name || x.title || untitled,
            meta: this.byLine(x.authorName) + this.locLine(x),
            snippet: (x.description || x.desc || '').slice(0, 180)
          }))
        };

        this.totalResults = 0;
        this.sections.forEach((s) => {
          s.results = mapped[s.key] || [];
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
