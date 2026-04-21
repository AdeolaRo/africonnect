import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../core/config/app.config';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="ad-carousel">
      <div *ngIf="ads.length === 0" class="carousel-slide">
        <h3>{{ 'carousel.spaceTitle' | translate }}</h3>
        <p>{{ 'carousel.spaceSubtitle' | translate }}</p>
        <button class="btn btn-primary" disabled>{{ 'carousel.comingSoon' | translate }}</button>
      </div>

      <div *ngIf="ads.length > 0">
        <div class="carousel-track" [style.transform]="'translateX(-' + currentSlide * 100 + '%)'">
          <div class="carousel-slide" *ngFor="let ad of ads">
            <div *ngIf="ad.mediaType === 'video'" class="media-preview" style="max-height: 220px;">
              <video [src]="ad.mediaUrl" controls muted loop playsinline></video>
            </div>
            <div *ngIf="ad.mediaType === 'image'" class="media-preview" style="max-height: 220px;">
              <img [src]="ad.mediaUrl" [alt]="ad.title">
            </div>
            <h3>{{ ad.title }}</h3>
            <p *ngIf="ad.description">{{ ad.description }}</p>
            <a *ngIf="ad.targetUrl" [href]="ad.targetUrl" target="_blank" class="btn btn-primary">{{ ad.buttonText || ('carousel.learnMore' | translate) }}</a>
            <button *ngIf="!ad.targetUrl" class="btn btn-primary" disabled>{{ ad.buttonText || ('carousel.learnMore' | translate) }}</button>
          </div>
        </div>

        <button *ngIf="ads.length > 1" class="carousel-nav prev" (click)="prev()" type="button" [attr.aria-label]="'carousel.ariaPrev' | translate">❮</button>
        <button *ngIf="ads.length > 1" class="carousel-nav next" (click)="next()" type="button" [attr.aria-label]="'carousel.ariaNext' | translate">❯</button>

        <div *ngIf="ads.length > 1" class="carousel-dots">
          <button *ngFor="let ad of ads; let i = index" class="dot" [class.active]="i === currentSlide" (click)="goTo(i)" type="button" [attr.aria-label]="'carousel.ariaDot' | translate:{ n: i + 1 }"></button>
        </div>
      </div>
    </div>
  `
})
export class CarouselComponent implements OnInit, OnDestroy {
  /** If set, only ads whose displayIn includes this section. Empty = all active ads (sidebar). */
  @Input() section: string = '';

  ads: any[] = [];
  currentSlide = 0;
  private interval: any;

  constructor(
    private http: HttpClient,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadAds();
    if (this.ads.length > 1) {
      this.interval = setInterval(() => this.next(), 8000);
    }
  }

  ngOnDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  loadAds() {
    const url = `${API_BASE_URL}/advertisements${this.section ? '?section=' + this.section : ''}`;
    this.http.get<any[]>(url).subscribe({
      next: (ads) => {
        this.ads = (ads || []).map(ad => ({
          ...ad,
          mediaUrl: this.normalizeMediaUrl(ad?.mediaUrl)
        }));
        if (this.ads.length > 1 && !this.interval) {
          this.interval = setInterval(() => this.next(), 8000);
        }
      },
      error: (err) => {
        console.error('Error loading ads:', err);
        const t = (k: string) => this.translate.instant(k);
        this.ads = [
          {
            title: t('carousel.fallback1Title'),
            description: t('carousel.fallback1Desc'),
            buttonText: t('carousel.learnMore')
          },
          {
            title: t('carousel.fallback2Title'),
            description: t('carousel.fallback2Desc'),
            buttonText: t('carousel.fallback2Button')
          },
          {
            title: t('carousel.fallback3Title'),
            description: t('carousel.fallback3Desc'),
            buttonText: t('carousel.fallback3Button')
          }
        ];
      }
    });
  }

  private normalizeMediaUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('/uploads/')) return `${API_BASE_URL.replace(/\/api$/, '')}${url}`;
    return url;
  }

  next() {
    if (this.ads.length > 1) {
      this.currentSlide = (this.currentSlide + 1) % this.ads.length;
    }
  }

  prev() {
    if (this.ads.length > 1) {
      this.currentSlide = (this.currentSlide - 1 + this.ads.length) % this.ads.length;
    }
  }

  goTo(i: number) {
    this.currentSlide = i;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = setInterval(() => this.next(), 8000);
    }
  }
}
