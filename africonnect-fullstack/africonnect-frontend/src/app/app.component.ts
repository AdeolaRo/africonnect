import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './core/services/auth.service';
import { SearchService } from './core/services/search.service';
import { ModalComponent } from './shared/components/modal/modal.component';
import { CarouselComponent } from './shared/components/carousel/carousel.component';
import { API_BASE_URL } from './core/config/app.config';
import { ApiService } from './core/services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule, ModalComponent, CarouselComponent],
  template: `
    <nav class="navbar">
      <a routerLink="/" class="brand-link" style="display:flex; align-items:center; gap:8px; text-decoration:none; color:var(--text);">
        <div style="width:40px;height:40px;background:var(--primary);border-radius:16px;display:flex;align-items:center;justify-content:center;">🌍</div>
        <strong style="font-size:1.4rem;">African Connect</strong>
      </a>
      <button class="nav-toggle" type="button" (click)="toggleNav()" aria-label="Menu">☰</button>
      <div class="nav-links" [class.open]="isNavOpen">
        <a routerLink="/forum" routerLinkActive="active">Forum</a>
        <a routerLink="/marketplace" routerLinkActive="active">Ventes/Achats</a>
        <a routerLink="/emploi" routerLinkActive="active">Emploi</a>
        <a routerLink="/solutions" routerLinkActive="active">Solutions</a>
        <a routerLink="/solidarite" routerLinkActive="active">Solidarité</a>
        <a routerLink="/evenements" routerLinkActive="active">Événements</a>
        <a routerLink="/groupes" routerLinkActive="active">Groupes</a>
        <a routerLink="/profile" routerLinkActive="active" *ngIf="isLoggedIn">Profil</a>
      </div>
      <div class="toolbar">
        <span *ngIf="userPseudo" style="margin-right:12px">{{ userPseudo }}</span>
        <button class="btn" *ngIf="!isLoggedIn" (click)="openAuthModal()">Connexion</button>
        <button class="btn" *ngIf="isLoggedIn" (click)="logout()">Déconnexion</button>
      </div>
    </nav>

    <div class="container">
      <div class="search-bar" *ngIf="!isAdminOrModerationRoute">
        <input type="text" [(ngModel)]="searchQuery" placeholder="Rechercher sur tout le site..." (input)="onSearch()">
      </div>

      <div class="main-layout">
        <main class="content">
          <router-outlet (activate)="onActivate($event)"></router-outlet>
        </main>

        <aside class="sidebar-right" *ngIf="!isAdminOrModerationRoute && !isProfileRoute">
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
          <button type="button" class="btn btn-secondary" (click)="openRegisterModal()">Créer un compte</button>
          <button type="button" class="btn btn-link" (click)="openForgotPassword()" style="color:var(--primary); padding: 0; background: transparent; border: none; cursor: pointer;">
            Mot de passe oublié ?
          </button>
        </div>
      </form>
    </app-modal>

    <app-modal [(visible)]="registerModalVisible" title="Créer un compte">
      <form (ngSubmit)="submitRegister($event)" class="auth-form">
        <input type="email" [(ngModel)]="registerEmail" placeholder="Email" name="registerEmail" required>
        <input type="password" [(ngModel)]="registerPassword" placeholder="Mot de passe" name="registerPassword" required>
        <input type="text" [(ngModel)]="registerPseudo" placeholder="Pseudo" name="registerPseudo" required>
        <input type="text" [(ngModel)]="registerFullName" placeholder="Nom complet" name="registerFullName">
        <input type="text" [(ngModel)]="registerCity" placeholder="Ville" name="registerCity">
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button type="submit" class="btn btn-primary" [disabled]="isRegistering">
            {{ isRegistering ? 'Création...' : 'Créer' }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="registerModalVisible = false" [disabled]="isRegistering">Annuler</button>
        </div>
      </form>
    </app-modal>

    <app-modal [(visible)]="forgotModalVisible" title="Mot de passe oublié">
      <form (ngSubmit)="submitForgotPassword($event)" class="auth-form">
        <input type="email" [(ngModel)]="forgotEmail" placeholder="Votre email" name="forgotEmail" required>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button type="submit" class="btn btn-primary" [disabled]="isSendingForgot">
            {{ isSendingForgot ? 'Envoi...' : 'Envoyer' }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="forgotModalVisible = false" [disabled]="isSendingForgot">Annuler</button>
        </div>
        <div class="text-muted" style="margin-top:10px; font-size:0.9rem;">
          Vous recevrez un email avec un lien pour définir un nouveau mot de passe.
        </div>
      </form>
    </app-modal>

    <div *ngIf="toastMessage" class="toast">{{ toastMessage }}</div>
  `,
  styles: [`
    .navbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; background: var(--surface); padding: 12px 24px; gap: 16px; border-bottom: 1px solid var(--border); }
    .nav-toggle { display:none; padding: 10px 12px; border-radius: 14px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); cursor: pointer; }
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
    @media (max-width: 768px) {
      .navbar { padding: 12px 14px; }
      .container { padding: 14px; }
      .nav-toggle { display:block; }
      .nav-links { display:none; width:100%; }
      .nav-links.open { display:flex; }
      .nav-links a { flex: 1 1 auto; text-align:center; }
      .main-layout { flex-direction: column; }
      .sidebar-vertical, .sidebar-right { width: 100%; }
    }
  `]
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  isModerator = false;
  userPseudo = '';
  authModalVisible = false;
  authEmail = '';
  authPassword = '';
  toastMessage = '';
  forgotModalVisible = false;
  forgotEmail = '';
  isSendingForgot = false;
  registerModalVisible = false;
  registerEmail = '';
  registerPassword = '';
  registerPseudo = '';
  registerFullName = '';
  registerCity = '';
  isRegistering = false;
  searchQuery = '';
  isAdminOrModerationRoute = false;
  isProfileRoute = false;
  isNavOpen = false;

  constructor(private auth: AuthService, private router: Router, private searchService: SearchService, private api: ApiService) {}

  ngOnInit() {
    this.auth.currentUser.subscribe(user => {
      this.isLoggedIn = !!user;
      this.userPseudo = user?.pseudo || '';
      this.isAdmin = user?.role === 'admin';
      this.isModerator = user?.role === 'moderator';
    });
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.url;
        this.isAdminOrModerationRoute = url.includes('/admin') || url.includes('/profile') || url.includes('/messagerie') || url.includes('/moderation');
        this.isProfileRoute = url.includes('/profile');
        this.isNavOpen = false;
      }
    });
    this.loadRssFeeds();
  }

  onSearch() {
    this.searchService.setQuery(this.searchQuery);
    const q = (this.searchQuery || '').trim();
    if (!q) return;
    // Redirige vers une page de résultats (hors espaces user/mod/admin)
    if (!this.isAdminOrModerationRoute && !this.router.url.includes('/recherche')) {
      this.router.navigate(['/recherche']);
    }
  }
  openAuthModal() { this.authModalVisible = true; }
  toggleNav() { this.isNavOpen = !this.isNavOpen; }

  openForgotPassword() {
    this.authModalVisible = false;
    this.forgotEmail = this.authEmail || '';
    this.forgotModalVisible = true;
  }

  openRegisterModal() {
    this.authModalVisible = false;
    this.registerEmail = this.authEmail || '';
    this.registerPassword = this.authPassword || '';
    this.registerPseudo = '';
    this.registerFullName = '';
    this.registerCity = '';
    this.registerModalVisible = true;
  }

  async submitRegister(event?: Event) {
    if (event) event.preventDefault();
    const email = (this.registerEmail || '').trim();
    const password = (this.registerPassword || '').trim();
    const pseudo = (this.registerPseudo || '').trim();
    const fullName = (this.registerFullName || '').trim();
    const city = (this.registerCity || '').trim();

    if (!email || !password || !pseudo) {
      this.showToast('Email, mot de passe et pseudo requis');
      return;
    }

    this.isRegistering = true;
    try {
      await this.auth.register(email, password, { pseudo, fullName, city });
      this.registerModalVisible = false;
      this.showToast('Compte créé, vérifiez votre email');
      this.authEmail = '';
      this.authPassword = '';
    } catch (e) {
      console.error('Register error:', e);
      this.showToast("Erreur lors de l'inscription: " + (e.message || e));
    } finally {
      this.isRegistering = false;
    }
  }

  submitForgotPassword(event?: Event) {
    if (event) event.preventDefault();
    const email = (this.forgotEmail || '').trim();
    if (!email) {
      this.showToast('Email requis');
      return;
    }
    this.isSendingForgot = true;
    this.api.post('auth/forgot-password', { email }, false).subscribe({
      next: () => {
        this.isSendingForgot = false;
        this.forgotModalVisible = false;
        this.showToast('Email envoyé (si le compte existe).');
      },
      error: (err) => {
        console.error('Forgot password error:', err);
        this.isSendingForgot = false;
        // Ne pas révéler si l’email existe ou non
        this.forgotModalVisible = false;
        this.showToast('Email envoyé (si le compte existe).');
      }
    });
  }

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

  // register() replaced by popup flow

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
    fetch(`${API_BASE_URL}/rss/feeds`)
      .then(res => res.json())
      .then((feeds: any[]) => {
        const normalized = (Array.isArray(feeds) ? feeds : [])
          .filter(f => f?.rssUrl)
          .map(f => ({
            label: f.label || 'RSS',
            url: `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(f.rssUrl)}`
          }));

        // fallback si aucune source configurée
        const fallback = [
          { label: 'RFI Afrique', url: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.rfi.fr/fr/afrique/rss' },
          { label: 'France 24 Afrique', url: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.france24.com/fr/afrique/rss' }
        ];
        const feedsToUse = normalized.length ? normalized : fallback;

        return Promise.all(feedsToUse.map(feed =>
          fetch(feed.url)
            .then(r => r.json())
            .then(data => ({ feed, data }))
            .catch(() => ({ feed, data: { items: [] } }))
        ));
      })
      .then(results => {
        let items: any[] = [];
        (results || []).forEach(({ feed, data }: any) => {
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
      })
      .catch(() => {
        container.innerHTML = 'Impossible de charger le flux RSS.';
      });
  }
}