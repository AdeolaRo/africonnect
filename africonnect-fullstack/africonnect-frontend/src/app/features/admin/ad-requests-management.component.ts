import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-ad-requests-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <div class="admin-container">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom: 12px;">
        <button class="btn btn-secondary" (click)="goBack()">← Retour</button>
        <h1 style="margin:0;">Demandes de publicité</h1>
      </div>

      <div class="card" style="padding:12px; border:1px solid var(--border); border-radius:16px; background: var(--surface); margin-bottom: 12px;">
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
          <select class="form-control" style="max-width:260px;" [(ngModel)]="filterOption">
            <option value="">Toutes</option>
            <option value="create_and_publish">Création + publication</option>
            <option value="publish_only">Publication seulement</option>
          </select>
          <select class="form-control" style="max-width:260px;" [(ngModel)]="filterStatus">
            <option value="">Tous statuts</option>
            <option value="awaiting_admin_payment_link">En attente lien admin</option>
            <option value="payment_link_sent">Lien envoyé</option>
            <option value="awaiting_payment">En attente paiement</option>
            <option value="paid">Payé</option>
            <option value="under_review">À vérifier</option>
            <option value="needs_resubmission">Nouveau média requis</option>
            <option value="approved">Approuvé</option>
            <option value="rejected">Refusé</option>
            <option value="refused">Refus utilisateur</option>
          </select>
          <button class="btn btn-secondary btn-sm" (click)="load()">Rafraîchir</button>
        </div>
      </div>

      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Option</th>
              <th>Statut</th>
              <th>Média</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of filtered()">
              <td>
                <strong>{{ r.userPseudo || '—' }}</strong>
                <div class="text-muted" style="font-size:0.85rem;">{{ r.userEmail }}</div>
              </td>
              <td>{{ r.option === 'create_and_publish' ? 'Création + publication' : 'Publication seulement' }}</td>
              <td><span class="status">{{ r.status }}</span></td>
              <td>
                <a *ngIf="r.mediaUrl" [href]="r.mediaUrl" target="_blank">Voir média</a>
                <span *ngIf="!r.mediaUrl" class="text-muted">—</span>
              </td>
              <td style="white-space:nowrap;">{{ r.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                  <button class="btn btn-secondary btn-sm" (click)="openDetails(r)">Détails</button>

                  <button *ngIf="r.option==='create_and_publish' && (r.status==='awaiting_admin_payment_link' || r.status==='payment_link_sent')"
                          class="btn btn-primary btn-sm"
                          (click)="sendPaymentLink(r)">
                    Envoyer lien paiement
                  </button>

                  <button *ngIf="r.option==='publish_only' && r.status==='under_review'"
                          class="btn btn-primary btn-sm"
                          (click)="approve(r)">
                    Approuver
                  </button>

                  <button *ngIf="r.option==='publish_only' && (r.status==='under_review' || r.status==='needs_resubmission')"
                          class="btn btn-danger btn-sm"
                          (click)="askResubmission(r)">
                    Demander nouveau média
                  </button>

                  <button *ngIf="r.status!=='rejected'"
                          class="btn btn-danger btn-sm"
                          (click)="reject(r)">
                    Refuser
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="requests.length === 0" class="empty-state">
          <div style="font-size: 3rem; margin-bottom: 10px;">📣</div>
          <h3>Aucune demande</h3>
        </div>
      </div>
    </div>

    <app-modal [(visible)]="detailsVisible" title="Détails demande pub">
      <div *ngIf="selected">
        <div class="text-muted" style="margin-bottom:10px;">
          <div><strong>Utilisateur</strong>: {{ selected.userPseudo || '—' }} ({{ selected.userEmail }})</div>
          <div><strong>Option</strong>: {{ selected.option }}</div>
          <div><strong>Statut</strong>: {{ selected.status }}</div>
          <div><strong>Date</strong>: {{ selected.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
        </div>
        <div style="font-weight:900; margin-bottom:8px;">Message</div>
        <div style="white-space:pre-wrap; padding:12px; border-radius:12px; border:1px solid var(--border); background: var(--surface-2);">
          {{ selected.message || '—' }}
        </div>

        <div *ngIf="selected.attachments?.length" style="margin-top:12px;">
          <div style="font-weight:900; margin-bottom:8px;">Pièces jointes</div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <a *ngFor="let u of selected.attachments" [href]="u" target="_blank">{{ u.split('/').pop() }}</a>
          </div>
        </div>

        <div *ngIf="selected.adminMessage" style="margin-top:12px;">
          <div style="font-weight:900; margin-bottom:8px;">Message admin</div>
          <div style="white-space:pre-wrap; padding:12px; border-radius:12px; border:1px solid var(--border); background: rgba(245,101,101,.08);">
            {{ selected.adminMessage }}
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap; margin-top:14px;">
          <button class="btn btn-secondary" (click)="detailsVisible=false">Fermer</button>
        </div>
      </div>
    </app-modal>
  `
})
export class AdRequestsManagementComponent implements OnInit {
  requests: any[] = [];
  filterOption: '' | 'create_and_publish' | 'publish_only' = '';
  filterStatus = '';

  detailsVisible = false;
  selected: any = null;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.load();
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  load() {
    this.api.get('ad-requests').subscribe({
      next: (items: any) => this.requests = Array.isArray(items) ? items : [],
      error: () => alert('Impossible de charger les demandes')
    });
  }

  filtered() {
    return (this.requests || []).filter(r => {
      if (this.filterOption && r.option !== this.filterOption) return false;
      if (this.filterStatus && r.status !== this.filterStatus) return false;
      return true;
    });
  }

  openDetails(r: any) {
    this.selected = r;
    this.detailsVisible = true;
  }

  async sendPaymentLink(r: any) {
    try {
      const res: any = await this.api.post(`ad-requests/${r._id}/send-payment-link`, {}).toPromise();
      if (res?.url) alert('Lien envoyé (notification + email si configuré).');
      this.load();
    } catch (e) {
      console.error(e);
      alert('Erreur: impossible d’envoyer le lien.');
    }
  }

  async askResubmission(r: any) {
    const msg = prompt('Message à l’utilisateur (raison / consignes) :', 'Merci de renvoyer une nouvelle photo/vidéo conforme.');
    if (msg === null) return;
    try {
      await this.api.post(`ad-requests/${r._id}/request-resubmission`, { message: msg }).toPromise();
      alert('Demande envoyée à l’utilisateur.');
      this.load();
    } catch (e) {
      console.error(e);
      alert('Erreur: impossible de demander un nouveau média.');
    }
  }

  async approve(r: any) {
    if (!confirm('Approuver cette publicité ?')) return;
    try {
      await this.api.post(`ad-requests/${r._id}/approve`, {}).toPromise();
      this.load();
    } catch (e) {
      console.error(e);
      alert('Erreur: impossible d’approuver.');
    }
  }

  async reject(r: any) {
    const msg = prompt('Raison (optionnel) :', r.adminMessage || '');
    if (msg === null) return;
    try {
      await this.api.post(`ad-requests/${r._id}/reject`, { message: msg }).toPromise();
      this.load();
    } catch (e) {
      console.error(e);
      alert('Erreur: impossible de refuser.');
    }
  }
}

