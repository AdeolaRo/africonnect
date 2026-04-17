import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export type CityResult = {
  label: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: string;
  lon?: string;
};

@Injectable({ providedIn: 'root' })
export class CityService {
  constructor(private api: ApiService) {}

  search(q: string): Observable<CityResult[]> {
    const term = (q || '').trim();
    if (term.length < 2) return of([]);
    return this.api.get(`geo/cities?q=${encodeURIComponent(term)}`).pipe(
      map((res: any) => (Array.isArray(res) ? res : []) as CityResult[]),
      catchError(() => of([]))
    );
  }
}

