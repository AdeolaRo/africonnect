import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { getJwtRole } from '../utils/jwt';

@Injectable({ providedIn: 'root' })
export class StaffGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const token = this.auth.getToken();
    if (!token) {
      this.router.navigate(['/forum']);
      return false;
    }

    const role = getJwtRole(token);
    if (role === 'admin' || role === 'moderator') {
      return true;
    }

    this.router.navigate(['/forum']);
    return false;
  }
}

