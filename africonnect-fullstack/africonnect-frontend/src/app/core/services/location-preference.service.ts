import { Injectable } from '@angular/core';

const STORAGE = 'africonnect_browse';
const COOKIE = 'ac_loc';

export interface LocationSnapshot {
  continent: string;
  city: string;
}

@Injectable({ providedIn: 'root' })
export class LocationPreferenceService {
  get(): LocationSnapshot {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const p = JSON.parse(raw);
        return {
          continent: String(p?.continent || '').trim(),
          city: String(p?.city || '').trim()
        };
      }
    } catch { /* empty */ }
    return { continent: '', city: '' };
  }

  set(continent: string, city: string) {
    const o: LocationSnapshot = {
      continent: String(continent || '').trim(),
      city: String(city || '').trim()
    };
    try {
      localStorage.setItem(STORAGE, JSON.stringify(o));
      const enc = btoa(encodeURIComponent(JSON.stringify(o)));
      document.cookie = `${COOKIE}=${enc};max-age=31536000;path=/;SameSite=Lax`;
    } catch { /* private mode */ }
  }

  clear() {
    try {
      localStorage.removeItem(STORAGE);
      document.cookie = `${COOKIE}=;max-age=0;path=/`;
    } catch { /* */ }
  }

  applyFromUser(user: { continent?: string; city?: string } | null) {
    if (!user) return;
    const c = String(user.continent || '').trim();
    const t = String(user.city || '').trim();
    const cur = this.get();
    this.set(c || cur.continent, t || cur.city);
  }
}
