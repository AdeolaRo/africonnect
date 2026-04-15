import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private querySubject = new BehaviorSubject<string>('');
  public query$ = this.querySubject.asObservable();
  setQuery(q: string) { this.querySubject.next(q); }
}