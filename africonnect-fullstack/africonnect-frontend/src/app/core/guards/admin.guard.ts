import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate(): boolean {
    const token = this.auth.getToken();
    if (!token) return false;
    const payload: any = JSON.parse(atob(token.split('.')[1]));
    if (payload.role === 'admin') return true;
    this.router.navigate(['/forum']);
    return false;
  }
}