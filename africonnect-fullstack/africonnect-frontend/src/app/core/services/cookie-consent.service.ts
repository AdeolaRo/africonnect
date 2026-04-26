import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const LS = 'ac_cookie_consent_v1';

export type CookieConsent = {
  /** Toujours vrai (nécessaire au site) */
  essential: true;
  /** Mesure d’audience côté client (localStorage) */
  analytics: boolean;
  /** L’utilisateur a fait un choix */
  decided: boolean;
};

@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  private subject = new BehaviorSubject<CookieConsent>(this.read());
  readonly state$ = this.subject.asObservable();

  get(): CookieConsent {
    return this.read();
  }

  private read(): CookieConsent {
    if (typeof localStorage === 'undefined') {
      return { essential: true, analytics: false, decided: false };
    }
    try {
      const raw = localStorage.getItem(LS);
      if (!raw) return { essential: true, analytics: false, decided: false };
      const p = JSON.parse(raw);
      return {
        essential: true,
        analytics: !!p.analytics,
        decided: !!p.decided
      };
    } catch {
      return { essential: true, analytics: false, decided: false };
    }
  }

  acceptEssentialOnly(): void {
    this.save({ essential: true, analytics: false, decided: true });
  }

  acceptAll(): void {
    this.save({ essential: true, analytics: true, decided: true });
  }

  setAnalytics(v: boolean): void {
    const c = this.read();
    this.save({ ...c, analytics: v, decided: true });
  }

  private save(c: CookieConsent): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(LS, JSON.stringify({ analytics: c.analytics, decided: c.decided }));
    this.subject.next(c);
  }
}
