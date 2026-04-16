import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <div class="admin-container">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h1>Gestion des utilisateurs</h1>
        <button class="btn btn-primary" (click)="openCreateModal()">
          + Créer un utilisateur
        </button>
      </div>
      
      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Pseudo</th>
              <th>Nom complet</th>
              <th>Rôle</th>
              <th>Vérifié</th>
              <th>Inscription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>
                <strong>{{ user.email }}</strong>
                <div *ngIf="user.city" class="text-muted" style="font-size: 0.875rem;">
                  {{ user.city }}{{ user.origin ? ', ' + user.origin : '' }}
                </div>
              </td>
              <td>{{ user.pseudo || '-' }}</td>
              <td>{{ user.fullName || '-' }}</td>
              <td>
                <select [(ngModel)]="user.role" (change)="updateRole(user._id, user.role)" class="form-control" style="width: auto; min-width: 120px;">
                  <option value="user">Utilisateur</option>
                  <option value="moderator">Modérateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </td>
              <td>
                <span class="status" [class.active]="user.verified" [class.inactive]="!user.verified">
                  {{ user.verified ? '✅ Oui' : '❌ Non' }}
                </span>
              </td>
              <td>
                {{ user.createdAt | date:'dd/MM/yyyy' }}
              </td>
              <td>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-sm" (click)="editUser(user)">
                    ✏️
                  </button>
                  <button class="btn btn-danger btn-sm" (click)="deleteUser(user._id)">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div *ngIf="users.length === 0" class="empty-state">
          <div style="font-size: 3rem; margin-bottom: 16px;">👥</div>
          <h3>Aucun utilisateur</h3>
          <p>Commencez par créer un utilisateur</p>
        </div>
      </div>
    </div>

    <!-- Modal de création/édition -->
    <app-modal [(visible)]="modalVisible" [title]="modalTitle">
      <form (ngSubmit)="saveUser()" class="form-modal" *ngIf="form">
        <div class="form-row" style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Email *</label>
            <input type="email" [(ngModel)]="form.email" name="email" class="form-control" required>
          </div>
          
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Mot de passe {{ editingUser ? '(laisser vide pour ne pas changer)' : '*' }}</label>
            <input type="password" [(ngModel)]="form.password" name="password" class="form-control" [required]="!editingUser">
          </div>
        </div>
        
        <div class="form-row" style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Pseudo</label>
            <input type="text" [(ngModel)]="form.pseudo" name="pseudo" class="form-control">
          </div>
          
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Nom complet</label>
            <input type="text" [(ngModel)]="form.fullName" name="fullName" class="form-control">
          </div>
        </div>
        
        <div class="form-row" style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Ville</label>
            <input type="text" [(ngModel)]="form.city" name="city" class="form-control">
          </div>
          
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Origine</label>
            <input type="text" [(ngModel)]="form.origin" name="origin" class="form-control" placeholder="Pays d'origine">
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Passions/intérêts</label>
          <textarea [(ngModel)]="form.passions" name="passions" rows="2" class="form-control" placeholder="Sports, musique, arts..."></textarea>
        </div>
        
        <div class="form-row" style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Rôle</label>
            <select [(ngModel)]="form.role" name="role" class="form-control">
              <option value="user">Utilisateur</option>
              <option value="moderator">Modérateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Statut</label>
            <select [(ngModel)]="form.verified" name="verified" class="form-control">
              <option [value]="true">Vérifié</option>
              <option [value]="false">Non vérifié</option>
            </select>
          </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;">
          <button type="button" class="btn btn-secondary" (click)="modalVisible = false">
            Annuler
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="isSubmitting">
            <span *ngIf="!isSubmitting">{{ editingUser ? 'Mettre à jour' : 'Créer' }}</span>
            <span *ngIf="isSubmitting">Enregistrement...</span>
          </button>
        </div>
      </form>
    </app-modal>
  `
})
export class UserManagementComponent implements OnInit {
  users: any[] = [];
  modalVisible = false;
  editingUser: any = null;
  isSubmitting = false;
  
  form = {
    email: '',
    password: '',
    pseudo: '',
    fullName: '',
    city: '',
    origin: '',
    passions: '',
    role: 'user',
    verified: true
  };

  get modalTitle(): string {
    return this.editingUser ? 'Modifier utilisateur' : 'Créer un utilisateur';
  }

  constructor(private api: ApiService) {}

  ngOnInit() { 
    this.loadUsers(); 
  }

  loadUsers() { 
    this.api.get('admin/users').subscribe({
      next: (data: any) => this.users = data,
      error: (err) => console.error('Error loading users:', err)
    }); 
  }

  openCreateModal() {
    this.editingUser = null;
    this.resetForm();
    this.modalVisible = true;
  }

  editUser(user: any) {
    this.editingUser = user;
    this.form = {
      email: user.email,
      password: '',
      pseudo: user.pseudo || '',
      fullName: user.fullName || '',
      city: user.city || '',
      origin: user.origin || '',
      passions: user.passions || '',
      role: user.role,
      verified: user.verified
    };
    this.modalVisible = true;
  }

  resetForm() {
    this.form = {
      email: '',
      password: '',
      pseudo: '',
      fullName: '',
      city: '',
      origin: '',
      passions: '',
      role: 'user',
      verified: true
    };
  }

  async saveUser() {
    if (!this.form.email) {
      alert('L\'email est requis');
      return;
    }
    
    if (!this.editingUser && !this.form.password) {
      alert('Le mot de passe est requis pour un nouvel utilisateur');
      return;
    }

    this.isSubmitting = true;
    
    try {
      const userData = { ...this.form };
      
      // Si c'est une édition et pas de nouveau mot de passe, on ne l'envoie pas
      if (this.editingUser && !userData.password) {
        delete userData.password;
      }
      
      if (this.editingUser) {
        // Mise à jour via l'API admin
        await this.api.put(`admin/users/${this.editingUser._id}`, userData).toPromise();
      } else {
        // Création via l'API admin (permet role/verified)
        await this.api.post('admin/users', userData).toPromise();
      }
      
      this.modalVisible = false;
      this.loadUsers();
      this.resetForm();
      
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      this.isSubmitting = false;
    }
  }

  updateRole(userId: string, role: string) { 
    this.api.put(`admin/users/${userId}/role`, { role }).subscribe({
      next: () => console.log('Role updated'),
      error: (err) => console.error('Error updating role:', err)
    }); 
  }

  deleteUser(userId: string) { 
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      this.api.delete(`admin/users/${userId}`).subscribe({
        next: () => this.loadUsers(),
        error: (err) => console.error('Error deleting user:', err)
      }); 
    }
  }
}