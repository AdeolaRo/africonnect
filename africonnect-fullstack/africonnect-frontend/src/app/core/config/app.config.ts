export const FRONTEND_ORIGIN =
  (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : '';

export const API_BASE_URL = (() => {
  // Dev (Angular serve)
  if (typeof window !== 'undefined') {
    const host = window.location?.hostname || '';
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000/api';
  }

  // Prod (domaine acheté)
  return 'https://africanconnect.net/api';
})();

