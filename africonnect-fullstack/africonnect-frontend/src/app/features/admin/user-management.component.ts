import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { CityAutocompleteComponent } from '../../shared/components/city-autocomplete/city-autocomplete.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CityAutocompleteComponent, TranslateModule],
  template: `
    <div class="admin-container">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <button class="btn btn-secondary" (click)="goBack()">{{ 'admin.usersPage.back' | translate }}</button>
          <h1 style="margin:0;">{{ 'admin.usersPage.title' | translate }}</h1>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">{{ 'admin.usersPage.newUserButton' | translate }}</button>
      </div>

      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>{{ 'admin.usersPage.thPseudo' | translate }}</th>
              <th>{{ 'admin.usersPage.thFullName' | translate }}</th>
              <th>{{ 'admin.usersPage.thRole' | translate }}</th>
              <th>{{ 'admin.usersPage.thVerified' | translate }}</th>
              <th>{{ 'admin.usersPage.thJoined' | translate }}</th>
              <th>{{ 'admin.usersPage.thActions' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>
                <strong>{{ user.pseudo || '—' }}</strong>
                <div *ngIf="user.city" class="text-muted" style="font-size: 0.875rem;">
                  {{ user.city }}{{ user.origin ? ', ' + user.origin : '' }}
                </div>
              </td>
              <td>{{ user.fullName || '-' }}</td>
              <td>
                <select [(ngModel)]="user.role" (change)="updateRole(user._id, user.role)" class="form-control" style="width: auto; min-width: 120px;">
                  <option value="user">{{ 'admin.usersPage.roleUser' | translate }}</option>
                  <option value="moderator">{{ 'admin.usersPage.roleModerator' | translate }}</option>
                  <option value="admin">{{ 'admin.usersPage.roleAdmin' | translate }}</option>
                </select>
              </td>
              <td>
                <span class="status" [class.active]="user.verified" [class.inactive]="!user.verified">
                  {{ user.verified ? ('✅ ' + ('admin.usersPage.verifiedYes' | translate)) : ('❌ ' + ('admin.usersPage.verifiedNo' | translate)) }}
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
          <h3>{{ 'admin.usersPage.emptyTitle' | translate }}</h3>
          <p>{{ 'admin.usersPage.emptyText' | translate }}</p>
        </div>
      </div>
    </div>

    <app-modal [(visible)]="modalVisible" [title]="(editingUser ? 'admin.usersPage.modalEdit' : 'admin.usersPage.modalCreate') | translate">
      <form (ngSubmit)="saveUser()" class="form-modal" *ngIf="form">
        <div class="form-row" style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
          <div class="form-group" style="flex: 1; min-width: 200px;">
            <label class="form-label">{{ 'admin.usersPage.labelEmail' | translate }}</label>
            <input type="email" [(ngModel)]="form.email" name="email" class="form-control" required>
          </div>

          <div class="form-group" style="flex: 1; min-width: 200px;">
            <label class="form-label">
              {{ 'admin.usersPage.labelPassword' | translate }}
              {{ editingUser ? ('admin.usersPage.labelPasswordNewHint' | translate) : ('admin.usersPage.labelPasswordNewRequired' | translate) }}
            </label>
            <input type="password" [(ngModel)]="form.password" name="password" class="form-control" [required]="!editingUser">
          </div>
        </div>

        <div class="form-row" style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
          <div class="form-group" style="flex: 1; min-width: 200px;">
            <label class="form-label">{{ 'admin.usersPage.labelPseudo' | translate }}</label>
            <input type="text" [(ngModel)]="form.pseudo" name="pseudo" class="form-control">
          </div>

          <div class="form-group" style="flex: 1; min-width: 200px;">
            <label class="form-label">{{ 'admin.usersPage.labelFullName' | translate }}</label>
            <input type="text" [(ngModel)]="form.fullName" name="fullName" class="form-control">
          </div>
        </div>

        <div class="form-row" style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
          <div class="form-group" style="flex: 1; min-width: 200px;">
            <label class="form-label">{{ 'admin.usersPage.labelCity' | translate }}</label>
            <app-city-autocomplete [(ngModel)]="form.city" name="city" [placeholder]="'admin.usersPage.cityPlaceholder' | translate"></app-city-autocomplete>
          </div>

          <div class="form-group" style="flex: 1; min-width: 200px;">
            <label class="form-label">{{ 'admin.usersPage.labelOrigin' | translate }}</label>
            <input type="text" [(ngModel)]="form.origin" name="origin" class="form-control" [placeholder]="'admin.usersPage.originPlaceholder' | translate">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ 'admin.usersPage.labelPassions' | translate }}</label>
          <textarea [(ngModel)]="form.passions" name="passions" rows="2" class="form-control" [placeholder]="'admin.usersPage.passionsPlaceholder' | translate"></textarea>
        </div>

        <div class="form-row" style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
          <div class="form-group" style="flex: 1; min-width: 200px;">
            <label class="form-label">{{ 'admin.usersPage.labelRole' | translate }}</label>
            <select [(ngModel)]="form.role" name="role" class="form-control">
              <option value="user">{{ 'admin.usersPage.roleUser' | translate }}</option>
              <option value="moderator">{{ 'admin.usersPage.roleModerator' | translate }}</option>
              <option value="admin">{{ 'admin.usersPage.roleAdmin' | translate }}</option>
            </select>
          </div>

          <div class="form-group" style="flex: 1; min-width: 200px;">
            <label class="form-label">{{ 'admin.usersPage.labelStatus' | translate }}</label>
            <select [(ngModel)]="form.verified" name="verified" class="form-control">
              <option [value]="true">{{ 'admin.usersPage.verifiedOption' | translate }}</option>
              <option [value]="false">{{ 'admin.usersPage.unverifiedOption' | translate }}</option>
            </select>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;">
          <button type="button" class="btn btn-secondary" (click)="modalVisible = false">
            {{ 'common.cancel' | translate }}
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="isSubmitting">
            <span *ngIf="!isSubmitting">{{ editingUser ? ('admin.usersPage.update' | translate) : ('admin.usersPage.submitCreate' | translate) }}</span>
            <span *ngIf="isSubmitting">{{ 'common.saving' | translate }}</span>
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

  constructor(
    private api: ApiService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  goBack() {
    this.router.navigate(['/profile']);
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
      alert(this.translate.instant('admin.usersPage.emailRequired'));
      return;
    }

    if (!this.editingUser && !this.form.password) {
      alert(this.translate.instant('admin.usersPage.passwordRequiredNew'));
      return;
    }

    this.isSubmitting = true;

    try {
      const userData: any = { ...this.form };

      if (this.editingUser && !userData.password) {
        delete userData.password;
      }

      if (this.editingUser) {
        await this.api.put(`admin/users/${this.editingUser._id}`, userData).toPromise();
      } else {
        await this.api.post('admin/users', userData).toPromise();
      }

      this.modalVisible = false;
      this.loadUsers();
      this.resetForm();
    } catch (error) {
      console.error('Error saving user:', error);
      alert(this.translate.instant('admin.usersPage.saveError'));
    } finally {
      this.isSubmitting = false;
    }
  }

  updateRole(userId: string, role: string) {
    this.api.put(`admin/users/${userId}/role`, { role }).subscribe({
      next: () => {},
      error: (err) => console.error('Error updating role:', err)
    });
  }

  deleteUser(userId: string) {
    if (!confirm(this.translate.instant('admin.usersPage.confirmDelete'))) return;
    this.api.delete(`admin/users/${userId}`).subscribe({
      next: () => this.loadUsers(),
      error: (err) => console.error('Error deleting user:', err)
    });
  }
}
