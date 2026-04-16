import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { API_BASE_URL } from '../config/app.config';

export interface User { id: string; pseudo: string; role: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${API_BASE_URL}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload: any = JSON.parse(atob(token.split('.')[1]));
        this.currentUserSubject.next({ id: payload.userId, pseudo: payload.pseudo || 'Utilisateur', role: payload.role });
      } catch(e) { this.logout(); }
    }
  }

  login(email: string, password: string): Promise<void> {
    console.log('AuthService login:', email);
    console.log('Request URL:', this.apiUrl + '/login');
    console.log('Request body:', { email, password });
    
    return this.http.post<{ token: string, role: string }>(this.apiUrl + '/login', { email, password })
      .pipe(tap(res => {
        console.log('Login successful:', res);
        localStorage.setItem('token', res.token);
        const payload: any = JSON.parse(atob(res.token.split('.')[1]));
        this.currentUserSubject.next({ id: payload.userId, pseudo: payload.pseudo || 'Utilisateur', role: res.role });
      }))
      .toPromise()
      .then(() => {})
      .catch(err => { 
        console.error('Login error details:', err);
        console.error('Login error status:', err.status);
        console.error('Login error statusText:', err.statusText);
        console.error('Login error url:', err.url);
        console.error('Login error object:', err.error);
        
        // Handle different error formats
        let errorMessage = 'Erreur de connexion';
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.error) {
            errorMessage = err.error.error;
          } else if (err.error.message) {
            errorMessage = err.error.message;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        console.error('Login error message:', errorMessage);
        throw errorMessage; 
      });
  }

  register(email: string, password: string, profile?: { pseudo?: string; fullName?: string; city?: string }): Promise<void> {
    console.log('AuthService register:', email);
    return this.http.post(this.apiUrl + '/register', { email, password, ...(profile || {}) })
      .toPromise()
      .then(() => {})
      .catch(err => { 
        console.error('Register error details:', err);
        console.error('Register error object:', err.error);
        
        // Handle different error formats
        let errorMessage = "Erreur lors de l'inscription";
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.error) {
            errorMessage = err.error.error;
          } else if (err.error.message) {
            errorMessage = err.error.message;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        console.error('Register error message:', errorMessage);
        throw errorMessage; 
      });
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null { return localStorage.getItem('token'); }
  isLoggedIn(): boolean { return !!this.getToken(); }
}