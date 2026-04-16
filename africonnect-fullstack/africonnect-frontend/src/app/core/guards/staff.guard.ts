import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class StaffGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const token = this.auth.getToken();
    if (!token) {
      this.router.navigate(['/forum']);
      return false;
    }

    try {
      const payload: any = JSON.parse(atob(token.split('.')[1]));
      const role = payload?.role;
      if (role === 'admin' || role === 'moderator') return true;
    } catch {
      // ignore
    }

    this.router.navigate(['/forum']);
    return false;
  }
}

