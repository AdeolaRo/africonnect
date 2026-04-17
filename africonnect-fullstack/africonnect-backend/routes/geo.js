const express = require('express');

const router = express.Router();

// Simple in-memory cache + rate limit (best-effort)
const cache = new Map(); // key -> { expiresAt, value }
const lastHitByIp = new Map(); // ip -> ts

function getIp(req) {
  return (
    (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function nowMs() {
  return Date.now();
}

router.get('/cities', async (req, res) => {
  const q = String(req.query?.q || '').trim();
  if (!q || q.length < 2) return res.json([]);

  const ip = getIp(req);
  const last = lastHitByIp.get(ip) || 0;
  if (nowMs() - last < 250) {
    return res.status(429).json({ error: 'Trop de requêtes' });
  }
  lastHitByIp.set(ip, nowMs());

  const key = q.toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > nowMs()) return res.json(cached.value);

  try {
    // Nominatim usage policy requires a valid User-Agent
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?format=jsonv2&addressdetails=1&limit=10&accept-language=fr` +
      `&q=${encodeURIComponent(q)}`;

    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'AfricanConnect/1.0 (contact: admin@africanconnect.net)',
      },
    });
    if (!resp.ok) return res.json([]);
    const data = await resp.json();

    const items = (Array.isArray(data) ? data : []).map((d) => {
      const addr = d?.address || {};
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.county ||
        '';
      const state = addr.state || addr.region || '';
      const country = addr.country || '';
      const label = [city || d?.name || d?.display_name, state, country]
        .filter(Boolean)
        .join(', ');
      return {
        label,
        city: city || d?.name || '',
        state,
        country,
        lat: d?.lat ? String(d.lat) : '',
        lon: d?.lon ? String(d.lon) : '',
      };
    }).filter(i => i.label);

    cache.set(key, { expiresAt: nowMs() + 5 * 60 * 1000, value: items });
    res.json(items);
  } catch {
    res.json([]);
  }
});

module.exports = router;

