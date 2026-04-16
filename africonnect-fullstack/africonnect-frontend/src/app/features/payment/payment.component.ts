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
          Choisis un moyen de paiement.
        </p>

        <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top: 12px;">
          <a class="btn btn-primary" [href]="paypalLink" target="_blank" (click)="selectedMethod='paypal'">PayPal</a>
          <a class="btn btn-primary" [href]="revolutLink" target="_blank" (click)="selectedMethod='revolut'">Revolut</a>
          <button class="btn btn-primary" type="button" (click)="payByCard()" [disabled]="isSubmitting || !requestId">
            {{ isSubmitting ? 'Redirection...' : 'Carte bancaire (Stripe)' }}
          </button>
        </div>

        <div *ngIf="success" style="margin-top:12px; padding:12px; border:1px solid rgba(72,187,120,.25); border-radius:12px; background: rgba(72,187,120,.08);">
          <div style="font-weight:800;">✅ Paiement confirmé</div>
          <div class="text-muted" style="margin-top:6px;">
            Un reçu a été envoyé par email (si la configuration email est active).
          </div>
        </div>

        <div *ngIf="canceled" style="margin-top:12px; padding:12px; border:1px solid rgba(245,101,101,.25); border-radius:12px; background: rgba(245,101,101,.08);">
          <div style="font-weight:800;">Paiement annulé</div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:12px; margin-top: 16px;">
          <button class="btn btn-secondary" (click)="goProfile()">Retour profil</button>
        </div>
      </div>
    </div>
  `
})
export class PaymentComponent implements OnInit {
  requestId = '';
  selectedMethod: 'paypal' | 'revolut' | 'card' | '' = '';
  isSubmitting = false;
  success = false;
  canceled = false;

  // Replace with your actual payment links if you have them
  paypalLink = 'https://www.paypal.com/';
  revolutLink = 'https://www.revolut.com/';

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.requestId = params?.requestId || '';
      this.success = !!params?.success;
      this.canceled = !!params?.canceled;
    });
  }

  goBack() {
    this.router.navigate(['/publicite/demande']);
  }

  goProfile() {
    this.router.navigate(['/profile']);
  }

  async payByCard() {
    if (!this.requestId) return;
    this.isSubmitting = true;
    try {
      const res: any = await this.api.post('stripe/create-checkout-session', { requestId: this.requestId }).toPromise();
      const url = res?.url;
      if (!url) throw new Error('URL checkout manquante');
      window.location.href = url;
    } catch (e) {
      console.error(e);
      alert('Erreur Stripe: vérifiez la configuration.');
      this.isSubmitting = false;
    }
  }
}

