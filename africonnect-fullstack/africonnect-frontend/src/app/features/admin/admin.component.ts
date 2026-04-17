import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  template: `
    <div class="admin-container">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <h1 style="margin:0;">Administration</h1>
        <button type="button" class="btn btn-secondary btn-sm" (click)="goBack()">← Retour</button>
      </div>

      <div class="admin-grid">
        <a class="admin-card" routerLink="/moderation">
          <div class="admin-emoji">🛡️</div>
          <div class="admin-title">Modération</div>
          <div class="admin-desc">Supprimer les contenus publiés (Forum, Marketplace, Emploi, etc.)</div>
        </a>
        <a class="admin-card" routerLink="/admin/users">
          <div class="admin-emoji">👥</div>
          <div class="admin-title">Gestion des utilisateurs</div>
          <div class="admin-desc">Création, suppression, gestion des rôles</div>
        </a>
        <a class="admin-card" routerLink="/admin/ads">
          <div class="admin-emoji">📺</div>
          <div class="admin-title">Publicités</div>
          <div class="admin-desc">Upload photo/vidéo et affichage dans les sections</div>
        </a>
        <a class="admin-card" routerLink="/admin/ad-requests">
          <div class="admin-emoji">📣</div>
          <div class="admin-title">Demandes pub</div>
          <div class="admin-desc">Devis, lien de paiement, validation média</div>
        </a>
        <a class="admin-card" routerLink="/admin/rss">
          <div class="admin-emoji">📰</div>
          <div class="admin-title">RSS</div>
          <div class="admin-desc">Gestion des sources et contenus RSS</div>
        </a>
      </div>

      <div class="admin-panel">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
  ,
  styles: [`
    .admin-container { background: var(--surface); border-radius: 24px; padding: 24px; border: 1px solid var(--border); }
    .admin-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
    .admin-card { display: block; padding: 18px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text); text-decoration: none; }
    .admin-card:hover { border-color: var(--primary); }
    .admin-emoji { font-size: 1.8rem; margin-bottom: 8px; }
    .admin-title { font-weight: 800; margin-bottom: 4px; }
    .admin-desc { color: var(--text-muted); font-size: 0.95rem; }
    .admin-panel { padding-top: 8px; }
    @media (max-width: 900px) { .admin-grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminComponent {
  constructor(private router: Router) {}

  goBack() {
    // Si on est déjà sur /admin, on retourne au forum
    if (this.router.url === '/admin') {
      this.router.navigate(['/forum']);
      return;
    }
    this.router.navigate(['/admin']);
  }
}