import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
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
        <div class="profile-actions">
          <button class="btn btn-secondary" (click)="openMessaging()">💬 {{ 'profile.messaging' | translate }}</button>
          <button class="btn btn-secondary" (click)="openAdRequest()">📣 {{ 'profile.ads' | translate }}</button>
          <button class="btn btn-secondary" *ngIf="isModerator || isAdmin" (click)="openModeration()">🛡️ {{ 'profile.moderation' | translate }}</button>
          <button class="btn btn-secondary" *ngIf="isAdmin" (click)="openAdminUsers()">👥 {{ 'profile.users' | translate }}</button>
          <button class="btn btn-secondary" *ngIf="isAdmin" (click)="openAdminAds()">📺 {{ 'profile.adminAds' | translate }}</button>
          <button class="btn btn-secondary" *ngIf="isAdmin" (click)="openAdminAdRequests()">📣 {{ 'profile.adminAdRequests' | translate }}</button>
          <button class="btn btn-secondary" *ngIf="isAdmin" (click)="openAdminRss()">📰 {{ 'profile.rss' | translate }}</button>
        </div>
      </div>
      
      <div class="profile-content">
        <div class="profile-sidebar">
          <div class="avatar-section">
            <img [src]="selectedAvatar" class="avatar-large" [alt]="profile.pseudo || 'Avatar'">

            <!-- Mode vue -->
            <div *ngIf="!isEditing" style="margin-top: 12px; width:100%;">
              <div class="profile-summary">
                <div class="summary-name">{{ profile.pseudo || '—' }}</div>
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
              <div class="avatar-grid">
                <img *ngFor="let av of avatars" 
                     [src]="av" 
                     class="avatar-thumb" 
                     [class.selected]="av === selectedAvatar" 
                     (click)="selectAvatar(av)">
              </div>
              <div style="display:flex; gap:10px; width:100%; margin-top: 12px;">
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
              <div *ngFor="let post of myPosts" class="post-card">
                <div class="post-header">
                  <h4>{{ post.title || post.subject || 'Sans titre' }}</h4>
                  <span class="post-date">{{ post.createdAt | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="post-content">{{ (post.content || post.desc || '').slice(0, 150) }}...</div>
                <div class="post-actions">
                  <button class="btn btn-secondary btn-sm" (click)="openPost(post)">{{ 'profile.view' | translate }}</button>
                  <button class="btn btn-danger btn-sm" (click)="deletePost(post._id)">{{ 'common.delete' | translate }}</button>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h3>{{ 'profile.savedPosts' | translate }}</h3>
              <div *ngIf="savedPosts.length === 0" class="empty-section">
                <p>{{ 'profile.noSaved' | translate }}</p>
              </div>
              <div *ngFor="let saved of savedPosts" class="post-card">
                <div class="post-header">
                  <h4>{{ saved.title || saved.subject || 'Sans titre' }}</h4>
                  <button class="btn btn-secondary btn-sm" (click)="unsave(saved._id)">{{ 'profile.remove' | translate }}</button>
                </div>
                <div class="post-content">{{ (saved.content || saved.desc || '').slice(0, 150) }}...</div>
              </div>
            </div>

            <div class="section">
              <h3>{{ 'profile.adRequests' | translate }}</h3>
              <div *ngIf="adRequests.length === 0" class="empty-section">
                <p>{{ 'profile.noAdRequests' | translate }}</p>
                <button class="btn btn-primary" (click)="openAdRequest()">{{ 'profile.makeRequest' | translate }}</button>
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

        <div style="margin-top:12px;" [innerHTML]="selectedPost.content || selectedPost.desc || ''"></div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:14px; flex-wrap:wrap;">
          <button class="btn btn-secondary" (click)="postModalVisible=false">{{ 'common.close' | translate }}</button>
          <button class="btn btn-primary" (click)="goToOriginal(selectedPost)">{{ 'profile.open' | translate }}</button>
        </div>
      </div>
    </app-modal>

    <app-modal [(visible)]="previewVisible" [title]="'common.preview' | translate">
      <img *ngIf="previewUrl" [src]="previewUrl" [alt]="'common.preview' | translate" style="width:100%; max-height: 70vh; object-fit: contain; border-radius: 12px;">
    </app-modal>
  `
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
  adRequests: any[] = [];
  isSaving = false;
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
    private translate: TranslateService
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

  selectAvatar(av: string) { 
    this.selectedAvatar = av;
    this.profile.avatar = av;
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
      next: (data: any) => this.savedPosts = data,
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

  openMessaging() {
    this.router.navigate(['/messagerie']);
  }

  openAdRequest() {
    this.router.navigate(['/publicite/demande']);
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