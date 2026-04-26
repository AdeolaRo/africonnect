const jwt = require('jsonwebtoken');
const AccessLog = require('../models/AccessLog');

const SKIP_PREFIXES = ['/api/health'];

function getOptionalUserId(req) {
  const raw = req.header('Authorization') || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId || null;
  } catch {
    return null;
  }
}

function clientIp(req) {
  const xff = (req.headers['x-forwarded-for'] || '').toString();
  const first = xff.split(',')[0].trim();
  if (first) return first.slice(0, 80);
  const ip = req.ip || req.connection?.remoteAddress || '';
  return String(ip).slice(0, 80);
}

/**
 * Enregistre chaque requête API (hors health). Asynchrone, ne bloque pas la réponse.
 */
function accessLogMiddleware(req, res, next) {
  const url = String(req.originalUrl || req.url || '');
  if (req.method === 'OPTIONS') return next();
  if (!url.startsWith('/api')) return next();
  for (const p of SKIP_PREFIXES) {
    if (url.startsWith(p) || url === p) return next();
  }

  const path = url.split('?')[0].slice(0, 600);
  const userId = getOptionalUserId(req);

  setImmediate(() => {
    AccessLog.create({
      ip: clientIp(req),
      method: String(req.method || 'GET'),
      path,
      userAgent: String(req.get('user-agent') || '').slice(0, 500),
      referer: String(req.get('referer') || '').slice(0, 500),
      userId: userId || undefined
    }).catch(() => {});
  });

  next();
}

module.exports = { accessLogMiddleware, getOptionalUserId };
