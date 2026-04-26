import { AfterViewInit, Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './core/services/auth.service';
import { SearchService } from './core/services/search.service';
import { ModalComponent } from './shared/components/modal/modal.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { API_BASE_URL } from './core/config/app.config';
import { ApiService } from './core/services/api.service';
import { RealtimeService } from './core/services/realtime.service';
import { SeoService } from './core/services/seo.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CarouselComponent } from './shared/components/carousel/carousel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule, ModalComponent, TranslateModule, CarouselComponent],
  template: `
    <nav class="navbar">
      <a routerLink="/" class="brand-link" style="display:flex; align-items:center; gap:8px; text-decoration:none; color:var(--text);">
        <img src="assets/favicon/favicon-96x96.png" [attr.alt]="'a11y.logo' | translate" style="width:40px;height:40px;border-radius:16px;display:block;border:1px solid rgba(255,255,255,0.12); object-fit: cover;">
        <strong style="font-size:1.4rem;">African Connect</strong>
      </a>
      <button class="nav-toggle" type="button" (click)="toggleNav()" [attr.aria-label]="'a11y.menu' | translate">☰</button>
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
        <button class="lang-btn" type="button" (click)="setLang('fr')" [class.active]="lang==='fr'">🇫🇷 FR</button>
        <button class="lang-btn" type="button" (click)="setLang('en')" [class.active]="lang==='en'">🇬🇧 EN</button>
        <button *ngIf="isLoggedIn" class="icon-btn" type="button" (click)="openNotifications()" [attr.aria-label]="'a11y.notifications' | translate">
          🔔
          <span *ngIf="unreadNotifications > 0" class="badge">{{ unreadNotifications }}</span>
        </button>
        <button *ngIf="isLoggedIn" class="icon-btn" type="button" (click)="openMessaging()" [attr.aria-label]="'a11y.messages' | translate">
          💬
          <span *ngIf="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>
        </button>
        <button *ngIf="isLoggedIn" class="profile-chip" type="button" (click)="goProfile()"
                [attr.title]="'nav.goProfile' | translate" [attr.aria-label]="'nav.goProfile' | translate">
          <img *ngIf="navbarAvatarSrc" [src]="navbarAvatarSrc" class="avatar-mini" [attr.alt]="''">
          <span *ngIf="!navbarAvatarSrc" class="avatar-mini avatar-initials" aria-hidden="true">{{ userInitial }}</span>
          <span class="profile-chip-name">{{ userPseudo || ('nav.profile' | translate) }}</span>
        </button>
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
            <h3>{{ 'rss.title' | translate }}</h3>
            <div id="rssFeedList">{{ 'common.loading' | translate }}</div>
          </div>
        </aside>
      </div>
    </div>

    <app-modal [(visible)]="authModalVisible" [title]="'auth.title' | translate">
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
                  [attr.aria-label]="showRegisterPassword ? ('a11y.hidePassword' | translate) : ('a11y.showPassword' | translate)">
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
                  [attr.aria-label]="showRegisterPasswordConfirm ? ('a11y.hidePassword' | translate) : ('a11y.showPassword' | translate)">
            <svg *ngIf="!showRegisterPasswordConfirm" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5c-5.5 0-10 5.3-10 7s4.5 7 10 7 10-5.3 10-7-4.5-7-10-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5c2.77 0 5 2.24 5 5s-2.23 5-5 5zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
            </svg>
            <svg *ngIf="showRegisterPasswordConfirm" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.1 3.51 3.51 2.1 21.9 20.49 20.49 21.9l-3.02-3.02c-1.57.73-3.35 1.12-5.47 1.12-5.5 0-10-5.3-10-7 0-1.04 1.69-3.28 4.36-4.92L2.1 3.51zm9.9 4.49c2.77 0 5 2.24 5 5 0 .54-.09 1.06-.25 1.55l-1.62-1.62c.05-.19.07-.39.07-.6a3 3 0 0 0-3-3c-.21 0-.41.02-.6.07L10.98 7.8c.49-.16 1.01-.25 1.52-.25zm-7.5 5c.93 1.24 2.97 3.59 5.98 4.43l-1.63-1.63a5 5 0 0 1-1.85-3.8c0-.67.13-1.31.36-1.9-1.23.87-2.21 1.94-2.86 2.9zm8.49 4.99c.33.03.67.01 1.01-.03l-1.73-1.73c.23.09.48.15.72.18zM12 5c2.12 0 3.9.39 5.47 1.12C20.24 7.76 22 9.99 22 11c0 .71-.71 2.01-1.86 3.34l-1.45-1.45c.76-.89 1.24-1.68 1.39-1.89-.93-1.25-3.52-4-8.08-4-.34 0-.67.02-.99.05L9.6 5.64c.76-.1 1.56-.14 2.4-.14z"/>
            </svg>
          </button>
        </div>
        <div class="register-terms-panel">
          <label class="register-terms-check">
            <input type="checkbox" [(ngModel)]="registerAcceptTerms" name="registerAcceptTerms">
            <span class="register-terms-copy">
              {{ 'auth.acceptPrefixCombined' | translate }}
              <strong class="register-terms-doc">{{ 'legal.combinedTitle' | translate }}</strong>.
            </span>
          </label>
          <button type="button" class="btn btn-secondary btn-sm register-read-legal" (click)="openFullLegal()">
            {{ 'auth.readLegal' | translate }}
          </button>
        </div>
        <div class="register-form-actions">
          <button type="submit" class="btn btn-primary register-btn-submit" [disabled]="isRegistering || !registerAcceptTerms">
            {{ isRegistering ? ('common.ellipsis' | translate) : ('auth.create' | translate) }}
          </button>
          <button type="button" class="btn btn-secondary register-btn-cancel" (click)="registerModalVisible = false" [disabled]="isRegistering">{{ 'auth.cancel' | translate }}</button>
        </div>
      </form>
    </app-modal>

    <app-modal [(visible)]="legalModalVisible" [title]="'legal.combinedTitle' | translate">
      <div *ngIf="publishedLegalSafe" class="modal-body legal-scroll" [innerHTML]="publishedLegalSafe"></div>
      <div *ngIf="!publishedLegalSafe" class="legal-text legal-scroll">
        <h3>{{ 'legal.termsTitle' | translate }}</h3>
        <p>{{ 'legal.termsP1' | translate }}</p>
        <p>{{ 'legal.termsP2' | translate }}</p>
        <ul>
          <li>{{ 'legal.termsL1' | translate }}</li>
          <li>{{ 'legal.termsL2' | translate }}</li>
          <li>{{ 'legal.termsL3' | translate }}</li>
          <li>{{ 'legal.termsL4' | translate }}</li>
        </ul>
        <p>{{ 'legal.termsP3' | translate }}</p>
        <h3>{{ 'legal.conditionsTitle' | translate }}</h3>
        <p><strong>{{ 'legal.conditionsS1Title' | translate }}</strong></p>
        <ul>
          <li>{{ 'legal.conditionsS1L1' | translate }}</li>
          <li>{{ 'legal.conditionsS1L2' | translate }}</li>
        </ul>
        <p><strong>{{ 'legal.conditionsS2Title' | translate }}</strong></p>
        <ul>
          <li>{{ 'legal.conditionsS2L1' | translate }}</li>
          <li>{{ 'legal.conditionsS2L2' | translate }}</li>
        </ul>
        <p><strong>{{ 'legal.conditionsS3Title' | translate }}</strong></p>
        <ul>
          <li>{{ 'legal.conditionsS3L1' | translate }}</li>
          <li>{{ 'legal.conditionsS3L2' | translate }}</li>
        </ul>
        <p><strong>{{ 'legal.conditionsS4Title' | translate }}</strong></p>
        <p>{{ 'legal.conditionsS4P1' | translate }}</p>
      </div>
      <div style="display:flex; justify-content:flex-end; margin-top:12px;">
        <button class="btn btn-secondary btn-sm" type="button" (click)="legalModalVisible=false">{{ 'common.close' | translate }}</button>
      </div>
    </app-modal>

    <app-modal [(visible)]="notificationsVisible" [title]="'notifications.title' | translate">
      <div style="display:flex; justify-content:flex-end; margin-bottom:10px;" *ngIf="notifications.length > 0">
        <button class="btn btn-danger btn-sm" (click)="clearAllNotifications()">{{ 'notifications.clearAll' | translate }}</button>
      </div>
      <div *ngIf="notifications.length === 0" class="text-muted">{{ 'notifications.none' | translate }}</div>
      <div *ngFor="let n of notifications" class="notif-card" [class.read]="!!n.read">
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; flex-wrap:wrap;">
          <div style="font-weight:800;">{{ n.title || ('notifications.defaultTitle' | translate) }}</div>
          <button *ngIf="!n.read" class="btn btn-secondary btn-sm" (click)="markNotifRead(n)">{{ 'notifications.markRead' | translate }}</button>
        </div>
        <div class="text-muted" style="margin-top:6px;">{{ n.body }}</div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;" *ngIf="n.type === 'group_invite' && n.data?.groupId">
          <button class="btn btn-primary btn-sm" (click)="acceptInvite(n)">{{ 'common.accept' | translate }}</button>
          <button class="btn btn-secondary btn-sm" (click)="openGroup(n.data.groupId)">{{ 'common.view' | translate }}</button>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;" *ngIf="n.type === 'ad_payment_link' && n.data?.url">
          <a class="btn btn-primary btn-sm" [href]="n.data.url" target="_blank">{{ 'common.pay' | translate }}</a>
        </div>
      </div>
    </app-modal>

    <app-modal [(visible)]="forgotModalVisible" [title]="'auth.forgotTitle' | translate">
      <form (ngSubmit)="submitForgotPassword($event)" class="auth-form">
        <input type="email" [(ngModel)]="forgotEmail" [placeholder]="'auth.email' | translate" name="forgotEmail" required>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button type="submit" class="btn btn-primary" [disabled]="isSendingForgot">
            {{ isSendingForgot ? ('common.sending' | translate) : ('common.send' | translate) }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="forgotModalVisible = false" [disabled]="isSendingForgot">{{ 'common.cancel' | translate }}</button>
        </div>
        <div class="text-muted" style="margin-top:10px; font-size:0.9rem;">
          {{ 'auth.forgotHelp' | translate }}
        </div>
      </form>
    </app-modal>

    <app-modal [(visible)]="onboardingVisible"
               [title]="'auth.onboardingTitle' | translate"
               [dismissOnBackdrop]="false"
               [showClose]="false">
      <form class="auth-form" (ngSubmit)="submitOnboarding($event)">
        <div class="text-muted" style="margin-bottom:12px;">
          {{ 'auth.onboardingSubtitle' | translate }}
        </div>

        <input type="password" [(ngModel)]="onboardingCurrentPassword" name="onboardingCurrentPassword"
               [placeholder]="'auth.currentPassword' | translate" required>
        <input type="text" [(ngModel)]="onboardingPseudo" name="onboardingPseudo"
               [placeholder]="'auth.newPseudo' | translate" required>
        <input type="email" [(ngModel)]="onboardingEmail" name="onboardingEmail"
               [placeholder]="'auth.newEmail' | translate" required>
        <input type="password" [(ngModel)]="onboardingNewPassword" name="onboardingNewPassword"
               [placeholder]="'auth.newPassword' | translate" required>
        <input type="password" [(ngModel)]="onboardingNewPasswordConfirm" name="onboardingNewPasswordConfirm"
               [placeholder]="'auth.newPasswordConfirm' | translate" required>

        <div style="display:flex; justify-content:flex-end; gap:12px; flex-wrap:wrap; margin-top:10px;">
          <button type="submit" class="btn btn-primary" [disabled]="onboardingSubmitting">
            {{ onboardingSubmitting ? ('common.saving' | translate) : ('auth.continue' | translate) }}
          </button>
        </div>
      </form>
    </app-modal>

    <app-modal [(visible)]="contactVisible" [title]="'contact.title' | translate">
      <div class="contact-ads-link" style="margin-bottom:14px;">
        <p class="text-muted" style="margin:0 0 8px; font-size:0.92rem;">{{ 'contact.adsIntro' | translate }}</p>
        <a routerLink="/publicite/demande" class="btn btn-secondary btn-sm" style="display:inline-flex;" (click)="contactVisible=false">{{ 'contact.adsLink' | translate }}</a>
      </div>
      <form class="auth-form" (ngSubmit)="submitContact($event)">
        <input type="email" [(ngModel)]="contactEmail" name="contactEmail" [placeholder]="'contact.emailOptional' | translate">
        <input type="text" [(ngModel)]="contactSubject" name="contactSubject" [placeholder]="'contact.subjectPlaceholder' | translate" required>
        <textarea class="form-control" rows="5" [(ngModel)]="contactMessage" name="contactMessage" [placeholder]="'contact.messagePlaceholder' | translate" required></textarea>
        <div style="display:flex; justify-content:flex-end; gap:12px; flex-wrap:wrap; margin-top:10px;">
          <button type="button" class="btn btn-secondary" (click)="contactVisible=false" [disabled]="contactSending">{{ 'common.cancel' | translate }}</button>
          <button type="submit" class="btn btn-primary" [disabled]="contactSending || !(contactSubject||'').trim() || !(contactMessage||'').trim()">
            {{ contactSending ? ('common.sending' | translate) : ('common.send' | translate) }}
          </button>
        </div>
      </form>
    </app-modal>

    <app-modal [(visible)]="termsGateVisible"
               [title]="'legal.updateRequiredTitle' | translate"
               [dismissOnBackdrop]="false"
               [showClose]="false">
      <div class="auth-form">
        <div class="text-muted" style="margin-bottom:12px;">
          {{ 'legal.updateRequiredText' | translate }}
        </div>
        <div *ngIf="publishedLegalSafe" class="modal-body legal-scroll terms-gate-preview" [innerHTML]="publishedLegalSafe"></div>
        <div *ngIf="!publishedLegalSafe" class="legal-text legal-scroll terms-gate-preview">
          <p class="text-muted">{{ 'legal.readFullHint' | translate }}
            <a routerLink="/legal" style="color:var(--secondary);">{{ 'footer.legal' | translate }}</a>
          </p>
        </div>
        <label class="checkbox-label" style="margin-top:14px;">
          <input type="checkbox" [(ngModel)]="termsGateChecked" name="termsGateChecked">
          <span>{{ 'legal.acceptLabel' | translate }}</span>
        </label>
        <div style="display:flex; justify-content:flex-end; margin-top:12px;">
          <button type="button" class="btn btn-primary" (click)="acceptTermsGate()" [disabled]="!termsGateChecked || termsGateSubmitting">
            {{ termsGateSubmitting ? ('common.saving' | translate) : ('legal.acceptBtn' | translate) }}
          </button>
        </div>
      </div>
    </app-modal>

    <div *ngIf="toastMessage" class="toast">{{ toastMessage }}</div>

    <footer class="site-footer">
      <div class="site-footer-inner" style="display:flex; gap:14px; flex-wrap:wrap; justify-content:center; align-items:center;">
        <button type="button" class="btn btn-link" (click)="openContact()" style="background:transparent; border:none; padding:0; color:var(--secondary); cursor:pointer;">
          {{ 'footer.contact' | translate }}
        </button>
        <a routerLink="/plan-du-site" class="btn btn-link" style="background:transparent; border:none; padding:0; color:var(--secondary); text-decoration:none;">
          {{ 'footer.sitemap' | translate }}
        </a>
        <a routerLink="/legal" class="btn btn-link" style="background:transparent; border:none; padding:0; color:var(--secondary); text-decoration:none;">
          {{ 'footer.legal' | translate }}
        </a>
        <span style="opacity:0.7;">—</span>
        <span>{{ 'footer.copyright' | translate }}</span>
      </div>
    </footer>
  `,
  styles: [`
    .navbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; background: var(--surface); padding: 12px 24px; gap: 16px; border-bottom: 1px solid var(--border); }
    .nav-toggle { display:none; padding: 10px 12px; border-radius: 14px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); cursor: pointer; }
    .nav-links { display: flex; gap: 8px; flex-wrap: wrap; }
    .toolbar { display: flex; gap: 10px; align-items: center; }
    .profile-chip-name { font-weight: 800; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .avatar-initials {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-3);
      color: var(--text);
      font-size: 0.85rem;
      font-weight: 800;
      flex-shrink: 0;
    }
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
    .rss-feed { background: var(--surface); border-radius: 24px; padding: 20px; margin-top: 0; }
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
    .register-terms-panel {
      margin: 14px 0 16px;
      padding: 14px;
      border-radius: 16px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .register-terms-check {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 12px;
      align-items: start;
      margin: 0;
      cursor: pointer;
      color: var(--text-muted);
      font-size: 0.92rem;
      line-height: 1.45;
      width: 100%;
      box-sizing: border-box;
    }
    .register-terms-check input { margin-top: 4px; flex-shrink: 0; }
    .register-terms-copy { min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
    .register-terms-doc { color: var(--text); font-weight: 700; display: inline; }
    .register-read-legal { align-self: stretch; width: 100%; justify-content: center; }
    .register-form-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 4px;
    }
    .register-btn-submit,
    .register-btn-cancel { width: 100%; justify-content: center; min-height: 46px; }
    .link-btn { background: transparent; border: none; padding: 0; color: var(--primary); cursor: pointer; font-weight: 700; }
    .link-btn:hover { text-decoration: underline; }
    .legal-text { color: var(--text); }
    .legal-text p { margin: 0 0 10px; }
    .legal-text ul { margin: 0 0 10px; padding-left: 18px; }
    .legal-scroll { max-height: min(52vh, 420px); overflow-y: auto; margin-top: 8px; padding-right: 4px; }
    .terms-gate-preview { margin-bottom: 12px; }
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

  onboardingVisible = false;
  onboardingSubmitting = false;
  onboardingEmail = '';
  onboardingPseudo = '';
  onboardingCurrentPassword = '';
  onboardingNewPassword = '';
  onboardingNewPasswordConfirm = '';

  contactVisible = false;
  contactSending = false;
  contactEmail = '';
  contactSubject = '';
  contactMessage = '';

  termsVersion = 1;
  termsGateVisible = false;
  termsGateChecked = false;
  termsGateSubmitting = false;
  private lastUser: any = null;
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
  legalModalVisible = false;
  publishedLegalSafe: SafeHtml | null = null;
  private publicTermsHtmlFr = '';
  private publicTermsHtmlEn = '';
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
    private translate: TranslateService,
    private sanitizer: DomSanitizer,
    private seo: SeoService
  ) {
    // Requirement: French by default; English only after explicit click.
    this.lang = 'fr';
    this.translate.setDefaultLang('fr');
    this.translate.use('fr');
    // Ensure translations are loaded even if the HTTP loader fails behind Nginx caching/rewrite.
    this.ensureTranslationsLoaded('fr');
  }

  setLang(lang: 'fr' | 'en') {
    this.lang = lang;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
    }
    localStorage.setItem('lang', lang);
    this.ensureTranslationsLoaded(lang);
    this.translate.use(lang);
    setTimeout(() => this.refreshPublishedLegalSafe(), 0);
  }

  private loadedLangs = new Set<string>();
  private async ensureTranslationsLoaded(lang: 'fr' | 'en') {
    if (this.loadedLangs.has(lang)) return;
    try {
      const res = await fetch(`/assets/i18n/${lang}.json`, { cache: 'no-store' });
      const txt = await res.text();
      const json = JSON.parse(txt);
      this.translate.setTranslation(lang, json, true);
      this.loadedLangs.add(lang);
    } catch {
      // Minimal fallback so UI doesn't show keys
      const fallback = lang === 'en'
        ? {
            nav: { forum: 'Forum', marketplace: 'Marketplace', jobs: 'Jobs', solutions: 'Solutions', solidarity: 'Solidarity', events: 'Events', groups: 'Groups', profile: 'Profile', login: 'Login', logout: 'Logout' },
            search: { placeholder: 'Search the whole site...' },
            auth: { email: 'Email', password: 'Password', login: 'Login', createAccount: 'Create account', forgot: 'Forgot password?', registerTitle: 'Create account', pseudo: 'Username', fullName: 'Full name', confirmPassword: 'Confirm password', create: 'Create', cancel: 'Cancel', acceptPrefix: 'I have read and accept the', terms: 'Terms', and: 'and the', conditions: 'Terms of use' },
            footer: { copyright: 'Copyright @ Adéola 2026 CIA' }
          }
        : {
            nav: { forum: 'Forum', marketplace: 'Ventes/Achats', jobs: 'Emploi', solutions: 'Solutions', solidarity: 'Solidarité', events: 'Événements', groups: 'Groupes', profile: 'Profil', login: 'Connexion', logout: 'Déconnexion' },
            search: { placeholder: 'Rechercher sur tout le site...' },
            auth: { email: 'Email', password: 'Mot de passe', login: 'Se connecter', createAccount: 'Créer un compte', forgot: 'Mot de passe oublié ?', registerTitle: 'Créer un compte', pseudo: 'Pseudo', fullName: 'Nom complet', confirmPassword: 'Confirmer le mot de passe', create: 'Créer', cancel: 'Annuler', acceptPrefix: 'J’ai lu et j’accepte les', terms: 'Termes', and: 'et les', conditions: "Conditions d'utilisation" },
            footer: { copyright: 'Copyright @ Adéola 2026 CIA' }
          };
      this.translate.setTranslation(lang, fallback as any, true);
      this.loadedLangs.add(lang);
    }
  }

  ngOnInit() {
    this.seo.init();
    this.translate.onLangChange.subscribe(() => this.refreshPublishedLegalSafe());
    this.loadTermsVersion();
    this.auth.profileBarRefresh.subscribe(() => {
      if (this.isLoggedIn) this.loadAvatar();
    });
    this.auth.currentUser.subscribe(user => {
      this.lastUser = user;
      this.isLoggedIn = !!user;
      this.userPseudo = user?.pseudo || '';
      this.isAdmin = user?.role === 'admin';
      this.isModerator = user?.role === 'moderator';
      if (this.isLoggedIn) this.loadAvatar();

      const mustChange = !!(user?.mustChangePassword || user?.mustChangePseudo || user?.mustChangeEmail);
      if (this.isLoggedIn && mustChange) {
        this.openOnboarding();
      }

      // Terms/conditions gate for non-admins
      this.maybeOpenTermsGate();
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
        if (this.isLoggedIn && !this.isAdmin) this.loadTermsVersion();

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

  openFullLegal() {
    this.refreshPublishedLegalSafe();
    this.legalModalVisible = true;
  }

  private refreshPublishedLegalSafe() {
    const lang = this.translate.currentLang || 'fr';
    const fr = String(this.publicTermsHtmlFr || '').trim();
    const en = String(this.publicTermsHtmlEn || '').trim();
    const html = lang === 'en' ? (en || fr) : (fr || en);
    this.publishedLegalSafe = html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
  }

  async submitRegister(event?: Event) {
    if (event) event.preventDefault();
    const email = (this.registerEmail || '').trim();
    const password = (this.registerPassword || '').trim();
    const confirmPassword = (this.registerPasswordConfirm || '').trim();
    const pseudo = (this.registerPseudo || '').trim();
    const fullName = (this.registerFullName || '').trim();

    if (!email || !password || !confirmPassword || !pseudo || !fullName) {
      this.showToast(this.translate.instant('auth.toastRegisterFieldsRequired'));
      return;
    }
    if (password !== confirmPassword) {
      this.showToast(this.translate.instant('auth.toastPasswordMismatch'));
      return;
    }
    if (!this.registerAcceptTerms) {
      this.showToast(this.translate.instant('auth.acceptRequired'));
      return;
    }

    this.isRegistering = true;
    try {
      await this.auth.register(email, password, { pseudo, fullName });
      this.registerModalVisible = false;
      this.showToast(this.translate.instant('auth.toastAccountCreated'));
      // Retour à la fenêtre de login
      this.authEmail = email;
      this.authPassword = '';
      this.authModalVisible = true;
    } catch (e) {
      console.error('Register error:', e);
      this.showToast(this.translate.instant('auth.toastRegisterErr', { detail: (e as any)?.message || String(e) }));
    } finally {
      this.isRegistering = false;
    }
  }

  submitForgotPassword(event?: Event) {
    if (event) event.preventDefault();
    const email = (this.forgotEmail || '').trim();
    if (!email) {
      this.showToast(this.translate.instant('auth.toastEmailRequired'));
      return;
    }
    this.isSendingForgot = true;
    this.api.post('auth/forgot-password', { email }, false).subscribe({
      next: () => {
        this.isSendingForgot = false;
        this.forgotModalVisible = false;
        this.showToast(this.translate.instant('auth.toastForgotSent'));
      },
      error: (err) => {
        console.error('Forgot password error:', err);
        this.isSendingForgot = false;
        // Ne pas révéler si l’email existe ou non
        this.forgotModalVisible = false;
        this.showToast(this.translate.instant('auth.toastForgotSent'));
      }
    });
  }

  async login(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    console.log('Login attempt:', this.authEmail, this.authPassword);
    if (!this.authEmail || !this.authPassword) {
      this.showToast(this.translate.instant('auth.toastLoginFields'));
      return;
    }
    try {
      await this.auth.login(this.authEmail, this.authPassword);
      this.authModalVisible = false;
      this.showToast(this.translate.instant('auth.toastLoggedIn'));
    } catch(e) {
      console.error('Login error:', e);
      this.showToast(this.translate.instant('auth.toastLoginError', { detail: (e as any)?.message || String(e) }));
    }
  }

  private openOnboarding() {
    if (this.onboardingVisible) return;
    this.onboardingVisible = true;
    // Prefill from profile (allowed by backend while onboarding is pending)
    this.api.get('user/profile').subscribe({
      next: (p: any) => {
        this.onboardingEmail = String(p?.email || '').trim();
        this.onboardingPseudo = String(p?.pseudo || '').trim();
      },
      error: () => {}
    });
  }

  submitOnboarding(event?: Event) {
    if (event) event.preventDefault();
    if (String(this.onboardingNewPassword || '') !== String(this.onboardingNewPasswordConfirm || '')) {
      this.showToast(this.translate.instant('auth.toastPasswordMismatch'));
      return;
    }
    const payload = {
      currentPassword: String(this.onboardingCurrentPassword || '').trim(),
      newPassword: String(this.onboardingNewPassword || '').trim(),
      newEmail: String(this.onboardingEmail || '').trim(),
      newPseudo: String(this.onboardingPseudo || '').trim()
    };
    if (!payload.currentPassword || !payload.newPassword || !payload.newEmail || !payload.newPseudo) return;

    this.onboardingSubmitting = true;
    this.api.post('user/complete-onboarding', payload).subscribe({
      next: (res: any) => {
        const token = String(res?.token || '');
        if (token) {
          localStorage.setItem('token', token);
          try { this.auth.applyToken(token); } catch {}
        }
        this.onboardingVisible = false;
        this.onboardingCurrentPassword = '';
        this.onboardingNewPassword = '';
        this.onboardingNewPasswordConfirm = '';
        this.showToast(this.translate.instant('auth.onboardingDone'));
        this.onboardingSubmitting = false;
      },
      error: (err) => {
        console.error(err);
        this.onboardingSubmitting = false;
        this.showToast(err?.error?.error || this.translate.instant('errors.generic'));
      }
    });
  }

  openContact() {
    this.contactVisible = true;
    // best-effort prefill
    if (this.isLoggedIn && !this.contactEmail) {
      this.api.get('user/profile').subscribe({
        next: (p: any) => this.contactEmail = String(p?.email || '').trim(),
        error: () => {}
      });
    }
  }

  submitContact(event?: Event) {
    if (event) event.preventDefault();
    const payload = {
      email: String(this.contactEmail || '').trim(),
      subject: String(this.contactSubject || '').trim(),
      content: String(this.contactMessage || '').trim()
    };
    if (!payload.subject || !payload.content) return;
    this.contactSending = true;
    this.api.post('contact', payload, this.isLoggedIn).subscribe({
      next: () => {
        this.contactSending = false;
        this.contactVisible = false;
        this.contactSubject = '';
        this.contactMessage = '';
        this.showToast(this.translate.instant('contact.sentOk'));
      },
      error: (err) => {
        console.error(err);
        this.contactSending = false;
        this.showToast(err?.error?.error || this.translate.instant('errors.contactFailed'));
      }
    });
  }

  private loadTermsVersion() {
    this.api.get('site-settings/public', false).subscribe({
      next: (res: any) => {
        this.termsVersion = Number(res?.termsVersion || 1);
        this.publicTermsHtmlFr = String(res?.termsHtmlFr || '');
        this.publicTermsHtmlEn = String(res?.termsHtmlEn || '');
        this.refreshPublishedLegalSafe();
        this.maybeOpenTermsGate();
      },
      error: () => {
        this.termsVersion = 1;
        this.publicTermsHtmlFr = '';
        this.publicTermsHtmlEn = '';
        this.refreshPublishedLegalSafe();
      }
    });
  }

  private maybeOpenTermsGate() {
    const user = this.lastUser;
    if (!user) return;
    if (user?.role === 'admin') return;
    const accepted = Number(user?.termsAcceptedVersion || 0);
    if (accepted < Number(this.termsVersion || 1)) {
      this.openTermsGate();
    }
  }

  private openTermsGate() {
    if (this.termsGateVisible) return;
    this.termsGateChecked = false;
    this.termsGateVisible = true;
  }

  acceptTermsGate() {
    if (!this.termsGateChecked) return;
    const version = Number(this.termsVersion || 1);
    this.termsGateSubmitting = true;
    this.api.post('user/accept-terms', { version }).subscribe({
      next: (res: any) => {
        const token = String(res?.token || '');
        if (token) {
          localStorage.setItem('token', token);
          try { this.auth.applyToken(token); } catch {}
        }
        this.termsGateSubmitting = false;
        this.termsGateVisible = false;
      },
      error: (err) => {
        console.error(err);
        this.termsGateSubmitting = false;
        this.showToast(err?.error?.error || this.translate.instant('errors.generic'));
      }
    });
  }

  // register() replaced by popup flow

  async logout() {
    await this.auth.logout();
    this.showToast(this.translate.instant('auth.toastLoggedOut'));
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
        this.showToast(this.translate.instant('auth.toastInviteAccepted'));
        this.markNotifRead(n);
        this.openGroup(gid);
      },
      error: (err) => this.showToast(err?.error?.error || this.translate.instant('errors.generic'))
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
    if (!confirm(this.translate.instant('notifications.clearAllConfirm'))) return;
    this.api.delete('notifications/mine').subscribe({
      next: () => {
        this.notifications = [];
        this.realtime.clearNotificationsCache();
        this.showToast(this.translate.instant('notifications.cleared'));
      },
      error: () => this.showToast(this.translate.instant('common.notAvailableNow'))
    });
  }

  get navbarAvatarSrc(): string {
    return this.normalizeAvatarUrl(this.userAvatar);
  }

  get userInitial(): string {
    const p = (this.userPseudo || '').trim();
    return p ? p.charAt(0).toUpperCase() : '?';
  }

  private normalizeAvatarUrl(url?: string): string {
    if (!url) return '';
    const u = String(url);
    if (u.startsWith('/uploads/')) return `${API_BASE_URL.replace(/\/api$/, '')}${u}`;
    return u;
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
          container.innerHTML = this.translate.instant('rss.empty');
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
        container.innerHTML = this.translate.instant('rss.loadError');
      });
  }
}