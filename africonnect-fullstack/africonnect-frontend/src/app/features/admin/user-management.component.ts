import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Gestion des utilisateurs</h2>
    <table style="width:100%; border-collapse:collapse;">
      <thead><tr><th>Email</th><th>Rôle</th><th>Actions</th></tr></thead>
      <tbody>
        <tr *ngFor="let user of users">
          <td>{{ user.email }}</td>
          <td>
            <select [(ngModel)]="user.role" (change)="updateRole(user.id, user.role)">
              <option value="user">Utilisateur</option>
              <option value="moderator">Modérateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </td>
          <td><button class="btn" (click)="deleteUser(user.id)">Supprimer</button></td>
        </tr>
      </tbody>
    </table>
  `
})
export class UserManagementComponent implements OnInit {
  users: any[] = [];
  constructor(private api: ApiService) {}
  ngOnInit() { this.loadUsers(); }
  loadUsers() { this.api.get('admin/users').subscribe((data: any) => this.users = data); }
  updateRole(userId: string, role: string) { this.api.put(`admin/users/${userId}/role`, { role }).subscribe(); }
  deleteUser(userId: string) { if (confirm('Supprimer cet utilisateur ?')) this.api.delete(`admin/users/${userId}`).subscribe(() => this.loadUsers()); }
}