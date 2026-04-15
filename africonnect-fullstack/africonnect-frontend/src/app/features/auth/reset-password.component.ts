import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width:400px; margin:50px auto;">
      <h2>Nouveau mot de passe</h2>
      <input type="password" [(ngModel)]="password" placeholder="Nouveau mot de passe" style="width:100%; padding:12px; margin-bottom:16px;">
      <button class="btn btn-primary" (click)="submit()">Réinitialiser</button>
      <p>{{ message }}</p>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  password = '';
  message = '';
  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit() { this.token = this.route.snapshot.params['token']; }
  submit() {
    this.api.post('auth/reset-password', { token: this.token, newPassword: this.password }).subscribe(() => {
      this.message = 'Mot de passe mis à jour. Connectez-vous.';
      setTimeout(() => this.router.navigate(['/forum']), 2000);
    });
  }
}