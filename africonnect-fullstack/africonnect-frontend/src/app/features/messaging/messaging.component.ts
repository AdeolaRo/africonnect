import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { RealtimeService } from '../../core/services/realtime.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TranslateModule],
  template: `
    <div class="messaging-container">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom: 16px;">
        <button class="btn btn-secondary" (click)="goBack()">{{ 'common.back' | translate }}</button>
        <h1 style="margin:0;">{{ 'messaging.title' | translate }}</h1>
      </div>
      
      <div class="messaging-layout">
        <!-- Nouveau message -->
        <div class="new-message-card">
          <h3>📨 {{ 'messaging.newMessage' | translate }}</h3>
          <div class="form-group">
            <label class="form-label">{{ 'messaging.recipient' | translate }}</label>
            <select [(ngModel)]="newMessage.recipient" class="form-control">
              <option value="">{{ 'messaging.selectRecipient' | translate }}</option>
              <option *ngFor="let user of users" [value]="user._id">{{ user.pseudo || ('messaging.user' | translate) }}</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">{{ 'messaging.subject' | translate }}</label>
            <input type="text" [(ngModel)]="newMessage.subject" class="form-control" [placeholder]="'messaging.subjectPlaceholder' | translate">
          </div>
          
          <div class="form-group">
            <label class="form-label">{{ 'messaging.message' | translate }}</label>
            <textarea [(ngModel)]="newMessage.content" class="form-control" rows="5" [placeholder]="'messaging.messagePlaceholder' | translate"></textarea>
          </div>
          
          <button class="btn btn-primary" (click)="sendNewMessage()" [disabled]="!canSendMessage()">
            📤 {{ 'messaging.send' | translate }}
          </button>
        </div>
        
        <!-- Messages reçus -->
        <div class="messages-section">
          <h3>📥 {{ 'messaging.inbox' | translate }}</h3>
          <div *ngIf="receivedMessages.length === 0" class="empty-section">
            <p>{{ 'messaging.noInbox' | translate }}</p>
          </div>
          
          <button *ngFor="let msg of receivedMessages"
                  type="button"
                  class="message-row"
                  (click)="openMessage(msg, 'received')">
            <div style="min-width:0;">
              <div style="font-weight:800;">{{ getSenderName(msg.from) }}</div>
              <div class="text-muted" style="font-size:0.95rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                {{ msg.subject || ('messaging.noSubject' | translate) }}
              </div>
            </div>
            <div class="text-muted" style="font-size:0.85rem; white-space:nowrap;">
              {{ msg.timestamp | date:'dd/MM/yyyy HH:mm' }}
            </div>
          </button>
        </div>
        
        <!-- Messages envoyés -->
        <div class="messages-section">
          <h3>📤 {{ 'messaging.sent' | translate }}</h3>
          <div *ngIf="sentMessages.length === 0" class="empty-section">
            <p>{{ 'messaging.noSent' | translate }}</p>
          </div>
          
          <button *ngFor="let msg of sentMessages"
                  type="button"
                  class="message-row"
                  (click)="openMessage(msg, 'sent')">
            <div style="min-width:0;">
              <div style="font-weight:800;">{{ getRecipientName(msg.to) }}</div>
              <div class="text-muted" style="font-size:0.95rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                {{ msg.subject || ('messaging.noSubject' | translate) }}
              </div>
            </div>
            <div class="text-muted" style="font-size:0.85rem; white-space:nowrap;">
              {{ msg.timestamp | date:'dd/MM/yyyy HH:mm' }}
            </div>
          </button>
        </div>
      </div>
    </div>

    <app-modal [(visible)]="messageModalVisible" [title]="messageModalTitle">
      <div *ngIf="selectedMessage">
        <div class="text-muted" style="margin-bottom:10px;">
          <div *ngIf="selectedBox === 'received'"><strong>{{ 'messaging.from' | translate }}</strong>: {{ getSenderName(selectedMessage.from) }}</div>
          <div *ngIf="selectedBox === 'sent'"><strong>{{ 'messaging.to' | translate }}</strong>: {{ getRecipientName(selectedMessage.to) }}</div>
          <div><strong>{{ 'messaging.date' | translate }}</strong>: {{ selectedMessage.timestamp | date:'dd/MM/yyyy HH:mm' }}</div>
        </div>
        <div style="font-weight:900; margin-bottom:10px;">{{ selectedMessage.subject || ('messaging.noSubject' | translate) }}</div>
        <div style="white-space:pre-wrap; padding:12px; border-radius:12px; border:1px solid var(--border); background:var(--surface-2);">
          {{ selectedMessage.content }}
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap; margin-top:12px;">
          <button class="btn btn-danger btn-sm" (click)="deleteMessage(selectedMessage._id)">🗑️ {{ 'common.delete' | translate }}</button>
          <button *ngIf="selectedBox === 'received'" class="btn btn-primary btn-sm" (click)="replyToMessage(selectedMessage)">
            ↩️ {{ 'messaging.reply' | translate }}
          </button>
          <button class="btn btn-secondary btn-sm" (click)="messageModalVisible=false">{{ 'common.close' | translate }}</button>
        </div>
      </div>
    </app-modal>
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

  messageModalVisible = false;
  selectedMessage: any = null;
  selectedBox: 'received' | 'sent' = 'received';
  messageModalTitle = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private realtime: RealtimeService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadMessages();
    this.realtime.clearMessagesBadge();
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
    return user ? (user.pseudo || this.translate.instant('messaging.user')) : this.translate.instant('messaging.unknownUser');
  }

  getRecipientName(userId: string): string {
    const user = this.users.find(u => u._id === userId);
    return user ? (user.pseudo || this.translate.instant('messaging.user')) : this.translate.instant('messaging.unknownUser');
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
        alert('✅ ' + this.translate.instant('messaging.sentOk'));
      },
      error: (err) => {
        console.error('Error sending message:', err);
        alert('❌ ' + this.translate.instant('messaging.sentErr'));
      }
    });
  }

  replyToMessage(msg: any) {
    this.newMessage.recipient = msg.from;
    this.newMessage.subject = `Re: ${msg.subject}`;
    this.newMessage.content = `\n\n--- Message original ---\n${msg.content}\n\n`;
    this.messageModalVisible = false;
    
    // Scroll vers le formulaire
    setTimeout(() => {
      document.querySelector('.new-message-card')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  openMessage(msg: any, box: 'received' | 'sent') {
    this.selectedMessage = msg;
    this.selectedBox = box;
    this.messageModalTitle = box === 'received'
      ? this.translate.instant('messaging.modalReceived')
      : this.translate.instant('messaging.modalSent');
    this.messageModalVisible = true;
  }

  deleteMessage(messageId: string) {
    if (confirm(this.translate.instant('messaging.deleteConfirm'))) {
      this.api.delete(`messages/${messageId}`).subscribe({
        next: () => {
          this.receivedMessages = this.receivedMessages.filter(msg => msg._id !== messageId);
          this.sentMessages = this.sentMessages.filter(msg => msg._id !== messageId);
          if (this.selectedMessage?._id === messageId) {
            this.messageModalVisible = false;
            this.selectedMessage = null;
          }
          alert(this.translate.instant('messaging.deleted'));
        },
        error: (err) => {
          console.error('Error deleting message:', err);
          alert('❌ ' + this.translate.instant('messaging.deleteErr'));
        }
      });
    }
  }
}