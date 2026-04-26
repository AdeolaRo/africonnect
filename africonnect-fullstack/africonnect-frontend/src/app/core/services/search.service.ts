import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

export interface SearchState {
  query: string;
  filterContinent: string;
  filterCity: string;
  /** Met en tête les contenus qui correspondent à la préf. lieu (ville + continent) enregistrée */
  preferLocal: boolean;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private _state = new BehaviorSubject<SearchState>({
    query: '',
    filterContinent: '',
    filterCity: '',
    preferLocal: true
  });

  /** État complet (mots-clés + critères) */
  readonly state$: Observable<SearchState> = this._state.asObservable();

  /** Rétrocompat : seulement la requête texte */
  readonly query$: Observable<string> = this._state.pipe(
    map((s) => s.query),
    distinctUntilChanged()
  );

  get snapshot(): SearchState {
    return { ...this._state.value };
  }

  setQuery(q: string) {
    this._state.next({ ...this._state.value, query: q || '' });
  }

  setFilters(partial: Partial<Pick<SearchState, 'filterContinent' | 'filterCity' | 'preferLocal'>>) {
    this._state.next({ ...this._state.value, ...partial });
  }

  clearLocationFilters() {
    this.setFilters({ filterContinent: '', filterCity: '' });
  }
}
