import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width:1000px; margin:auto;">
      <div style="display:flex; gap:32px; flex-wrap:wrap; margin-bottom:32px;">
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:16px;">
          <img [src]="selectedAvatar" style="width:120px; height:120px; border-radius:50%; object-fit:cover;">
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <img *ngFor="let av of avatars" [src]="av" style="width:60px; height:60px; border-radius:50%; cursor:pointer; border:2px solid transparent;" [style.borderColor]="av === selectedAvatar ? 'var(--primary)' : 'transparent'" (click)="selectAvatar(av)">
          </div>
        </div>
        <div style="flex:2; display:flex; flex-direction:column; gap:12px;">
          <input [(ngModel)]="profile.fullName" placeholder="Nom complet">
          <input [(ngModel)]="profile.pseudo" placeholder="Pseudo">
          <input [(ngModel)]="profile.city" placeholder="Ville">
          <input [(ngModel)]="profile.origin" placeholder="Origine">
          <textarea [(ngModel)]="profile.passions" placeholder="Passions"></textarea>
          <button class="btn btn-primary" (click)="saveProfile()">Enregistrer</button>
        </div>
      </div>
      <h3>Mes publications</h3>
      <div *ngFor="let post of myPosts" class="item-card">
        <h4>{{ post.title || post.name }}</h4>
        <p>{{ post.content || post.desc }}</p>
      </div>
      <h3>Publications sauvegardées</h3>
      <div *ngFor="let saved of savedPosts" class="item-card">
        <h4>{{ saved.title || saved.name }}</h4>
        <button (click)="unsave(saved.id)">Retirer</button>
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
  profile: any = { fullName: '', pseudo: '', city: '', origin: '', passions: '' };
  myPosts: any[] = [];
  savedPosts: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get('user/profile').subscribe((data: any) => {
      this.profile = data;
      this.selectedAvatar = data.avatar || this.avatars[0];
    });
    this.loadMyPosts();
    this.loadSavedPosts();
  }
  selectAvatar(av: string) { this.selectedAvatar = av; }
  saveProfile() {
    this.api.put('user/profile', { ...this.profile, avatar: this.selectedAvatar }).subscribe(() => alert('Profil mis à jour'));
  }
  loadMyPosts() { this.api.get('user/posts').subscribe((data: any) => this.myPosts = data); }
  loadSavedPosts() { this.api.get('user/saved').subscribe((data: any) => this.savedPosts = data); }
  unsave(postId: string) { this.api.delete(`user/save/${postId}`).subscribe(() => this.loadSavedPosts()); }
}