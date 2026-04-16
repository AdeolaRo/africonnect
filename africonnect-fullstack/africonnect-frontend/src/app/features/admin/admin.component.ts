import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  template: `
    <div style="display:flex; gap:20px;">
      <div style="width:200px;">
        <ul style="list-style:none; padding:0;">
          <li><a routerLink="/admin/users" routerLinkActive="active">Gestion utilisateurs</a></li>
          <li><a routerLink="/admin/ads" routerLinkActive="active">Gestion publicités</a></li>
        </ul>
      </div>
      <div style="flex:1;">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class AdminComponent {}