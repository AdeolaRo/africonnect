import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width:400px; margin:50px auto;">
      <h2>Mot de passe oublié</h2>
      <input type="email" [(ngModel)]="email" placeholder="Votre email" style="width:100%; padding:12px; margin-bottom:16px;">
      <button class="btn btn-primary" (click)="submit()">Envoyer</button>
      <p>{{ message }}</p>
    </div>
  `
})
export class ForgotPasswordComponent {
  email = '';
  message = '';
  constructor(private api: ApiService) {}
  submit() {
    this.api.post('auth/forgot-password', { email: this.email }, false).subscribe({
      next: () => {
        this.message = 'Un email vous a été envoyé.';
      },
      error: (err) => {
        console.error('Forgot password error:', err);
        this.message = err.error?.error || 'Erreur lors de l\'envoi de l\'email';
      }
    });
  }
}