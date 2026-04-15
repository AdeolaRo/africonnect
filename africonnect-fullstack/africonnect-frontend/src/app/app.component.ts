import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './core/services/auth.service';
import { SearchService } from './core/services/search.service';
import { ModalComponent } from './shared/components/modal/modal.component';
import { CarouselComponent } from './shared/components/carousel/carousel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule, ModalComponent, CarouselComponent],
  template: `
    <nav class="navbar">
      <a routerLink="/" class="brand-link" style="display:flex; align-items:center; gap:8px; text-decoration:none; color:var(--text);">
        <div style="width:40px;height:40px;background:var(--primary);border-radius:16px;display:flex;align-items:center;justify-content:center;">🌍</div>
        <strong style="font-size:1.4rem;">AfriConnect Pro</strong>
      </a>
      <div class="nav-links">
        <a routerLink="/forum" routerLinkActive="active">Forum</a>
        <a routerLink="/marketplace" routerLinkActive="active">Ventes/Achats</a>
        <a routerLink="/emploi" routerLinkActive="active">Emploi</a>
        <a routerLink="/solutions" routerLinkActive="active">Solutions</a>
        <a routerLink="/solidarite" routerLinkActive="active">Solidarité</a>
        <a routerLink="/evenements" routerLinkActive="active">Événements</a>
        <a routerLink="/groupes" routerLinkActive="active">Groupes</a>
        <a routerLink="/messagerie" routerLinkActive="active">Messagerie</a>
        <a *ngIf="isAdmin" routerLink="/admin" routerLinkActive="active">Modération</a>
        <a routerLink="/profile" routerLinkActive="active" *ngIf="isLoggedIn">Profil</a>
      </div>
      <div class="toolbar">
        <span *ngIf="userEmail" style="margin-right:12px">{{ userEmail }}</span>
        <button class="btn" *ngIf="!isLoggedIn" (click)="openAuthModal()">Connexion</button>
        <button class="btn" *ngIf="isLoggedIn" (click)="logout()">Déconnexion</button>
      </div>
    </nav>

    <div class="container">
      <div class="search-bar" *ngIf="!isAdminOrModerationRoute">
        <input type="text" [(ngModel)]="searchQuery" placeholder="Rechercher sur tout le site..." (input)="onSearch()">
      </div>

      <div class="main-layout">
        <aside class="sidebar-vertical">
          <h3>Navigation</h3>
          <ul>
            <li><a routerLink="/forum" routerLinkActive="active">Forum</a></li>
            <li><a routerLink="/marketplace" routerLinkActive="active">Ventes/Achats</a></li>
            <li><a routerLink="/emploi" routerLinkActive="active">Emploi</a></li>
            <li><a routerLink="/solutions" routerLinkActive="active">Solutions</a></li>
            <li><a routerLink="/solidarite" routerLinkActive="active">Solidarité</a></li>
            <li><a routerLink="/evenements" routerLinkActive="active">Événements</a></li>
            <li><a routerLink="/groupes" routerLinkActive="active">Groupes</a></li>
            <li><a routerLink="/messagerie" routerLinkActive="active">Messagerie</a></li>
            <li *ngIf="isAdmin"><a routerLink="/admin" routerLinkActive="active">Modération</a></li>
            <li *ngIf="isLoggedIn"><a routerLink="/profile" routerLinkActive="active">Profil</a></li>
          </ul>
        </aside>

        <main class="content">
          <router-outlet (activate)="onActivate($event)"></router-outlet>
        </main>

        <aside class="sidebar-right" *ngIf="!isAdminOrModerationRoute">
          <app-carousel></app-carousel>
          <div class="rss-feed">
            <h3>Flux RSS</h3>
            <div id="rssFeedList">Chargement...</div>
          </div>
        </aside>
      </div>
    </div>

    <app-modal [(visible)]="authModalVisible" title="Connexion / Inscription">
      <form (ngSubmit)="login($event)" class="auth-form">
        <input type="email" [(ngModel)]="authEmail" placeholder="Email" name="authEmail" required>
        <input type="password" [(ngModel)]="authPassword" placeholder="Mot de passe" name="authPassword" required>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button type="submit" class="btn btn-primary">Se connecter</button>
          <button type="button" class="btn btn-secondary" (click)="register()">Créer un compte</button>
          <a routerLink="/forgot-password" style="color:var(--primary);">Mot de passe oublié ?</a>
        </div>
      </form>
    </app-modal>

    <div *ngIf="toastMessage" class="toast">{{ toastMessage }}</div>
  `,
  styles: [`
    .navbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; background: var(--surface); padding: 12px 24px; gap: 16px; border-bottom: 1px solid var(--border); }
    .nav-links { display: flex; gap: 8px; flex-wrap: wrap; }
    .toolbar { display: flex; gap: 12px; align-items: center; }
    .container { max-width: 1400px; margin: 0 auto; padding: 24px; }
    .search-bar { margin-bottom: 20px; }
    .search-bar input { width: 100%; padding: 12px; border-radius: 40px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); }
    .main-layout { display: flex; gap: 24px; }
    .sidebar-vertical { width: 220px; background: var(--surface); border-radius: 24px; padding: 20px; height: fit-content; }
    .sidebar-vertical ul { list-style: none; padding: 0; margin: 0; }
    .sidebar-vertical li { margin-bottom: 12px; }
    .sidebar-vertical a { color: var(--text); text-decoration: none; display: block; padding: 8px 12px; border-radius: 16px; }
    .sidebar-vertical a.active, .sidebar-vertical a:hover { background: var(--surface-2); color: var(--primary); }
    .content { flex: 1; }
    .sidebar-right { width: 300px; }
    .rss-feed { background: var(--surface); border-radius: 24px; padding: 20px; margin-top: 20px; }
    .rss-feed h3 { margin-top: 0; }
    .toast { position: fixed; bottom: 20px; right: 20px; background: #334155; color: white; padding: 12px 20px; border-radius: 40px; z-index: 2000; }
    .auth-form input { width: 100%; margin-bottom: 12px; padding: 12px; border-radius: 16px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); }
    @media (max-width: 768px) { .main-layout { flex-direction: column; } .sidebar-vertical, .sidebar-right { width: 100%; } }
  `]
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  userEmail = '';
  authModalVisible = false;
  authEmail = '';
  authPassword = '';
  toastMessage = '';
  searchQuery = '';
  isAdminOrModerationRoute = false;

  constructor(private auth: AuthService, private router: Router, private searchService: SearchService) {}

  ngOnInit() {
    this.auth.currentUser.subscribe(user => {
      this.isLoggedIn = !!user;
      this.userEmail = user?.email || '';
      this.isAdmin = user?.role === 'admin';
    });
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.url;
        this.isAdminOrModerationRoute = url.includes('/admin') || url.includes('/profile') || url.includes('/messagerie');
      }
    });
    this.loadRssFeeds();
  }

  onSearch() { this.searchService.setQuery(this.searchQuery); }
  openAuthModal() { this.authModalVisible = true; }

  async login(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    console.log('Login attempt:', this.authEmail, this.authPassword);
    if (!this.authEmail || !this.authPassword) {
      this.showToast('Veuillez remplir tous les champs');
      return;
    }
    try {
      await this.auth.login(this.authEmail, this.authPassword);
      this.authModalVisible = false;
      this.showToast('Connecté');
    } catch(e) {
      console.error('Login error:', e);
      this.showToast('Erreur de connexion: ' + (e.message || e));
    }
  }

  async register() {
    console.log('Register attempt:', this.authEmail, this.authPassword);
    if (!this.authEmail || !this.authPassword) {
      this.showToast('Veuillez remplir tous les champs');
      return;
    }
    try {
      await this.auth.register(this.authEmail, this.authPassword);
      this.showToast('Compte créé, vérifiez votre email');
      this.authEmail = '';
      this.authPassword = '';
    } catch(e) {
      console.error('Register error:', e);
      this.showToast("Erreur lors de l'inscription: " + (e.message || e));
    }
  }

  async logout() {
    await this.auth.logout();
    this.showToast('Déconnecté');
    this.router.navigate(['/']);
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    setTimeout(() => this.toastMessage = '', 3000);
  }

  onActivate(component: any) {}

  loadRssFeeds() {
    const container = document.getElementById('rssFeedList');
    if (!container) return;
    const feeds = [
      { label: 'RFI Afrique', url: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.rfi.fr/fr/afrique/rss' },
      { label: 'France 24 Afrique', url: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.france24.com/fr/afrique/rss' }
    ];
    Promise.all(feeds.map(feed => fetch(feed.url).then(res => res.json()).then(data => ({ feed, data })).catch(() => ({ feed, data: { items: [] } }))))
      .then(results => {
        let items: any[] = [];
        results.forEach(({ feed, data }) => {
          (data.items || []).slice(0, 3).forEach((item: any) => {
            items.push({ title: item.title, link: item.link, pubDate: item.pubDate, source: feed.label });
          });
        });
        items.sort((a: any, b: any) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        container.innerHTML = items.slice(0, 5).map(item => `
          <div class="rss-item">
            <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
            <div style="font-size:0.8rem; color:var(--muted);">${item.source} - ${new Date(item.pubDate).toLocaleDateString()}</div>
          </div>
        `).join('');
      });
  }
}