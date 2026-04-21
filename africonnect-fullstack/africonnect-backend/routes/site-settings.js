const express = require('express');
const auth = require('../middleware/auth');
const SiteSettings = require('../models/SiteSettings');

const router = express.Router();

async function getSingleton() {
  let doc = await SiteSettings.findOne();
  if (!doc) doc = await new SiteSettings({ termsVersion: 1 }).save();
  return doc;
}

router.get('/public', async (_req, res) => {
  const doc = await getSingleton();
  res.json({ termsVersion: Number(doc.termsVersion || 1) });
});

router.post('/terms-version/bump', auth, async (req, res) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Admin requis' });
  const doc = await getSingleton();
  doc.termsVersion = Number(doc.termsVersion || 1) + 1;
  await doc.save();
  res.json({ termsVersion: Number(doc.termsVersion || 1) });
});

module.exports = router;

