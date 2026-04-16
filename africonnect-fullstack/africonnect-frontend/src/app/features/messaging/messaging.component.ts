import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="messaging-container">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom: 16px;">
        <button class="btn btn-secondary" (click)="goBack()">← Retour</button>
        <h1 style="margin:0;">Messagerie interne</h1>
      </div>
      
      <div class="messaging-layout">
        <!-- Nouveau message -->
        <div class="new-message-card">
          <h3>📨 Nouveau message</h3>
          <div class="form-group">
            <label class="form-label">Destinataire</label>
            <select [(ngModel)]="newMessage.recipient" class="form-control">
              <option value="">Sélectionnez un destinataire</option>
              <option *ngFor="let user of users" [value]="user._id">{{ user.pseudo || 'Utilisateur' }}</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Objet</label>
            <input type="text" [(ngModel)]="newMessage.subject" class="form-control" placeholder="Objet du message">
          </div>
          
          <div class="form-group">
            <label class="form-label">Message</label>
            <textarea [(ngModel)]="newMessage.content" class="form-control" rows="5" placeholder="Votre message..."></textarea>
          </div>
          
          <button class="btn btn-primary" (click)="sendNewMessage()" [disabled]="!canSendMessage()">
            📤 Envoyer le message
          </button>
        </div>
        
        <!-- Messages reçus -->
        <div class="messages-section">
          <h3>📥 Messages reçus</h3>
          <div *ngIf="receivedMessages.length === 0" class="empty-section">
            <p>Vous n'avez pas encore reçu de messages</p>
          </div>
          
          <div *ngFor="let msg of receivedMessages" class="message-card">
            <div class="message-header">
              <div>
                <strong>De: {{ getSenderName(msg.from) }}</strong>
                <div class="message-subject">{{ msg.subject || 'Sans objet' }}</div>
              </div>
              <div class="message-date">{{ msg.timestamp | date:'dd/MM/yyyy HH:mm' }}</div>
            </div>
            <div class="message-content">{{ msg.content }}</div>
            <div class="message-actions">
              <button class="btn btn-secondary btn-sm" (click)="replyToMessage(msg)">↩️ Répondre</button>
              <button class="btn btn-danger btn-sm" (click)="deleteMessage(msg._id)">🗑️ Supprimer</button>
            </div>
          </div>
        </div>
        
        <!-- Messages envoyés -->
        <div class="messages-section">
          <h3>📤 Messages envoyés</h3>
          <div *ngIf="sentMessages.length === 0" class="empty-section">
            <p>Vous n'avez pas encore envoyé de messages</p>
          </div>
          
          <div *ngFor="let msg of sentMessages" class="message-card">
            <div class="message-header">
              <div>
                <strong>À: {{ getRecipientName(msg.to) }}</strong>
                <div class="message-subject">{{ msg.subject || 'Sans objet' }}</div>
              </div>
              <div class="message-date">{{ msg.timestamp | date:'dd/MM/yyyy HH:mm' }}</div>
            </div>
            <div class="message-content">{{ msg.content }}</div>
            <div class="message-actions">
              <button class="btn btn-danger btn-sm" (click)="deleteMessage(msg._id)">🗑️ Supprimer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MessagingComponent implements OnInit {
  users: any[] = [];
  receivedMessages: any[] = [];
  sentMessages: any[] = [];
  
  newMessage = {
    recipient: '',
    subject: '',
    content: ''
  };

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.loadUsers();
    this.loadMessages();
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  loadUsers() {
    this.api.get('user/users').subscribe({
      next: (users: any) => {
        // Exclure l'utilisateur courant
        this.auth.currentUser.subscribe(currentUser => {
          if (currentUser) {
            this.users = users.filter((user: any) => user._id !== currentUser.id);
          } else {
            this.users = users;
          }
        });
      },
      error: (err) => console.error('Error loading users:', err)
    });
  }

  loadMessages() {
    this.api.get('messages/inbox').subscribe({
      next: (data: any) => this.receivedMessages = Array.isArray(data) ? data : [],
      error: (err) => console.error('Error loading inbox:', err)
    });
    this.api.get('messages/sent').subscribe({
      next: (data: any) => this.sentMessages = Array.isArray(data) ? data : [],
      error: (err) => console.error('Error loading sent:', err)
    });
  }

  getSenderName(userId: string): string {
    const user = this.users.find(u => u._id === userId);
    return user ? (user.pseudo || 'Utilisateur') : 'Utilisateur inconnu';
  }

  getRecipientName(userId: string): string {
    const user = this.users.find(u => u._id === userId);
    return user ? (user.pseudo || 'Utilisateur') : 'Utilisateur inconnu';
  }

  canSendMessage(): boolean {
    return !!this.newMessage.recipient && !!this.newMessage.content.trim();
  }

  sendNewMessage() {
    if (!this.canSendMessage()) return;

    const payload = {
      to: this.newMessage.recipient,
      subject: this.newMessage.subject || '',
      content: this.newMessage.content
    };

    this.api.post('messages', payload).subscribe({
      next: (created: any) => {
        this.sentMessages.unshift(created);
        this.newMessage = { recipient: '', subject: '', content: '' };
        alert('✅ Message envoyé avec succès !');
      },
      error: (err) => {
        console.error('Error sending message:', err);
        alert('❌ Erreur lors de l’envoi du message');
      }
    });
  }

  replyToMessage(msg: any) {
    this.newMessage.recipient = msg.from;
    this.newMessage.subject = `Re: ${msg.subject}`;
    this.newMessage.content = `\n\n--- Message original ---\n${msg.content}\n\n`;
    
    // Scroll vers le formulaire
    setTimeout(() => {
      document.querySelector('.new-message-card')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  deleteMessage(messageId: string) {
    if (confirm('Voulez-vous vraiment supprimer ce message ?')) {
      this.api.delete(`messages/${messageId}`).subscribe({
        next: () => {
          this.receivedMessages = this.receivedMessages.filter(msg => msg._id !== messageId);
          this.sentMessages = this.sentMessages.filter(msg => msg._id !== messageId);
          alert('Message supprimé');
        },
        error: (err) => {
          console.error('Error deleting message:', err);
          alert('❌ Erreur lors de la suppression');
        }
      });
    }
  }
}