import { SearchService } from '../services/search.service';
import { LocationPreferenceService } from '../services/location-preference.service';
import { applyListSearchFilters } from './location-list.util';

export function applySectionListFilters(
  items: any[],
  search: SearchService,
  loc: LocationPreferenceService
): any[] {
  const st = search.snapshot;
  return applyListSearchFilters(
    items as object[],
    { ...st, query: st.query || '' },
    st.preferLocal ? loc.get() : { continent: '', city: '' }
  );
}
