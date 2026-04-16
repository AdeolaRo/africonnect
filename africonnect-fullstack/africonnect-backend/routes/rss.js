const express = require('express');
const auth = require('../middleware/auth');
const RssFeed = require('../models/RssFeed');

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Admin requis' });
  next();
};

// Public: liste des feeds configurés
router.get('/feeds', async (req, res) => {
  try {
    const feeds = await RssFeed.find().sort({ createdAt: -1 });
    res.json(feeds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: ajouter un feed
router.post('/feeds', auth, adminOnly, async (req, res) => {
  try {
    const { label, rssUrl } = req.body || {};
    if (!label || !rssUrl) return res.status(400).json({ error: 'label et rssUrl requis' });
    const feed = new RssFeed({ label: String(label).trim(), rssUrl: String(rssUrl).trim() });
    await feed.save();
    res.status(201).json(feed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: supprimer un feed
router.delete('/feeds/:id', auth, adminOnly, async (req, res) => {
  try {
    const feed = await RssFeed.findById(req.params.id);
    if (!feed) return res.status(404).json({ error: 'Feed non trouvé' });
    await feed.deleteOne();
    res.json({ message: 'Feed supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

