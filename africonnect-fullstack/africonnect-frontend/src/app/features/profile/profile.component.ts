import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { API_BASE_URL } from '../../core/config/app.config';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { CityAutocompleteComponent } from '../../shared/components/city-autocomplete/city-autocomplete.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CityAutocompleteComponent, TranslateModule],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <h1>{{ 'profile.title' | translate }}</h1>
        <div class="profile-actions" role="toolbar" [attr.aria-label]="'profile.title' | translate">
          <button type="button" class="btn btn-secondary" (click)="openMessaging()">💬 {{ 'profile.messaging' | translate }}</button>
          <button type="button" class="btn btn-secondary" *ngIf="isModerator || isAdmin" (click)="openModeration()">🛡️ {{ 'profile.moderation' | translate }}</button>
          <button type="button" class="btn btn-secondary" *ngIf="isAdmin" (click)="openAdminUsers()">👥 {{ 'profile.users' | translate }}</button>
          <button type="button" class="btn btn-secondary" *ngIf="isAdmin" (click)="openAdminAds()">📺 {{ 'profile.adminAds' | translate }}</button>
          <button type="button" class="btn btn-secondary" *ngIf="isAdmin" (click)="openAdminAdRequests()">📣 {{ 'profile.adminAdRequests' | translate }}</button>
          <button type="button" class="btn btn-secondary" *ngIf="isAdmin" (click)="openAdminRss()">📰 {{ 'profile.rss' | translate }}</button>
          <button type="button" class="btn btn-secondary" *ngIf="isAdmin" (click)="openAdminLegal()">📜 {{ 'profile.adminLegal' | translate }}</button>
        </div>
      </div>
      
      <div class="profile-content">
        <div class="profile-sidebar">
          <div class="avatar-section">
            <img [src]="displayAvatarUrl(selectedAvatar) || selectedAvatar" class="avatar-large" [alt]="profile.pseudo || 'Avatar'">

            <!-- Mode vue -->
            <div *ngIf="!isEditing" style="margin-top: 12px; width:100%;">
              <div class="profile-summary">
                <div class="summary-name">
                  {{ profile.pseudo || '—' }}
                  <span *ngIf="profile.verified" class="verified-badge" [title]="'profile.verifiedBadge' | translate">✓</span>
                </div>
                <div class="summary-meta" *ngIf="profile.fullName">👤 {{ profile.fullName }}</div>
                <div class="summary-meta" *ngIf="profile.city">📍 {{ profile.city }}</div>
                <div class="summary-meta" *ngIf="profile.origin">🌍 {{ profile.origin }}</div>
              </div>
              <div style="display:flex; gap:10px; margin-top: 12px;">
                <button class="btn btn-primary" (click)="startEdit()">✏️ {{ 'profile.edit' | translate }}</button>
                <button class="btn btn-danger" (click)="deleteAccount()">🗑️ {{ 'profile.deleteAccount' | translate }}</button>
              </div>
            </div>

            <!-- Mode édition -->
            <div *ngIf="isEditing">
              <div class="avatar-picker-wrap">
                <div class="avatar-grid">
                  <img *ngFor="let av of avatars"
                       [src]="av"
                       class="avatar-thumb"
                       [class.selected]="selectedAvatar === av"
                       (click)="selectAvatar(av)">
                </div>
                <div class="avatar-upload-aside">
                  <label class="btn btn-secondary btn-sm avatar-upload-label" [class.disabled]="isUploadingAvatar">
                    {{ isUploadingAvatar ? ('common.ellipsis' | translate) : ('📷 ' + ('profile.uploadPhoto' | translate)) }}
                    <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" (change)="onCustomAvatarUpload($event)" [disabled]="isUploadingAvatar">
                  </label>
                  <p class="text-muted avatar-upload-hint">{{ 'profile.uploadPhotoHint' | translate }}</p>
                </div>
              </div>
              <div style="display:flex; gap:10px; width:100%; margin-top: 12px; flex-wrap:wrap;">
                <button class="btn btn-primary" (click)="saveProfile()" [disabled]="isSaving">
                  {{ isSaving ? ('profile.saveProgress' | translate) : ('💾 ' + ('profile.saveButton' | translate)) }}
                </button>
                <button class="btn btn-secondary" (click)="cancelEdit()" [disabled]="isSaving">{{ 'common.cancel' | translate }}</button>
              </div>
            </div>
          </div>
          
          <div class="profile-stats">
            <h3>{{ 'profile.stats' | translate }}</h3>
            <div class="stat-item">
              <div class="stat-label">{{ 'profile.posts' | translate }}</div>
              <div class="stat-value">{{ myPosts.length }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">{{ 'profile.saved' | translate }}</div>
              <div class="stat-value">{{ savedPosts.length }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">{{ 'profile.memberSince' | translate }}</div>
              <div class="stat-value">{{ profile.createdAt | date:'MM/yyyy' }}</div>
            </div>
          </div>
        </div>
        
        <div class="profile-main">
          <div class="profile-form" *ngIf="isEditing">
            <h2>{{ 'profile.personalInfo' | translate }}</h2>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ 'profile.email' | translate }}</label>
                <input type="email" [(ngModel)]="profile.email" class="form-control" disabled>
                <div class="text-muted" style="font-size: 0.875rem; margin-top: 4px;">{{ 'profile.emailLocked' | translate }}</div>
              </div>
              <div class="form-group">
                <label class="form-label">{{ 'profile.pseudo' | translate }}</label>
                <input type="text" [(ngModel)]="profile.pseudo" class="form-control" [placeholder]="'profile.pseudoPlaceholder' | translate" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">{{ 'profile.fullName' | translate }}</label>
              <input type="text" [(ngModel)]="profile.fullName" class="form-control" [placeholder]="'profile.fullNamePlaceholder' | translate">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ 'profile.city' | translate }}</label>
                <app-city-autocomplete [(ngModel)]="profile.city" name="city" [placeholder]="'profile.cityPlaceholder' | translate"></app-city-autocomplete>
              </div>
              <div class="form-group">
                <label class="form-label">{{ 'profile.origin' | translate }}</label>
                <input type="text" [(ngModel)]="profile.origin" class="form-control" [placeholder]="'profile.originPlaceholder' | translate">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">{{ 'profile.passions' | translate }}</label>
              <textarea [(ngModel)]="profile.passions" class="form-control" rows="3" [placeholder]="'profile.passionsPlaceholder' | translate"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">{{ 'profile.bio' | translate }}</label>
              <textarea [(ngModel)]="profile.bio" class="form-control" rows="4" [placeholder]="'profile.bioPlaceholder' | translate"></textarea>
            </div>
          </div>
          
          <div class="profile-sections">
            <div class="section">
              <h3>{{ 'profile.recentPosts' | translate }}</h3>
              <div *ngIf="myPosts.length === 0" class="empty-section">
                <p>{{ 'profile.noPosts' | translate }}</p>
                <button class="btn btn-primary" (click)="publishOnForum()">{{ 'profile.publishForum' | translate }}</button>
              </div>
              <div *ngFor="let post of myPosts" class="post-card post-card-compact">
                <div class="post-card-compact-row">
                  <span class="pub-type-badge">{{ postTypeLabel(post._type) }}</span>
                  <h4 class="post-card-compact-title">{{ post.title || post.subject || ('searchPage.untitled' | translate) }}</h4>
                  <span class="post-date post-card-compact-date">{{ post.createdAt | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="post-actions post-actions-compact">
                  <button type="button" class="btn btn-secondary btn-sm" (click)="openPost(post)">{{ 'profile.view' | translate }}</button>
                  <button type="button" class="btn btn-secondary btn-sm" (click)="toggleSave(post)">
                    {{ isSaved(post?._id) ? ('profile.remove' | translate) : ('profile.savePost' | translate) }}
                  </button>
                  <button type="button" class="btn btn-danger btn-sm" (click)="deletePost(post._id)">{{ 'common.delete' | translate }}</button>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h3>{{ 'profile.savedPosts' | translate }}</h3>
              <div *ngIf="savedPosts.length === 0" class="empty-section">
                <p>{{ 'profile.noSaved' | translate }}</p>
              </div>
              <div *ngIf="savedPosts.length > 0" class="profile-saved-toolbar">
                <div class="form-group profile-saved-search">
                  <input type="search" class="form-control" [(ngModel)]="savedSearchQuery" name="savedSearch"
                         [placeholder]="'profile.savedSearchPlaceholder' | translate">
                </div>
                <div class="profile-saved-filters">
                  <div class="form-group">
                    <label class="form-label">{{ 'profile.savedFilterLabel' | translate }}</label>
                    <select class="form-control" [(ngModel)]="savedSectionFilter" name="savedSection">
                      <option *ngFor="let opt of savedSectionOptions" [value]="opt.value">{{ opt.labelKey | translate }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">{{ 'profile.savedSortLabel' | translate }}</label>
                    <select class="form-control" [(ngModel)]="savedSort" name="savedSort">
                      <option *ngFor="let opt of savedSortOptions" [value]="opt.value">{{ opt.labelKey | translate }}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div *ngIf="savedPosts.length > 0 && filteredSavedPosts.length === 0" class="empty-section">
                <p>{{ 'searchPage.noResults' | translate }}</p>
              </div>
              <div *ngFor="let saved of filteredSavedPosts" class="post-card post-card-compact">
                <div class="post-card-compact-row">
                  <span class="pub-type-badge">{{ postTypeLabel(saved._type) }}</span>
                  <h4 class="post-card-compact-title" [innerHTML]="highlightSavedTitle(saved)"></h4>
                  <span class="post-date post-card-compact-date">{{ saved.createdAt | date:'dd/MM/yyyy' }}</span>
                  <button type="button" class="btn btn-secondary btn-sm" (click)="unsave(saved._id)">{{ 'profile.remove' | translate }}</button>
                </div>
              </div>
            </div>

            <div class="section">
              <h3>{{ 'profile.adRequests' | translate }}</h3>
              <div *ngIf="adRequests.length === 0" class="empty-section">
                <p>{{ 'profile.noAdRequests' | translate }}</p>
                <p class="text-muted" style="font-size:0.92rem; margin-top:8px;">{{ 'profile.adsViaContact' | translate }}</p>
              </div>
              <div *ngFor="let r of adRequests" class="post-card">
                <div class="post-header">
                  <h4 style="margin:0;">
                    {{ r.option === 'create_and_publish' ? ('profile.createAndPublish' | translate) : ('profile.publishOnly' | translate) }}
                  </h4>
                  <span class="post-date">{{ r.createdAt | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="text-muted" style="margin-top:6px;">
                  {{ 'profile.status' | translate }}: <strong>{{ r.status }}</strong>
                </div>
                <div class="post-content" style="margin-top:6px;">{{ (r.message || '').slice(0, 150) }}{{ (r.message || '').length > 150 ? '...' : '' }}</div>

                <div *ngIf="r.adminMessage" style="margin-top:8px; padding:10px; border-radius:12px; border:1px solid rgba(245,101,101,.25); background: rgba(245,101,101,.08); white-space:pre-wrap;">
                  <strong>{{ 'profile.adminMessage' | translate }}</strong>: {{ r.adminMessage }}
                </div>

                <div class="post-actions" style="align-items:center;">
                  <a *ngIf="r.mediaUrl" class="btn btn-secondary btn-sm" [href]="r.mediaUrl" target="_blank">{{ 'profile.viewMedia' | translate }}</a>

                  <label *ngIf="r.status === 'needs_resubmission'" class="btn btn-primary btn-sm" style="cursor:pointer;">
                    {{ 'profile.resendMedia' | translate }}
                    <input type="file" style="display:none;" accept="image/*,video/*" (change)="onResubmitSelected($event, r)">
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <app-modal [(visible)]="postModalVisible" [title]="'profile.posts' | translate">
      <div *ngIf="selectedPost">
        <h3 style="margin-top:0;">{{ selectedPost.title || selectedPost.subject || 'Sans titre' }}</h3>
        <div class="text-muted" style="margin-top:6px;">
          {{ selectedPost.createdAt | date:'dd/MM/yyyy HH:mm' }}
        </div>

        <div *ngIf="getImages(selectedPost).length" class="thumb-grid" style="margin-top:12px;">
          <img *ngFor="let url of getImages(selectedPost)" class="thumb" [src]="url" alt="Image" (click)="openPreview(url)">
        </div>

        <div class="modal-body" style="margin-top:12px;" [innerHTML]="selectedPost.content || selectedPost.desc || ''"></div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:14px; flex-wrap:wrap;">
          <button class="btn btn-secondary" (click)="postModalVisible=false">{{ 'common.close' | translate }}</button>
          <button class="btn btn-primary" (click)="goToOriginal(selectedPost)">{{ 'profile.open' | translate }}</button>
        </div>
      </div>
    </app-modal>

    <app-modal [(visible)]="previewVisible" [title]="'common.preview' | translate">
      <img *ngIf="previewUrl" [src]="previewUrl" [alt]="'common.preview' | translate" style="width:100%; max-height: 70vh; object-fit: contain; border-radius: 12px;">
    </app-modal>
  `,
  styles: [`
    .avatar-picker-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: flex-start;
      margin-top: 8px;
    }
    .avatar-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      flex: 1 1 200px;
      max-width: 100%;
    }
    .avatar-upload-aside {
      flex: 0 1 220px;
      min-width: 180px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .avatar-upload-label {
      cursor: pointer;
      margin: 0;
      text-align: center;
      justify-content: center;
    }
    .avatar-upload-label input { display: none; }
    .avatar-upload-label.disabled { opacity: 0.6; pointer-events: none; }
    .avatar-upload-hint { font-size: 0.82rem; margin: 0; line-height: 1.35; }
    @media (max-width: 600px) {
      .avatar-upload-aside { flex: 1 1 100%; min-width: 0; }
    }
    .profile-saved-toolbar { display: flex; flex-direction: column; gap: 10px; margin-bottom: 4px; }
    .profile-saved-filters { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media (max-width: 600px) {
      .profile-saved-filters { grid-template-columns: 1fr; }
    }
    :host ::ng-deep mark.search-hit {
      background: rgba(255, 220, 100, 0.45);
      padding: 0 2px;
      border-radius: 2px;
    }
  `]
})
export class ProfileComponent implements OnInit {
  avatars = [
    'assets/avatars/1.png', 'assets/avatars/2.png', 'assets/avatars/3.png',
    'assets/avatars/4.png', 'assets/avatars/5.png', 'assets/avatars/6.png',
    'assets/avatars/7.png', 'assets/avatars/8.png', 'assets/avatars/9.png',
    'assets/avatars/10.png'
  ];
  selectedAvatar = this.avatars[0];
  profile: any = { 
    email: '', 
    pseudo: '', 
    fullName: '', 
    city: '', 
    origin: '', 
    passions: '', 
    bio: '',
    avatar: '',
    createdAt: new Date()
  };
  myPosts: any[] = [];
  savedPosts: any[] = [];
  savedSearchQuery = '';
  /** '' = toutes les rubriques; sinon valeur `_type` (forum, marketplace, …) */
  savedSectionFilter = '';
  savedSort: 'date_desc' | 'date_asc' | 'relevance' = 'date_desc';
  readonly savedSectionOptions: { value: string; labelKey: string }[] = [
    { value: '', labelKey: 'profile.savedFilterAll' },
    { value: 'forum', labelKey: 'nav.forum' },
    { value: 'marketplace', labelKey: 'nav.marketplace' },
    { value: 'jobs', labelKey: 'nav.jobs' },
    { value: 'solutions', labelKey: 'nav.solutions' },
    { value: 'solidarity', labelKey: 'nav.solidarity' },
    { value: 'events', labelKey: 'nav.events' },
    { value: 'groups', labelKey: 'nav.groups' }
  ];
  readonly savedSortOptions: { value: 'date_desc' | 'date_asc' | 'relevance'; labelKey: string }[] = [
    { value: 'date_desc', labelKey: 'profile.savedSortDateDesc' },
    { value: 'date_asc', labelKey: 'profile.savedSortDateAsc' },
    { value: 'relevance', labelKey: 'profile.savedSortRelevance' }
  ];
  savedIds = new Set<string>();
  adRequests: any[] = [];
  isSaving = false;
  isUploadingAvatar = false;
  isEditing = false;
  isAdmin = false;
  isModerator = false;
  postModalVisible = false;
  selectedPost: any = null;
  previewVisible = false;
  previewUrl = '';
  private profileSnapshot: any = null;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private translate: TranslateService,
    private sanitizer: DomSanitizer
  ) {}

  publishOnForum() {
    this.router.navigate(['/forum'], { queryParams: { new: 1 } });
  }

  openPost(post: any) {
    this.selectedPost = post;
    this.postModalVisible = true;
  }

  getImages(post: any): string[] {
    const urls = Array.isArray(post?.imageUrls) && post.imageUrls.length
      ? post.imageUrls
      : (post?.imageUrl ? [post.imageUrl] : []);
    return urls
      .filter(Boolean)
      .map((u: string) => {
        const s = String(u || '');
        if (typeof window !== 'undefined' && window.location?.protocol === 'https:' && s.startsWith('http://')) {
          return s.replace(/^http:\/\//, 'https://');
        }
        return s;
      })
      .slice(0, 3);
  }

  openPreview(url: string) {
    this.previewUrl = url;
    this.previewVisible = true;
  }

  get filteredSavedPosts(): any[] {
    const section = (this.savedSectionFilter || '').trim().toLowerCase();
    const q = (this.savedSearchQuery || '').trim().toLowerCase();

    let list = [...this.savedPosts];
    if (section) {
      list = list.filter(p => String(p?._type || '').toLowerCase() === section);
    }
    if (q) {
      list = list.filter(p => {
        const title = String(p.title || p.subject || '').toLowerCase();
        const body = this.stripHtml(String(p.content || p.desc || '')).toLowerCase();
        return title.includes(q) || body.includes(q);
      });
    }

    const dateMs = (p: any) => {
      const t = p?.createdAt;
      if (t == null) return 0;
      const d = t instanceof Date ? t : new Date(t);
      const ms = d.getTime();
      return Number.isNaN(ms) ? 0 : ms;
    };

    if (this.savedSort === 'relevance' && q) {
      const score = (p: any) => {
        const title = String(p.title || p.subject || '');
        const body = this.stripHtml(String(p.content || p.desc || ''));
        const tl = title.toLowerCase();
        const bl = body.toLowerCase();
        let s = 0;
        if (tl === q) s += 10;
        else if (tl.startsWith(q)) s += 5;
        if (tl.includes(q)) s += 3;
        if (bl.includes(q)) s += 1;
        return s;
      };
      list.sort((a, b) => {
        const diff = score(b) - score(a);
        if (diff !== 0) return diff;
        return dateMs(b) - dateMs(a);
      });
    } else if (this.savedSort === 'date_asc') {
      list.sort((a, b) => dateMs(a) - dateMs(b));
    } else {
      list.sort((a, b) => dateMs(b) - dateMs(a));
    }

    return list;
  }

  private escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private escapeHtml(s: string): string {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  highlightSavedTitle(p: any): SafeHtml {
    const untitled = this.translate.instant('searchPage.untitled');
    const raw = String(p?.title || p?.subject || untitled);
    const q = (this.savedSearchQuery || '').trim();
    if (!q) {
      return this.sanitizer.bypassSecurityTrustHtml(this.escapeHtml(raw));
    }
    const esc = this.escapeHtml(raw);
    try {
      const re = new RegExp('(' + this.escapeRegExp(q) + ')', 'gi');
      const html = esc.replace(re, '<mark class="search-hit">$1</mark>');
      return this.sanitizer.bypassSecurityTrustHtml(html);
    } catch {
      return this.sanitizer.bypassSecurityTrustHtml(esc);
    }
  }

  stripHtml(html: string): string {
    return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  postTypeLabel(type: string | undefined): string {
    const keyMap: Record<string, string> = {
      forum: 'nav.forum',
      marketplace: 'nav.marketplace',
      jobs: 'nav.jobs',
      solutions: 'nav.solutions',
      solidarity: 'nav.solidarity',
      events: 'nav.events',
      groups: 'nav.groups'
    };
    const k = keyMap[String(type || '').toLowerCase()];
    return k ? this.translate.instant(k) : String(type || '');
  }

  goToOriginal(post: any) {
    this.postModalVisible = false;
    const t = String(post?._type || '').toLowerCase();
    const map: any = {
      forum: '/forum',
      marketplace: '/marketplace',
      jobs: '/emploi',
      solutions: '/solutions',
      solidarity: '/solidarite',
      events: '/evenements',
      groups: '/groupes'
    };
    this.router.navigate([map[t] || '/forum']);
  }

  ngOnInit() {
    this.loadProfile();
    this.loadMyPosts();
    this.loadSavedPosts();
    this.loadAdRequests();

    this.auth.currentUser.subscribe(user => {
      this.isAdmin = user?.role === 'admin';
      this.isModerator = user?.role === 'moderator';
    });
  }

  loadProfile() {
    this.api.get('user/profile').subscribe({
      next: (data: any) => {
        this.profile = data;
        this.selectedAvatar = data.avatar || this.avatars[0];
        this.profileSnapshot = { ...this.profile };
        // Cohérence UI avec le rôle côté API (en plus du JWT)
        const r = String(data?.role || '').toLowerCase();
        if (r === 'admin' || r === 'moderator') {
          this.isAdmin = r === 'admin';
          this.isModerator = r === 'moderator' || r === 'admin';
        }
        // Après chargement: afficher le profil (pas le formulaire) si déjà renseigné
        this.isEditing = !this.profile?.pseudo;
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        // Charger les infos de base depuis le service d'authentification
        this.auth.currentUser.subscribe(user => {
          if (user) {
            this.profile.pseudo = user.pseudo || this.profile.pseudo;
          }
        });
        this.profileSnapshot = { ...this.profile };
        this.isEditing = true;
      }
    });
  }

  displayAvatarUrl(url: string): string {
    if (!url) return '';
    const u = String(url);
    if (u.startsWith('/uploads/')) return `${API_BASE_URL.replace(/\/api$/, '')}${u}`;
    return u;
  }

  selectAvatar(av: string) {
    this.selectedAvatar = av;
    this.profile.avatar = av;
  }

  async onCustomAvatarUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(this.translate.instant('profile.uploadPhotoError'));
      return;
    }
    const max = 5 * 1024 * 1024;
    if (file.size > max) {
      alert(this.translate.instant('profile.uploadPhotoError'));
      return;
    }
    this.isUploadingAvatar = true;
    try {
      const fd = new FormData();
      fd.append('images', file);
      const upload: any = await this.api.post('upload', fd).toPromise();
      const raw = String(upload?.url || (Array.isArray(upload?.urls) ? upload.urls[0] : '') || '');
      if (!raw) throw new Error('no url');
      this.selectedAvatar = raw;
      this.profile.avatar = raw;
    } catch (e) {
      console.error(e);
      alert(this.translate.instant('profile.uploadPhotoError'));
    } finally {
      this.isUploadingAvatar = false;
    }
  }

  startEdit() {
    this.profileSnapshot = { ...this.profile };
    this.isEditing = true;
  }

  cancelEdit() {
    if (this.profileSnapshot) {
      this.profile = { ...this.profileSnapshot };
      this.selectedAvatar = this.profile.avatar || this.avatars[0];
    }
    this.isEditing = false;
  }

  saveProfile() {
    this.isSaving = true;
    this.api.put('user/profile', this.profile).subscribe({
      next: () => {
        alert(this.translate.instant('common.save'));
        this.isSaving = false;
        this.profileSnapshot = { ...this.profile };
        this.isEditing = false;
        this.auth.triggerProfileBarRefresh();
      },
      error: (err) => {
        console.error('Error saving profile:', err);
        alert(this.translate.instant('common.notAvailableNow'));
        this.isSaving = false;
      }
    });
  }

  loadMyPosts() { 
    this.api.get('user/posts').subscribe({
      next: (data: any) => this.myPosts = data,
      error: (err) => console.error('Error loading posts:', err)
    }); 
  }

  loadSavedPosts() { 
    this.api.get('user/saved').subscribe({
      next: (data: any) => {
        this.savedPosts = Array.isArray(data) ? data : [];
        this.savedIds = new Set(this.savedPosts.map(p => String(p?._id || '')).filter(Boolean));
      },
      error: (err) => console.error('Error loading saved posts:', err)
    }); 
  }

  loadAdRequests() {
    this.api.get('ad-requests/mine').subscribe({
      next: (items: any) => this.adRequests = Array.isArray(items) ? items : [],
      error: () => this.adRequests = []
    });
  }

  async onResubmitSelected(event: any, req: any) {
    const file: File | null = event?.target?.files?.[0] || null;
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('media', file);
      const upload: any = await this.api.post('upload', fd).toPromise();
      const mediaUrl = upload?.url || '';
      if (!mediaUrl) throw new Error('upload failed');
      await this.api.post(`ad-requests/${req._id}/resubmit`, { mediaUrl }).toPromise();
      alert(this.translate.instant('profile.resendOk'));
      this.loadAdRequests();
    } catch (e) {
      console.error(e);
      alert(this.translate.instant('profile.resendErr'));
    } finally {
      try { event.target.value = ''; } catch {}
    }
  }

  deletePost(postId: string) { 
    if (confirm(this.translate.instant('profile.deletePostConfirm'))) {
      this.api.delete(`user/posts/${postId}`).subscribe({
        next: () => {
          this.postModalVisible = false;
          this.loadMyPosts();
        },
        error: (err) => console.error('Error deleting post:', err)
      }); 
    }
  }

  unsave(postId: string) { 
    this.api.delete(`user/save/${postId}`).subscribe({
      next: () => this.loadSavedPosts(),
      error: (err) => console.error('Error unsaving post:', err)
    }); 
  }

  isSaved(postId: any): boolean {
    const id = String(postId || '');
    if (!id) return false;
    return this.savedIds.has(id);
  }

  toggleSave(post: any) {
    const id = String(post?._id || '');
    if (!id) return;

    if (this.isSaved(id)) {
      this.unsave(id);
      return;
    }

    this.api.post(`user/save/${id}`, {}).subscribe({
      next: () => this.loadSavedPosts(),
      error: (err) => console.error('Error saving post:', err)
    });
  }

  openMessaging() {
    this.router.navigate(['/messagerie']);
  }

  openModeration() {
    this.router.navigate(['/moderation']);
  }

  openAdminUsers() {
    this.router.navigate(['/admin/users']);
  }

  openAdminAds() {
    this.router.navigate(['/admin/ads']);
  }

  openAdminAdRequests() {
    this.router.navigate(['/admin/ad-requests']);
  }

  openAdminRss() {
    this.router.navigate(['/admin/rss']);
  }

  openAdminLegal() {
    this.router.navigate(['/admin/legal']);
  }

  deleteAccount() {
    if (confirm(this.translate.instant('profile.deleteAccountConfirm'))) {
      this.api.delete('user/account').subscribe({
        next: () => {
          this.auth.logout();
          this.router.navigate(['/']);
          alert(this.translate.instant('profile.deletedAccount'));
        },
        error: (err) => {
          console.error('Error deleting account:', err);
          alert(this.translate.instant('profile.deleteAccountErr'));
        }
      });
    }
  }
}