/**
 * Décode le payload d'un JWT (base64url), compatible avec le format émis par jsonwebtoken côté Node.
 * L'usage direct de atob() sur le segment moyen échoue dès qu'il faut un padding ou des caractères base64url.
 */
export function parseJwtPayload<T extends Record<string, unknown> = Record<string, unknown>>(
  token: string | null | undefined
): T | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (b64.length % 4)) % 4;
    const json = atob(b64 + '='.repeat(pad));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function getJwtRole(token: string | null | undefined): string {
  const p = parseJwtPayload<{ role?: string }>(token);
  return String(p?.role || '').toLowerCase();
}
