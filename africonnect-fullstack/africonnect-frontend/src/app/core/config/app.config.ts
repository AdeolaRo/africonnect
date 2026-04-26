export const FRONTEND_ORIGIN =
  (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : '';

/** URL publique de prod (si pas de `window`, ex. prerender) — alignée sur le domaine Nginx. */
export const DEFAULT_SITE_CANONICAL_ORIGIN = 'https://africanconnect.net';

export function getCanonicalOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return DEFAULT_SITE_CANONICAL_ORIGIN;
}

export const API_BASE_URL = (() => {
  // Dev (Angular serve)
  if (typeof window !== 'undefined') {
    const host = window.location?.hostname || '';
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000/api';
  }

  // Prod (domaine acheté)
  return 'https://africanconnect.net/api';
})();

