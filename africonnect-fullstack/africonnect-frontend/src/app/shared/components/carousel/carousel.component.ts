import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ad-carousel">
      <div class="carousel-track" [style.transform]="'translateX(-' + currentSlide * 100 + '%)'">
        <div class="carousel-slide" *ngFor="let ad of ads">
          <h3>{{ ad.title }}</h3>
          <p>{{ ad.description }}</p>
          <button class="btn btn-primary">{{ ad.buttonText }}</button>
        </div>
      </div>
      <button class="carousel-nav prev" (click)="prev()">❮</button>
      <button class="carousel-nav next" (click)="next()">❯</button>
      <div class="carousel-dots">
        <button *ngFor="let ad of ads; let i = index" class="dot" [class.active]="i === currentSlide" (click)="goTo(i)"></button>
      </div>
    </div>
  `
})
export class CarouselComponent implements OnInit, OnDestroy {
  ads = [
    { title: 'Offre spéciale', description: 'Découvrez nos partenaires', buttonText: 'En savoir plus' },
    { title: 'Événement à venir', description: 'Rencontre africaine à Paris', buttonText: 'Je participe' },
    { title: 'Service à la une', description: "Transfert d'argent simplifié", buttonText: 'Utiliser' }
  ];
  currentSlide = 0;
  private interval: any;
  ngOnInit() { this.interval = setInterval(() => this.next(), 5000); }
  ngOnDestroy() { if (this.interval) clearInterval(this.interval); }
  next() { this.currentSlide = (this.currentSlide + 1) % this.ads.length; }
  prev() { this.currentSlide = (this.currentSlide - 1 + this.ads.length) % this.ads.length; }
  goTo(i: number) { this.currentSlide = i; }
}