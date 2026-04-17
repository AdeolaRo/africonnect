import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <h1>Mon Profil</h1>
        <div class="profile-actions">
          <button class="btn btn-secondary" (click)="openMessaging()">💬 Messagerie</button>
          <button class="btn btn-secondary" (click)="openAdRequest()">📣 Publicité</button>
          <button class="btn btn-secondary" *ngIf="isModerator || isAdmin" (click)="openModeration()">🛡️ Modération</button>
          <button class="btn btn-secondary" *ngIf="isAdmin" (click)="openAdminUsers()">👥 Utilisateurs</button>
          <button class="btn btn-secondary" *ngIf="isAdmin" (click)="openAdminAds()">📺 Publicités</button>
          <button class="btn btn-secondary" *ngIf="isAdmin" (click)="openAdminRss()">📰 RSS</button>
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
                <button class="btn btn-primary" (click)="startEdit()">✏️ Modifier</button>
                <button class="btn btn-danger" (click)="deleteAccount()">🗑️ Supprimer</button>
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
                  {{ isSaving ? 'Enregistrement...' : '💾 Enregistrer' }}
                </button>
                <button class="btn btn-secondary" (click)="cancelEdit()" [disabled]="isSaving">Annuler</button>
              </div>
            </div>
          </div>
          
          <div class="profile-stats">
            <h3>Statistiques</h3>
            <div class="stat-item">
              <div class="stat-label">Publications</div>
              <div class="stat-value">{{ myPosts.length }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Sauvegardés</div>
              <div class="stat-value">{{ savedPosts.length }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Membre depuis</div>
              <div class="stat-value">{{ profile.createdAt | date:'MM/yyyy' }}</div>
            </div>
          </div>
        </div>
        
        <div class="profile-main">
          <div class="profile-form" *ngIf="isEditing">
            <h2>Informations personnelles</h2>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" [(ngModel)]="profile.email" class="form-control" disabled>
                <div class="text-muted" style="font-size: 0.875rem; margin-top: 4px;">L'email ne peut pas être modifié</div>
              </div>
              <div class="form-group">
                <label class="form-label">Pseudo *</label>
                <input type="text" [(ngModel)]="profile.pseudo" class="form-control" placeholder="Votre pseudo" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Nom complet</label>
              <input type="text" [(ngModel)]="profile.fullName" class="form-control" placeholder="Prénom Nom">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Ville</label>
                <input type="text" [(ngModel)]="profile.city" class="form-control" placeholder="Votre ville">
              </div>
              <div class="form-group">
                <label class="form-label">Origine</label>
                <input type="text" [(ngModel)]="profile.origin" class="form-control" placeholder="Pays d'origine">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Passions et centres d'intérêt</label>
              <textarea [(ngModel)]="profile.passions" class="form-control" rows="3" placeholder="Sports, musique, arts, technologie..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">À propos de moi</label>
              <textarea [(ngModel)]="profile.bio" class="form-control" rows="4" placeholder="Parlez-nous de vous..."></textarea>
            </div>
          </div>
          
          <div class="profile-sections">
            <div class="section">
              <h3>Mes publications récentes</h3>
              <div *ngIf="myPosts.length === 0" class="empty-section">
                <p>Vous n'avez pas encore publié de contenu</p>
                <button class="btn btn-primary" (click)="publishOnForum()">Publier sur le forum</button>
              </div>
              <div *ngFor="let post of myPosts" class="post-card">
                <div class="post-header">
                  <h4>{{ post.title || post.subject || 'Sans titre' }}</h4>
                  <span class="post-date">{{ post.createdAt | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="post-content">{{ (post.content || post.desc || '').slice(0, 150) }}...</div>
                <div class="post-actions">
                  <button class="btn btn-secondary btn-sm" (click)="openPost(post)">Voir</button>
                  <button class="btn btn-danger btn-sm" (click)="deletePost(post._id)">Supprimer</button>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h3>Publications sauvegardées</h3>
              <div *ngIf="savedPosts.length === 0" class="empty-section">
                <p>Vous n'avez pas encore sauvegardé de publications</p>
              </div>
              <div *ngFor="let saved of savedPosts" class="post-card">
                <div class="post-header">
                  <h4>{{ saved.title || saved.subject || 'Sans titre' }}</h4>
                  <button class="btn btn-secondary btn-sm" (click)="unsave(saved._id)">Retirer</button>
                </div>
                <div class="post-content">{{ (saved.content || saved.desc || '').slice(0, 150) }}...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <app-modal [(visible)]="postModalVisible" title="Publication">
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
          <button class="btn btn-secondary" (click)="postModalVisible=false">Fermer</button>
          <button class="btn btn-primary" (click)="goToOriginal(selectedPost)">Ouvrir</button>
        </div>
      </div>
    </app-modal>

    <app-modal [(visible)]="previewVisible" title="Aperçu">
      <img *ngIf="previewUrl" [src]="previewUrl" alt="Aperçu" style="width:100%; max-height: 70vh; object-fit: contain; border-radius: 12px;">
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
    private router: Router
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
    return urls.filter(Boolean).slice(0, 3);
  }

  openPreview(url: string) {
    this.previewUrl = url;
    this.previewVisible = true;
  }

  goToOriginal(post: any) {
    // Best-effort: open forum for now (works for forum posts). For other types, keep user on forum.
    this.postModalVisible = false;
    this.router.navigate(['/forum']);
  }

  ngOnInit() {
    this.loadProfile();
    this.loadMyPosts();
    this.loadSavedPosts();

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
        alert('✅ Profil mis à jour avec succès !');
        this.isSaving = false;
        this.profileSnapshot = { ...this.profile };
        this.isEditing = false;
      },
      error: (err) => {
        console.error('Error saving profile:', err);
        alert('❌ Erreur lors de la sauvegarde du profil');
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

  deletePost(postId: string) { 
    if (confirm('Voulez-vous vraiment supprimer cette publication ?')) {
      this.api.delete(`user/posts/${postId}`).subscribe({
        next: () => this.loadMyPosts(),
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

  openAdminRss() {
    this.router.navigate(['/admin/rss']);
  }

  deleteAccount() {
    if (confirm('⚠️ ATTENTION : Voulez-vous vraiment supprimer votre profil ? Cette action est irréversible et supprimera votre compte.')) {
      this.api.delete('user/account').subscribe({
        next: () => {
          this.auth.logout();
          this.router.navigate(['/']);
          alert('Votre profil a été supprimé. Redirection vers l’accueil.');
        },
        error: (err) => {
          console.error('Error deleting account:', err);
          alert('Erreur lors de la suppression du compte');
        }
      });
    }
  }
}