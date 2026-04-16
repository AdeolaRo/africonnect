import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <h1>Mon Profil</h1>
        <div class="profile-actions">
          <button class="btn btn-secondary" (click)="openMessaging()">
            💬 Messagerie
          </button>
          <button class="btn btn-danger" (click)="deleteAccount()">
            🗑️ Supprimer mon compte
          </button>
        </div>
      </div>
      
      <div class="profile-content">
        <div class="profile-sidebar">
          <div class="avatar-section">
            <img [src]="selectedAvatar" class="avatar-large" [alt]="profile.pseudo || 'Avatar'">
            <div class="avatar-grid">
              <img *ngFor="let av of avatars" 
                   [src]="av" 
                   class="avatar-thumb" 
                   [class.selected]="av === selectedAvatar" 
                   (click)="selectAvatar(av)">
            </div>
            <button class="btn btn-primary" (click)="saveProfile()" [disabled]="isSaving">
              {{ isSaving ? 'Enregistrement...' : '💾 Enregistrer le profil' }}
            </button>
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
          <div class="profile-form">
            <h2>Informations personnelles</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" [(ngModel)]="profile.email" class="form-control" disabled>
                <div class="text-muted" style="font-size: 0.875rem; margin-top: 4px;">L'email ne peut pas être modifié</div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Pseudo *</label>
                <input type="text" [(ngModel)]="profile.pseudo" class="form-control" placeholder="Votre pseudo">
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
                <button class="btn btn-primary" routerLink="/forum">Publier sur le forum</button>
              </div>
              <div *ngFor="let post of myPosts" class="post-card">
                <div class="post-header">
                  <h4>{{ post.title || post.subject || 'Sans titre' }}</h4>
                  <span class="post-date">{{ post.createdAt | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="post-content">{{ (post.content || post.desc || '').slice(0, 150) }}...</div>
                <div class="post-actions">
                  <button class="btn btn-secondary btn-sm" [routerLink]="['/forum']">Voir</button>
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

  constructor(
    private api: ApiService, 
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProfile();
    this.loadMyPosts();
    this.loadSavedPosts();
  }

  loadProfile() {
    this.api.get('user/profile').subscribe({
      next: (data: any) => {
        this.profile = data;
        this.selectedAvatar = data.avatar || this.avatars[0];
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        // Charger les infos de base depuis le service d'authentification
        this.auth.currentUser.subscribe(user => {
          if (user) {
            this.profile.email = user.email;
            this.profile.pseudo = user.email.split('@')[0];
          }
        });
      }
    });
  }

  selectAvatar(av: string) { 
    this.selectedAvatar = av;
    this.profile.avatar = av;
  }

  saveProfile() {
    this.isSaving = true;
    this.api.put('user/profile', this.profile).subscribe({
      next: () => {
        alert('✅ Profil mis à jour avec succès !');
        this.isSaving = false;
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

  deleteAccount() {
    if (confirm('⚠️ ATTENTION : Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible et supprimera toutes vos données.')) {
      this.api.delete('user/account').subscribe({
        next: () => {
          this.auth.logout();
          this.router.navigate(['/forum']);
          alert('Votre compte a été supprimé. Vous allez être redirigé.');
        },
        error: (err) => {
          console.error('Error deleting account:', err);
          alert('Erreur lors de la suppression du compte');
        }
      });
    }
  }
}