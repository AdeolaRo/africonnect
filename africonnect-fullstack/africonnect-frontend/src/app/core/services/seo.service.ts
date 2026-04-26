import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { getCanonicalOrigin } from '../config/app.config';

const PRIVATE_PATH_PREFIXES = [
  '/admin',
  '/profile',
  '/messagerie',
  '/moderation',
  '/publicite',
  '/paiement',
  '/reset-password'
];

@Injectable({ providedIn: 'root' })
export class SeoService {
  private lastPath = '/';
  private inited = false;

  constructor(
    private title: Title,
    private meta: Meta,
    private translate: TranslateService,
    private router: Router,
    @Inject(DOCUMENT) private doc: Document
  ) {
    this.translate.onLangChange.subscribe(() => this.apply());
  }

  /** Appeler une seule fois depuis le shell (ex. `AppComponent`). */
  init() {
    if (this.inited) return;
    this.inited = true;
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.lastPath = e.urlAfterRedirects || e.url;
        this.apply();
      });
    this.lastPath = this.router.url || '/';
    this.apply();
    this.setWebSiteJsonLd();
  }

  private isPrivatePath(path: string): boolean {
    const p = path.split('?')[0].split('#')[0] || '/';
    return PRIVATE_PATH_PREFIXES.some(
      (prefix) => p === prefix || p.startsWith(prefix + '/')
    );
  }

  private descriptionKeyForPath(path: string): string {
    const p = path.split('?')[0].split('#')[0] || '/';
    if (p === '/' || p === '') {
      return 'seo.descForum';
    }
    const map: [RegExp, string][] = [
      [/^\/forum$/, 'seo.descForum'],
      [/^\/marketplace$/, 'seo.descMarketplace'],
      [/^\/emploi$/, 'seo.descJobs'],
      [/^\/solutions$/, 'seo.descSolutions'],
      [/^\/solidarite$/, 'seo.descSolidarity'],
      [/^\/evenements$/, 'seo.descEvents'],
      [/^\/groupes$/, 'seo.descGroups'],
      [/^\/groupes\/[^/]+$/, 'seo.descGroupDetail'],
      [/^\/recherche$/, 'seo.descSearch'],
      [/^\/legal$/, 'seo.descLegal'],
      [/^\/plan-du-site$/, 'seo.descSitemap']
    ];
    for (const [re, key] of map) {
      if (re.test(p)) return key;
    }
    return 'seo.defaultDesc';
  }

  private pageTitleKey(path: string): string {
    const p = path.split('?')[0].split('#')[0] || '/';
    if (p === '/' || p === '' || p === '/forum') {
      return 'nav.forum';
    }
    const map: [RegExp, string][] = [
      [/^\/marketplace$/, 'nav.marketplace'],
      [/^\/emploi$/, 'nav.jobs'],
      [/^\/solutions$/, 'nav.solutions'],
      [/^\/solidarite$/, 'nav.solidarity'],
      [/^\/evenements$/, 'nav.events'],
      [/^\/groupes$/, 'nav.groups'],
      [/^\/groupes\/[^/]+$/, 'nav.groups'],
      [/^\/recherche$/, 'searchPage.title'],
      [/^\/legal$/, 'legal.combinedTitle'],
      [/^\/plan-du-site$/, 'footer.sitemap']
    ];
    for (const [re, key] of map) {
      if (re.test(p)) return key;
    }
    return 'nav.forum';
  }

  private apply() {
    const path = (this.lastPath || '/').split('?')[0].split('#')[0] || '/';
    const origin = getCanonicalOrigin();
    const noindex = this.isPrivatePath(path);
    const robots = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';

    const titleKey = this.pageTitleKey(path);
    const descKey = this.descriptionKeyForPath(path);
    const part = this.translate.instant(titleKey);
    const site = this.translate.instant('brand.name');
    const fullTitle = `${part} — ${site}`;
    const desc = this.translate.instant(descKey);

    this.title.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: desc });
    this.meta.updateTag({ name: 'robots', content: robots });

    const pathForUrl = (path && path !== '') ? path : '/forum';
    const canonical = `${origin}${pathForUrl.startsWith('/') ? pathForUrl : '/' + pathForUrl}`;

    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', canonical);

    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: desc });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: site });
    this.meta.updateTag({
      property: 'og:locale',
      content: (this.translate.currentLang || 'fr') === 'en' ? 'en_US' : 'fr_FR'
    });
    this.meta.updateTag({
      property: 'og:image',
      content: `${origin}/assets/favicon/favicon-96x96.png`
    });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: desc });
  }

  private setWebSiteJsonLd() {
    const origin = getCanonicalOrigin();
    const name = 'African Connect';
    const data: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name,
      url: `${origin}/`,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${origin}/recherche?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };
    let el = this.doc.getElementById('seo-ld-website') as HTMLScriptElement | null;
    if (!el) {
      el = this.doc.createElement('script');
      el.id = 'seo-ld-website';
      el.type = 'application/ld+json';
      this.doc.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }
}
