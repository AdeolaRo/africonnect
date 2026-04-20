import { AfterViewInit, Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './core/services/auth.service';
import { SearchService } from './core/services/search.service';
import { ModalComponent } from './shared/components/modal/modal.component';
import { CarouselComponent } from './shared/components/carousel/carousel.component';
import { API_BASE_URL } from './core/config/app.config';
import { ApiService } from './core/services/api.service';
import { RealtimeService } from './core/services/realtime.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule, ModalComponent, CarouselComponent, TranslateModule],
  template: `
    <nav class="navbar">
      <a routerLink="/" class="brand-link" style="display:flex; align-items:center; gap:8px; text-decoration:none; color:var(--text);">
        <img src="assets/favicon/favicon-96x96.png" alt="Logo" style="width:40px;height:40px;border-radius:16px;display:block;border:1px solid rgba(255,255,255,0.12); object-fit: cover;">
        <strong style="font-size:1.4rem;">African Connect</strong>
      </a>
      <button class="nav-toggle" type="button" (click)="toggleNav()" aria-label="Menu">☰</button>
      <div class="nav-links" [class.open]="isNavOpen">
        <a routerLink="/forum" routerLinkActive="active">{{ 'nav.forum' | translate }}</a>
        <a routerLink="/marketplace" routerLinkActive="active">{{ 'nav.marketplace' | translate }}</a>
        <a routerLink="/emploi" routerLinkActive="active">{{ 'nav.jobs' | translate }}</a>
        <a routerLink="/solutions" routerLinkActive="active">{{ 'nav.solutions' | translate }}</a>
        <a routerLink="/solidarite" routerLinkActive="active">{{ 'nav.solidarity' | translate }}</a>
        <a routerLink="/evenements" routerLinkActive="active">{{ 'nav.events' | translate }}</a>
        <a routerLink="/groupes" routerLinkActive="active">{{ 'nav.groups' | translate }}</a>
      </div>
      <div class="toolbar">
        <button class="lang-btn" type="button" (click)="setLang('fr')" [class.active]="lang==='fr'">🇫🇷 {{ 'lang.fr' | translate }}</button>
        <button class="lang-btn" type="button" (click)="setLang('en')" [class.active]="lang==='en'">🇬🇧 {{ 'lang.en' | translate }}</button>
        <button *ngIf="isLoggedIn" class="icon-btn" type="button" (click)="openNotifications()" aria-label="Notifications">
          🔔
          <span *ngIf="unreadNotifications > 0" class="badge">{{ unreadNotifications }}</span>
        </button>
        <button *ngIf="isLoggedIn" class="icon-btn" type="button" (click)="openMessaging()" aria-label="Messages">
          💬
          <span *ngIf="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>
        </button>
        <button *ngIf="isLoggedIn" class="profile-chip" type="button" (click)="goProfile()">
          <img *ngIf="userAvatar" [src]="userAvatar" class="avatar-mini" alt="Avatar">
          <span>{{ 'nav.profile' | translate }}</span>
        </button>
        <span *ngIf="userPseudo" class="user-pseudo">{{ userPseudo }}</span>
        <button class="btn" *ngIf="!isLoggedIn" (click)="openAuthModal()">{{ 'nav.login' | translate }}</button>
        <button class="btn" *ngIf="isLoggedIn" (click)="logout()">{{ 'nav.logout' | translate }}</button>
      </div>
    </nav>

    <div class="container">
      <div class="search-bar" *ngIf="!isAdminOrModerationRoute">
        <input type="text" [(ngModel)]="searchQuery" [placeholder]="'search.placeholder' | translate" (input)="onSearch()">
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
        <input type="email" [(ngModel)]="authEmail" [placeholder]="'auth.email' | translate" name="authEmail" required>
        <input type="password" [(ngModel)]="authPassword" [placeholder]="'auth.password' | translate" name="authPassword" required>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button type="submit" class="btn btn-primary">{{ 'auth.login' | translate }}</button>
          <button type="button" class="btn btn-secondary" (click)="openRegisterModal()">{{ 'auth.createAccount' | translate }}</button>
          <button type="button" class="btn btn-link" (click)="openForgotPassword()" style="color:var(--primary); padding: 0; background: transparent; border: none; cursor: pointer;">
            {{ 'auth.forgot' | translate }}
          </button>
        </div>
      </form>
    </app-modal>

    <app-modal [(visible)]="registerModalVisible" [title]="'auth.registerTitle' | translate">
      <form (ngSubmit)="submitRegister($event)" class="auth-form">
        <input type="text" [(ngModel)]="registerPseudo" [placeholder]="'auth.pseudo' | translate" name="registerPseudo" required>
        <input type="text" [(ngModel)]="registerFullName" [placeholder]="'auth.fullName' | translate" name="registerFullName" required>
        <input type="email" [(ngModel)]="registerEmail" [placeholder]="'auth.email' | translate" name="registerEmail" required>
        <div class="pw-wrap">
          <input [type]="showRegisterPassword ? 'text' : 'password'" [(ngModel)]="registerPassword" [placeholder]="'auth.password' | translate" name="registerPassword" required>
          <button class="pw-toggle" type="button" (click)="showRegisterPassword = !showRegisterPassword"
                  [attr.aria-label]="showRegisterPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
            <svg *ngIf="!showRegisterPassword" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5c-5.5 0-10 5.3-10 7s4.5 7 10 7 10-5.3 10-7-4.5-7-10-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5c2.77 0 5 2.24 5 5s-2.23 5-5 5zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
            </svg>
            <svg *ngIf="showRegisterPassword" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.1 3.51 3.51 2.1 21.9 20.49 20.49 21.9l-3.02-3.02c-1.57.73-3.35 1.12-5.47 1.12-5.5 0-10-5.3-10-7 0-1.04 1.69-3.28 4.36-4.92L2.1 3.51zm9.9 4.49c2.77 0 5 2.24 5 5 0 .54-.09 1.06-.25 1.55l-1.62-1.62c.05-.19.07-.39.07-.6a3 3 0 0 0-3-3c-.21 0-.41.02-.6.07L10.98 7.8c.49-.16 1.01-.25 1.52-.25zm-7.5 5c.93 1.24 2.97 3.59 5.98 4.43l-1.63-1.63a5 5 0 0 1-1.85-3.8c0-.67.13-1.31.36-1.9-1.23.87-2.21 1.94-2.86 2.9zm8.49 4.99c.33.03.67.01 1.01-.03l-1.73-1.73c.23.09.48.15.72.18zM12 5c2.12 0 3.9.39 5.47 1.12C20.24 7.76 22 9.99 22 11c0 .71-.71 2.01-1.86 3.34l-1.45-1.45c.76-.89 1.24-1.68 1.39-1.89-.93-1.25-3.52-4-8.08-4-.34 0-.67.02-.99.05L9.6 5.64c.76-.1 1.56-.14 2.4-.14z"/>
            </svg>
          </button>
        </div>
        <div class="pw-wrap">
          <input [type]="showRegisterPasswordConfirm ? 'text' : 'password'" [(ngModel)]="registerPasswordConfirm" [placeholder]="'auth.confirmPassword' | translate" name="registerPasswordConfirm" required>
          <button class="pw-toggle" type="button" (click)="showRegisterPasswordConfirm = !showRegisterPasswordConfirm"
                  [attr.aria-label]="showRegisterPasswordConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
            <svg *ngIf="!showRegisterPasswordConfirm" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5c-5.5 0-10 5.3-10 7s4.5 7 10 7 10-5.3 10-7-4.5-7-10-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5c2.77 0 5 2.24 5 5s-2.23 5-5 5zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
            </svg>
            <svg *ngIf="showRegisterPasswordConfirm" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.1 3.51 3.51 2.1 21.9 20.49 20.49 21.9l-3.02-3.02c-1.57.73-3.35 1.12-5.47 1.12-5.5 0-10-5.3-10-7 0-1.04 1.69-3.28 4.36-4.92L2.1 3.51zm9.9 4.49c2.77 0 5 2.24 5 5 0 .54-.09 1.06-.25 1.55l-1.62-1.62c.05-.19.07-.39.07-.6a3 3 0 0 0-3-3c-.21 0-.41.02-.6.07L10.98 7.8c.49-.16 1.01-.25 1.52-.25zm-7.5 5c.93 1.24 2.97 3.59 5.98 4.43l-1.63-1.63a5 5 0 0 1-1.85-3.8c0-.67.13-1.31.36-1.9-1.23.87-2.21 1.94-2.86 2.9zm8.49 4.99c.33.03.67.01 1.01-.03l-1.73-1.73c.23.09.48.15.72.18zM12 5c2.12 0 3.9.39 5.47 1.12C20.24 7.76 22 9.99 22 11c0 .71-.71 2.01-1.86 3.34l-1.45-1.45c.76-.89 1.24-1.68 1.39-1.89-.93-1.25-3.52-4-8.08-4-.34 0-.67.02-.99.05L9.6 5.64c.76-.1 1.56-.14 2.4-.14z"/>
            </svg>
          </button>
        </div>
        <label class="terms-line">
          <input type="checkbox" [(ngModel)]="registerAcceptTerms" name="registerAcceptTerms">
          <span>
            {{ 'auth.acceptPrefix' | translate }}
            <button type="button" class="link-btn" (click)="openTerms()">{{ 'auth.terms' | translate }}</button>
            {{ 'auth.and' | translate }}
            <button type="button" class="link-btn" (click)="openConditions()">{{ 'auth.conditions' | translate }}</button>.
          </span>
        </label>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button type="submit" class="btn btn-primary" [disabled]="isRegistering || !registerAcceptTerms">
            {{ isRegistering ? '...' : ('auth.create' | translate) }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="registerModalVisible = false" [disabled]="isRegistering">{{ 'auth.cancel' | translate }}</button>
        </div>
      </form>
    </app-modal>

    <app-modal [(visible)]="termsVisible" title="Termes">
      <div class="legal-text">
        <p><strong>African Connect</strong> est une plateforme communautaire destinée à faciliter les échanges (forum, groupes, annonces, offres, événements) entre membres.</p>
        <p>En utilisant le service, vous acceptez notamment :</p>
        <ul>
          <li>de publier des informations exactes et de respecter les autres utilisateurs ;</li>
          <li>de ne pas publier de contenu illégal, haineux, diffamatoire, harcelant, ou à caractère sexuel explicite ;</li>
          <li>de ne pas usurper l’identité d’une autre personne ;</li>
          <li>de ne pas tenter d’exploiter des failles, contourner la sécurité, ou perturber le service.</li>
        </ul>
        <p>Nous pouvons, à notre discrétion, modérer, retirer ou limiter l’accès à des contenus/compte en cas d’abus, afin de protéger la communauté.</p>
      </div>
      <div style="display:flex; justify-content:flex-end; margin-top:12px;">
        <button class="btn btn-secondary" type="button" (click)="termsVisible=false">Fermer</button>
      </div>
    </app-modal>

    <app-modal [(visible)]="conditionsVisible" title="Conditions d'utilisation">
      <div class="legal-text">
        <p><strong>1) Compte</strong></p>
        <ul>
          <li>Vous êtes responsable de la confidentialité de votre mot de passe et des actions effectuées depuis votre compte.</li>
          <li>Vous pouvez supprimer votre compte depuis votre profil. Certaines données peuvent rester en sauvegarde technique un temps limité.</li>
        </ul>
        <p><strong>2) Contenus</strong></p>
        <ul>
          <li>Vous restez propriétaire de vos contenus, mais vous nous autorisez à les afficher sur la plateforme.</li>
          <li>Les contenus peuvent être modérés (suppression/masquage) en cas de violation des règles ou signalement.</li>
        </ul>
        <p><strong>3) Annonces & publicités</strong></p>
        <ul>
          <li>Les demandes de publicité et les médias peuvent être vérifiés avant publication.</li>
          <li>En cas de non-conformité (droit d’auteur, contenu interdit, etc.), une nouvelle version peut être demandée.</li>
        </ul>
        <p><strong>4) Responsabilité</strong></p>
        <p>Le service est fourni “en l’état”. Nous mettons tout en œuvre pour assurer la disponibilité, sans garantie d’absence d’interruptions.</p>
      </div>
      <div style="display:flex; justify-content:flex-end; margin-top:12px;">
        <button class="btn btn-secondary" type="button" (click)="conditionsVisible=false">Fermer</button>
      </div>
    </app-modal>

    <app-modal [(visible)]="notificationsVisible" title="Notifications">
      <div style="display:flex; justify-content:flex-end; margin-bottom:10px;" *ngIf="notifications.length > 0">
        <button class="btn btn-danger btn-sm" (click)="clearAllNotifications()">Effacer tout</button>
      </div>
      <div *ngIf="notifications.length === 0" class="text-muted">Aucune notification.</div>
      <div *ngFor="let n of notifications" class="notif-card" [class.read]="!!n.read">
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; flex-wrap:wrap;">
          <div style="font-weight:800;">{{ n.title || 'Notification' }}</div>
          <button *ngIf="!n.read" class="btn btn-secondary btn-sm" (click)="markNotifRead(n)">Marquer comme lu</button>
        </div>
        <div class="text-muted" style="margin-top:6px;">{{ n.body }}</div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;" *ngIf="n.type === 'group_invite' && n.data?.groupId">
          <button class="btn btn-primary btn-sm" (click)="acceptInvite(n)">Accepter</button>
          <button class="btn btn-secondary btn-sm" (click)="openGroup(n.data.groupId)">Voir</button>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;" *ngIf="n.type === 'ad_payment_link' && n.data?.url">
          <a class="btn btn-primary btn-sm" [href]="n.data.url" target="_blank">Payer</a>
        </div>
      </div>
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

    <footer class="site-footer">
      <div class="site-footer-inner">{{ 'footer.copyright' | translate }}</div>
    </footer>
  `,
  styles: [`
    .navbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; background: var(--surface); padding: 12px 24px; gap: 16px; border-bottom: 1px solid var(--border); }
    .nav-toggle { display:none; padding: 10px 12px; border-radius: 14px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); cursor: pointer; }
    .nav-links { display: flex; gap: 8px; flex-wrap: wrap; }
    .toolbar { display: flex; gap: 10px; align-items: center; }
    .user-pseudo { margin-right: 6px; font-weight: 700; }
    .icon-btn { position: relative; display:inline-flex; align-items:center; justify-content:center; width: 40px; height: 40px; border-radius: 14px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); cursor: pointer; }
    .badge { position:absolute; top:-6px; right:-6px; min-width: 18px; height: 18px; padding: 0 6px; border-radius: 999px; background: var(--danger); color: white; font-size: 0.75rem; display:flex; align-items:center; justify-content:center; border: 2px solid var(--surface); }
    .profile-chip { display:inline-flex; align-items:center; gap:8px; padding: 8px 12px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); cursor:pointer; }
    .avatar-mini { width: 28px; height: 28px; border-radius: 10px; object-fit: cover; border: 1px solid var(--border); }
    .notif-card { padding:12px; border:1px solid var(--border); border-radius:12px; background:var(--surface-2); margin-top:10px; }
    .notif-card.read { opacity: 0.65; }
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
    .pw-wrap { position: relative; width: 100%; }
    .pw-wrap input { padding-right: 44px; }
    .pw-toggle {
      position: absolute;
      right: 10px;
      top: 0;
      bottom: 12px; /* match .auth-form input margin-bottom */
      margin: auto 0;
      transform: none;
      width: 32px;
      height: 32px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .pw-toggle:hover { border-color: var(--primary); }
    .pw-toggle svg { width: 16px; height: 16px; fill: currentColor; display: block; }
    .lang-btn { padding: 8px 10px; border-radius: 14px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); cursor: pointer; font-weight: 800; }
    .lang-btn.active { border-color: var(--primary); }
    .site-footer { padding: 18px 0 28px; }
    .site-footer-inner { max-width: 1400px; margin: 0 auto; padding: 0 24px; color: var(--text-muted); text-align: center; font-size: 0.95rem; }
    .terms-line { display:flex; gap:10px; align-items:flex-start; margin: 6px 0 12px; color: var(--text-muted); font-size: 0.92rem; }
    .terms-line input { margin-top: 3px; }
    .link-btn { background: transparent; border: none; padding: 0; color: var(--primary); cursor: pointer; font-weight: 700; }
    .link-btn:hover { text-decoration: underline; }
    .legal-text { color: var(--text); }
    .legal-text p { margin: 0 0 10px; }
    .legal-text ul { margin: 0 0 10px; padding-left: 18px; }
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
export class AppComponent implements OnInit, AfterViewInit {
  lang: 'fr' | 'en' = 'fr';
  isLoggedIn = false;
  isAdmin = false;
  isModerator = false;
  userPseudo = '';
  userAvatar = '';
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
  registerPasswordConfirm = '';
  registerPseudo = '';
  registerFullName = '';
  isRegistering = false;
  showRegisterPassword = false;
  showRegisterPasswordConfirm = false;
  registerAcceptTerms = false;
  termsVisible = false;
  conditionsVisible = false;
  searchQuery = '';
  isAdminOrModerationRoute = false;
  isProfileRoute = false;
  isNavOpen = false;
  unreadMessages = 0;
  unreadNotifications = 0;
  notificationsVisible = false;
  notifications: any[] = [];

  constructor(
    private auth: AuthService,
    private router: Router,
    private searchService: SearchService,
    private api: ApiService,
    private realtime: RealtimeService,
    private translate: TranslateService
  ) {
    // Requirement: French by default; English only after explicit click.
    this.lang = 'fr';
    this.translate.setDefaultLang('fr');
    this.translate.use('fr');
  }

  setLang(lang: 'fr' | 'en') {
    this.lang = lang;
    localStorage.setItem('lang', lang);
    this.translate.use(lang);
  }

  ngOnInit() {
    this.auth.currentUser.subscribe(user => {
      this.isLoggedIn = !!user;
      this.userPseudo = user?.pseudo || '';
      this.isAdmin = user?.role === 'admin';
      this.isModerator = user?.role === 'moderator';
      if (this.isLoggedIn) this.loadAvatar();
    });

    this.realtime.badge$.subscribe(b => {
      this.unreadMessages = b.unreadMessages;
      this.unreadNotifications = b.unreadNotifications;
    });
    this.realtime.notifications$.subscribe(items => this.notifications = items || []);
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.url;
        this.isAdminOrModerationRoute = url.includes('/admin') || url.includes('/profile') || url.includes('/messagerie') || url.includes('/moderation');
        this.isProfileRoute = url.includes('/profile');
        this.isNavOpen = false;
        if (url.includes('/messagerie')) this.realtime.clearMessagesBadge();

        // RSS block is conditionally rendered; reload after navigation
        setTimeout(() => this.loadRssFeeds(), 0);
      }
    });
  }

  ngAfterViewInit() {
    // Ensure the RSS container exists before trying to fill it
    setTimeout(() => this.loadRssFeeds(), 0);
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
    this.registerPseudo = '';
    this.registerFullName = '';
    this.registerEmail = '';
    this.registerPassword = '';
    this.registerPasswordConfirm = '';
    this.showRegisterPassword = false;
    this.showRegisterPasswordConfirm = false;
    this.registerAcceptTerms = false;
    this.registerModalVisible = true;
  }

  openTerms() { this.termsVisible = true; }
  openConditions() { this.conditionsVisible = true; }

  async submitRegister(event?: Event) {
    if (event) event.preventDefault();
    const email = (this.registerEmail || '').trim();
    const password = (this.registerPassword || '').trim();
    const confirmPassword = (this.registerPasswordConfirm || '').trim();
    const pseudo = (this.registerPseudo || '').trim();
    const fullName = (this.registerFullName || '').trim();

    if (!email || !password || !confirmPassword || !pseudo || !fullName) {
      this.showToast('Pseudo, nom complet, email et mots de passe requis');
      return;
    }
    if (password !== confirmPassword) {
      this.showToast('Les mots de passe ne correspondent pas');
      return;
    }
    if (!this.registerAcceptTerms) {
      this.showToast("Veuillez accepter les Termes et Conditions d'utilisation");
      return;
    }

    this.isRegistering = true;
    try {
      await this.auth.register(email, password, { pseudo, fullName });
      this.registerModalVisible = false;
      this.showToast('Compte créé, vérifiez votre email');
      // Retour à la fenêtre de login
      this.authEmail = email;
      this.authPassword = '';
      this.authModalVisible = true;
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

  goProfile() {
    this.router.navigate(['/profile']);
  }

  openMessaging() {
    this.router.navigate(['/messagerie']);
  }

  openNotifications() {
    this.notificationsVisible = true;
    this.realtime.markAllNotificationsSeen();
    this.realtime.refreshNotifications();
  }

  openGroup(groupId: string) {
    this.notificationsVisible = false;
    this.router.navigate(['/groupes', groupId]);
  }

  acceptInvite(n: any) {
    const gid = n?.data?.groupId;
    if (!gid) return;
    this.api.post(`groups/${gid}/invites/accept`, {}).subscribe({
      next: () => {
        this.showToast('Invitation acceptée');
        this.markNotifRead(n);
        this.openGroup(gid);
      },
      error: (err) => this.showToast(err?.error?.error || 'Erreur')
    });
  }

  markNotifRead(n: any) {
    if (!n?._id || n.read) return;
    this.api.post(`notifications/${n._id}/read`, {}).subscribe({
      next: (updated: any) => {
        n.read = true;
        // keep local list but make it "read"
        this.notifications = (this.notifications || []).map(x => x?._id === n._id ? { ...x, read: true } : x);
      },
      error: () => {
        // best effort
        n.read = true;
      }
    });
  }

  clearAllNotifications() {
    if (!confirm('Effacer toutes les notifications ?')) return;
    this.api.delete('notifications/mine').subscribe({
      next: () => {
        this.notifications = [];
        this.realtime.clearNotificationsCache();
        this.showToast('Notifications effacées');
      },
      error: () => this.showToast('Impossible pour le moment')
    });
  }

  loadAvatar() {
    this.api.get('user/profile').subscribe({
      next: (p: any) => {
        this.userAvatar = p?.avatar || '';
      },
      error: () => { this.userAvatar = ''; }
    });
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    setTimeout(() => this.toastMessage = '', 3000);
  }

  onActivate(component: any) {}

  loadRssFeeds() {
    const container = document.getElementById('rssFeedList');
    if (!container) return;
    fetch(`${API_BASE_URL}/rss/items?maxPerFeed=3&maxTotal=8`)
      .then(res => res.json())
      .then((data: any) => {
        const items = Array.isArray(data?.items) ? data.items : [];
        if (!items.length) {
          container.innerHTML = 'Aucun article RSS pour le moment.';
          return;
        }
        container.innerHTML = items.map(item => `
          <div class="rss-item">
            <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
            <div style="font-size:0.8rem; color:var(--muted);">${item.source}${item.category ? ' • ' + item.category : ''} - ${new Date(item.pubDate || Date.now()).toLocaleDateString()}</div>
          </div>
        `).join('');
      })
      .catch(() => {
        container.innerHTML = 'Impossible de charger le flux RSS.';
      });
  }
}