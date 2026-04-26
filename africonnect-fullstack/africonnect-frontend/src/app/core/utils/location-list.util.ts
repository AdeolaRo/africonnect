import { SearchState } from '../services/search.service';
import { LocationSnapshot } from '../services/location-preference.service';

function itemDisplayCity(item: any): string {
  return String(item?.city || item?.location || '').trim();
}

function itemContinent(item: any): string {
  return String(item?.continent || '').trim();
}

function textMatch(item: any, q: string): boolean {
  if (!q?.trim()) return true;
  return JSON.stringify(item).toLowerCase().includes(q.toLowerCase());
}

function locationFilterMatch(item: any, filterContinent: string, filterCity: string): boolean {
  const fc = (filterContinent || '').trim();
  const fv = (filterCity || '').trim().toLowerCase();
  if (!fc && !fv) return true;
  const ic = itemContinent(item);
  const it = itemDisplayCity(item).toLowerCase();
  if (fc && ic && ic !== fc) return false;
  if (fv && !it.includes(fv) && it !== fv) return false;
  return true;
}

function sortPreferLocal<T>(items: T[], pref: LocationSnapshot): T[] {
  if (!pref.continent && !pref.city) return items;
  const pc = pref.continent.trim();
  const pv = pref.city.trim().toLowerCase();
  if (!pc && !pv) return items;
  const first: T[] = [];
  const rest: T[] = [];
  for (const it of items) {
    const ic = itemContinent(it as any);
    const iv = itemDisplayCity(it as any).toLowerCase();
    const contOk = !pc || ic === pc;
    const cityOk = !pv || (iv && (iv.includes(pv) || iv === pv));
    if (contOk && cityOk) first.push(it);
    else rest.push(it);
  }
  return [...first, ...rest];
}

/** Filtre texte, filtres zone, option tri « proche de vous » (préférence navigateur) */
export function applyListSearchFilters<T extends object>(
  items: T[],
  search: SearchState,
  userLoc: LocationSnapshot
): T[] {
  const q = search.query || '';
  let out = items.filter((i) => textMatch(i, q));
  out = out.filter((i) => locationFilterMatch(i, search.filterContinent, search.filterCity));
  if (search.preferLocal) {
    out = sortPreferLocal(out, userLoc);
  }
  return out;
}

export function formatLocationLine(item: any, continentLabel: (c: string) => string): string {
  const city = itemDisplayCity(item);
  const cont = itemContinent(item);
  if (!city && !cont) return '';
  if (city && cont) return `${city} · ${continentLabel(cont)}`;
  if (city) return city;
  return continentLabel(cont);
}
