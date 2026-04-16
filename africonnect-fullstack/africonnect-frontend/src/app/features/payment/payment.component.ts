import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-container">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom: 16px;">
        <button class="btn btn-secondary" (click)="goBack()">← Retour</button>
        <h1 style="margin:0;">Paiement</h1>
      </div>

      <div class="card" style="padding:16px; border:1px solid var(--border); border-radius:16px; background: var(--surface);">
        <p class="text-muted">
          Choisis un moyen de paiement. Après paiement, clique sur “J’ai payé” pour recevoir ton reçu par email.
        </p>

        <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top: 12px;">
          <a class="btn btn-primary" [href]="paypalLink" target="_blank" (click)="selectedMethod='paypal'">PayPal</a>
          <a class="btn btn-primary" [href]="revolutLink" target="_blank" (click)="selectedMethod='revolut'">Revolut</a>
          <button class="btn btn-primary" type="button" (click)="selectedMethod='card'; showCardInfo = true">Carte bancaire</button>
        </div>

        <div *ngIf="showCardInfo" style="margin-top:12px; padding:12px; border:1px solid var(--border); border-radius:12px; background: var(--surface-2);">
          <div style="font-weight:700;">Paiement CB</div>
          <div class="text-muted" style="font-size:0.9rem; margin-top:6px;">
            Intégration CB à brancher (Stripe / checkout IONOS). Pour l’instant, contacte l’admin après paiement.
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:12px; margin-top: 16px;">
          <button class="btn btn-secondary" (click)="goProfile()">Retour profil</button>
          <button class="btn btn-primary" (click)="confirmPaid()" [disabled]="isSubmitting || !requestId">
            {{ isSubmitting ? 'Validation...' : 'J’ai payé' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class PaymentComponent implements OnInit {
  requestId = '';
  selectedMethod: 'paypal' | 'revolut' | 'card' | '' = '';
  showCardInfo = false;
  isSubmitting = false;

  // Replace with your actual payment links if you have them
  paypalLink = 'https://www.paypal.com/';
  revolutLink = 'https://www.revolut.com/';

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.requestId = params?.requestId || '';
    });
  }

  goBack() {
    this.router.navigate(['/publicite/demande']);
  }

  goProfile() {
    this.router.navigate(['/profile']);
  }

  async confirmPaid() {
    if (!this.requestId) return;
    this.isSubmitting = true;
    try {
      await this.api.post(`ad-requests/${this.requestId}/confirm-payment`, { method: this.selectedMethod || '' }).toPromise();
      alert('✅ Merci. Un reçu a été envoyé sur votre email (si la configuration email est active).');
      this.router.navigate(['/profile']);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la validation du paiement.');
    } finally {
      this.isSubmitting = false;
    }
  }
}

