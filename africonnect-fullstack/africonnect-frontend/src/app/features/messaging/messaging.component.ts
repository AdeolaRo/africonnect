import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="messaging-container">
      <h1>Messagerie interne</h1>
      
      <div class="messaging-layout">
        <!-- Nouveau message -->
        <div class="new-message-card">
          <h3>📨 Nouveau message</h3>
          <div class="form-group">
            <label class="form-label">Destinataire</label>
            <select [(ngModel)]="newMessage.recipient" class="form-control">
              <option value="">Sélectionnez un destinataire</option>
              <option *ngFor="let user of users" [value]="user._id">{{ user.pseudo || user.email }} ({{ user.email }})</option>
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

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.loadUsers();
    this.loadMessages();
  }

  loadUsers() {
    this.api.get('admin/users').subscribe({
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
    // Dans une vraie implémentation, on aurait des endpoints API pour les messages
    // Pour l'instant, on simule avec des données locales
    this.receivedMessages = [
      {
        _id: '1',
        from: 'other-user-id',
        subject: 'Bienvenue sur Africonnect',
        content: 'Bonjour et bienvenue sur notre plateforme ! Nous sommes ravis de vous compter parmi nous.',
        timestamp: new Date('2026-04-15T10:30:00')
      }
    ];
    
    this.sentMessages = [
      {
        _id: '2',
        to: 'other-user-id',
        subject: 'Question sur le forum',
        content: 'Bonjour, j\'ai une question concernant votre publication sur le forum.',
        timestamp: new Date('2026-04-15T14:45:00')
      }
    ];
  }

  getSenderName(userId: string): string {
    const user = this.users.find(u => u._id === userId);
    return user ? (user.pseudo || user.email) : 'Utilisateur inconnu';
  }

  getRecipientName(userId: string): string {
    const user = this.users.find(u => u._id === userId);
    return user ? (user.pseudo || user.email) : 'Utilisateur inconnu';
  }

  canSendMessage(): boolean {
    return !!this.newMessage.recipient && !!this.newMessage.content.trim();
  }

  sendNewMessage() {
    if (!this.canSendMessage()) return;
    
    // Dans une vraie implémentation, on enverrait au backend
    const newMsg = {
      _id: Date.now().toString(),
      to: this.newMessage.recipient,
      subject: this.newMessage.subject,
      content: this.newMessage.content,
      timestamp: new Date()
    };
    
    this.sentMessages.unshift(newMsg);
    
    // Réinitialiser le formulaire
    this.newMessage = {
      recipient: '',
      subject: '',
      content: ''
    };
    
    alert('✅ Message envoyé avec succès !');
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
      // Dans une vraie implémentation, on appellerait l'API
      this.receivedMessages = this.receivedMessages.filter(msg => msg._id !== messageId);
      this.sentMessages = this.sentMessages.filter(msg => msg._id !== messageId);
      alert('Message supprimé');
    }
  }
}