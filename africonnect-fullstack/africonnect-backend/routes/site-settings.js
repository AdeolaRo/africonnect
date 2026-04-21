const express = require('express');
const auth = require('../middleware/auth');
const SiteSettings = require('../models/SiteSettings');

const router = express.Router();

function stripDangerousHtml(html) {
  return String(html || '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

async function getSingleton() {
  let doc = await SiteSettings.findOne();
  if (!doc) doc = await new SiteSettings({ termsVersion: 1 }).save();
  return doc;
}

router.get('/public', async (_req, res) => {
  const doc = await getSingleton();
  res.json({
    termsVersion: Number(doc.termsVersion || 1),
    termsHtmlFr: doc.termsHtmlFr || '',
    termsHtmlEn: doc.termsHtmlEn || ''
  });
});

router.get('/admin', auth, async (req, res) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Admin requis' });
  const doc = await getSingleton();
  res.json({
    termsVersion: Number(doc.termsVersion || 1),
    termsHtmlFr: doc.termsHtmlFr || '',
    termsHtmlEn: doc.termsHtmlEn || ''
  });
});

router.put('/terms-content', auth, async (req, res) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Admin requis' });
  const { termsHtmlFr, termsHtmlEn } = req.body || {};
  const doc = await getSingleton();
  if (typeof termsHtmlFr === 'string') doc.termsHtmlFr = stripDangerousHtml(termsHtmlFr);
  if (typeof termsHtmlEn === 'string') doc.termsHtmlEn = stripDangerousHtml(termsHtmlEn);
  await doc.save();
  res.json({
    termsVersion: Number(doc.termsVersion || 1),
    termsHtmlFr: doc.termsHtmlFr || '',
    termsHtmlEn: doc.termsHtmlEn || ''
  });
});

router.post('/terms-publish', auth, async (req, res) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Admin requis' });
  const { termsHtmlFr, termsHtmlEn } = req.body || {};
  const doc = await getSingleton();
  if (typeof termsHtmlFr === 'string') doc.termsHtmlFr = stripDangerousHtml(termsHtmlFr);
  if (typeof termsHtmlEn === 'string') doc.termsHtmlEn = stripDangerousHtml(termsHtmlEn);
  doc.termsVersion = Number(doc.termsVersion || 1) + 1;
  await doc.save();
  res.json({
    termsVersion: Number(doc.termsVersion || 1),
    termsHtmlFr: doc.termsHtmlFr || '',
    termsHtmlEn: doc.termsHtmlEn || ''
  });
});

router.post('/terms-version/bump', auth, async (req, res) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Admin requis' });
  const doc = await getSingleton();
  doc.termsVersion = Number(doc.termsVersion || 1) + 1;
  await doc.save();
  res.json({ termsVersion: Number(doc.termsVersion || 1) });
});

module.exports = router;
