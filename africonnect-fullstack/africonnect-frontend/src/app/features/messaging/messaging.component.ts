import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="display:grid; grid-template-columns:280px 1fr; gap:24px; height:70vh;">
      <div style="background:var(--surface); border-radius:24px; padding:16px; overflow-y:auto;">
        <h3>Utilisateurs</h3>
        <div *ngFor="let user of users" style="padding:12px; cursor:pointer; border-radius:16px; margin-bottom:8px;" (click)="selectUser(user)">
          {{ user.email }}
        </div>
      </div>
      <div style="background:var(--surface); border-radius:24px; padding:16px; display:flex; flex-direction:column;">
        <div *ngIf="selectedUser">
          <h3>Discussion avec {{ selectedUser.email }}</h3>
          <div #messageContainer style="flex:1; overflow-y:auto; margin-bottom:16px;">
            <div *ngFor="let msg of messages" [style.textAlign]="msg.from === currentUserId ? 'right' : 'left'">
              <strong>{{ msg.from === currentUserId ? 'Moi' : selectedUser.email }}</strong>: {{ msg.content }}
              <span style="font-size:0.7rem;">{{ msg.timestamp | date:'shortTime' }}</span>
            </div>
          </div>
          <div style="display:flex; gap:12px;">
            <input type="text" [(ngModel)]="newMessage" placeholder="Votre message..." style="flex:1; padding:12px; border-radius:40px;">
            <button class="btn btn-primary" (click)="sendMessage()">Envoyer</button>
          </div>
        </div>
        <div *ngIf="!selectedUser" style="text-align:center; padding:48px;">Sélectionnez un utilisateur</div>
      </div>
    </div>
  `
})
export class MessagingComponent implements OnInit, OnDestroy {
  users: any[] = [];
  selectedUser: any = null;
  messages: any[] = [];
  newMessage = '';
  currentUserId = '';
  private socket: Socket | null = null;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    const token = this.auth.getToken();
    if (token) {
      this.socket = io('http://localhost:3000', { auth: { token } });
      this.socket.on('new_message', (msg: any) => {
        if (this.selectedUser && (msg.from === this.selectedUser.id || msg.to === this.selectedUser.id)) {
          this.messages.push(msg);
          setTimeout(() => this.scrollToBottom(), 100);
        }
      });
    }
    this.api.get('admin/users').subscribe((users: any) => this.users = users);
    const payload: any = JSON.parse(atob(token!.split('.')[1]));
    this.currentUserId = payload.userId;
  }

  selectUser(user: any) {
    this.selectedUser = user;
    this.api.get(`messages/${user.id}`).subscribe((msgs: any) => {
      this.messages = msgs;
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedUser) return;
    this.socket?.emit('private_message', { toUserId: this.selectedUser.id, content: this.newMessage });
    this.messages.push({ from: this.currentUserId, to: this.selectedUser.id, content: this.newMessage, timestamp: new Date() });
    this.newMessage = '';
    setTimeout(() => this.scrollToBottom(), 100);
  }

  scrollToBottom() {
    const container = document.querySelector('[messageContainer]');
    if (container) container.scrollTop = container.scrollHeight;
  }

  ngOnDestroy() { if (this.socket) this.socket.disconnect(); }
}