import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

export interface User { id: string; email: string; role: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload: any = JSON.parse(atob(token.split('.')[1]));
        this.currentUserSubject.next({ id: payload.userId, email: payload.email, role: payload.role });
      } catch(e) { this.logout(); }
    }
  }

  login(email: string, password: string): Promise<void> {
    return this.http.post<{ token: string, role: string }>(this.apiUrl + '/login', { email, password })
      .pipe(tap(res => {
        localStorage.setItem('token', res.token);
        const payload: any = JSON.parse(atob(res.token.split('.')[1]));
        this.currentUserSubject.next({ id: payload.userId, email, role: res.role });
      }))
      .toPromise()
      .then(() => {})
      .catch(err => { throw err.error?.error || err.message; });
  }

  register(email: string, password: string): Promise<void> {
    return this.http.post(this.apiUrl + '/register', { email, password })
      .toPromise()
      .then(() => {})
      .catch(err => { throw err.error?.error || err.message; });
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null { return localStorage.getItem('token'); }
  isLoggedIn(): boolean { return !!this.getToken(); }
}