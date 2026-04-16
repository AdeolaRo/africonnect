import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ad-carousel">
      <div *ngIf="ads.length === 0" class="carousel-slide">
        <h3>Espace publicitaire</h3>
        <p>Contactez-nous pour promouvoir votre activité</p>
        <button class="btn btn-primary" disabled>Bientôt disponible</button>
      </div>
      
      <div *ngIf="ads.length > 0">
        <div class="carousel-track" [style.transform]="'translateX(-' + currentSlide * 100 + '%)'">
          <div class="carousel-slide" *ngFor="let ad of ads">
            <div *ngIf="ad.mediaType === 'video'" class="media-container">
              <video [src]="ad.mediaUrl" controls autoplay muted loop playsinline style="max-width: 100%; border-radius: 12px; margin-bottom: 16px;"></video>
            </div>
            <div *ngIf="ad.mediaType === 'image'" class="media-container">
              <img [src]="ad.mediaUrl" [alt]="ad.title" style="max-width: 100%; border-radius: 12px; margin-bottom: 16px;">
            </div>
            <h3>{{ ad.title }}</h3>
            <p *ngIf="ad.description">{{ ad.description }}</p>
            <a *ngIf="ad.targetUrl" [href]="ad.targetUrl" target="_blank" class="btn btn-primary">{{ ad.buttonText || 'En savoir plus' }}</a>
            <button *ngIf="!ad.targetUrl" class="btn btn-primary" disabled>{{ ad.buttonText || 'En savoir plus' }}</button>
          </div>
        </div>
        
        <button *ngIf="ads.length > 1" class="carousel-nav prev" (click)="prev()">❮</button>
        <button *ngIf="ads.length > 1" class="carousel-nav next" (click)="next()">❯</button>
        
        <div *ngIf="ads.length > 1" class="carousel-dots">
          <button *ngFor="let ad of ads; let i = index" class="dot" [class.active]="i === currentSlide" (click)="goTo(i)"></button>
        </div>
      </div>
    </div>
  `
})
export class CarouselComponent implements OnInit, OnDestroy {
  @Input() section: string = 'forum'; // Section actuelle pour filtrer les pubs
  
  ads: any[] = [];
  currentSlide = 0;
  private interval: any;
  
  constructor(private http: HttpClient) {}
  
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
    const url = `http://localhost:3000/api/advertisements${this.section ? '?section=' + this.section : ''}`;
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
        // Fallback aux pubs par défaut
        this.ads = [
          { title: 'Offre spéciale', description: 'Découvrez nos partenaires', buttonText: 'En savoir plus' },
          { title: 'Événement à venir', description: 'Rencontre africaine à Paris', buttonText: 'Je participe' },
          { title: 'Service à la une', description: "Transfert d'argent simplifié", buttonText: 'Utiliser' }
        ];
      }
    });
  }

  private normalizeMediaUrl(url?: string): string {
    if (!url) return '';
    // Si l’API renvoie une URL relative, on la sert depuis le backend
    if (url.startsWith('/uploads/')) return `http://localhost:3000${url}`;
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
    // Réinitialiser le timer
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = setInterval(() => this.next(), 8000);
    }
  }
}