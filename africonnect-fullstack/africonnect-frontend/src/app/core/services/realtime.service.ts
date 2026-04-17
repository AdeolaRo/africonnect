import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

type RealtimeBadgeState = {
  unreadMessages: number;
  unreadNotifications: number;
};

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private socket: Socket | null = null;

  private badgeSubject = new BehaviorSubject<RealtimeBadgeState>({
    unreadMessages: Number(localStorage.getItem('unreadMessages') || 0),
    unreadNotifications: Number(localStorage.getItem('unreadNotifications') || 0),
  });
  badge$ = this.badgeSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<any[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  constructor(private auth: AuthService, private api: ApiService) {
    this.auth.currentUser.subscribe(user => {
      if (user) this.connect();
      else this.disconnect();
    });
  }

  private setBadge(patch: Partial<RealtimeBadgeState>) {
    const next = { ...this.badgeSubject.value, ...patch };
    this.badgeSubject.next(next);
    localStorage.setItem('unreadMessages', String(next.unreadMessages));
    localStorage.setItem('unreadNotifications', String(next.unreadNotifications));
  }

  connect() {
    const token = this.auth.getToken();
    if (!token) return;
    if (this.socket) return;

    const base = (this.api.getBaseUrl() || '').replace(/\/api$/, '');
    this.socket = io(base, { auth: { token } });

    this.socket.on('new_message', () => {
      this.setBadge({ unreadMessages: this.badgeSubject.value.unreadMessages + 1 });
    });

    this.socket.on('notification', (notif: any) => {
      this.setBadge({ unreadNotifications: this.badgeSubject.value.unreadNotifications + 1 });
      const prev = this.notificationsSubject.value || [];
      this.notificationsSubject.next([notif, ...prev].slice(0, 50));
    });
  }

  disconnect() {
    if (this.socket) {
      try { this.socket.disconnect(); } catch {}
    }
    this.socket = null;
    this.notificationsSubject.next([]);
    this.setBadge({ unreadMessages: 0, unreadNotifications: 0 });
  }

  refreshNotifications() {
    if (!this.auth.isLoggedIn()) return;
    this.api.get('notifications/mine').subscribe({
      next: (items: any) => this.notificationsSubject.next(Array.isArray(items) ? items : []),
      error: () => {}
    });
  }

  markAllNotificationsSeen() {
    // UX requirement: bubble disappears after click
    this.setBadge({ unreadNotifications: 0 });
  }

  clearNotificationsCache() {
    this.notificationsSubject.next([]);
    this.setBadge({ unreadNotifications: 0 });
  }

  clearMessagesBadge() {
    this.setBadge({ unreadMessages: 0 });
  }
}

