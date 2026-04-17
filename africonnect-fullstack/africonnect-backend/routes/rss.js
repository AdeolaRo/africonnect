const express = require('express');
const auth = require('../middleware/auth');
const RssFeed = require('../models/RssFeed');
const Parser = require('rss-parser');

const router = express.Router();
const parser = new Parser({ timeout: 10000 });

const adminOnly = (req, res, next) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Admin requis' });
  next();
};

const DEFAULT_FEEDS = [
  // Afrique
  { category: 'Afrique', label: 'RFI - Afrique', rssUrl: 'https://www.rfi.fr/fr/afrique/rss' },
  { category: 'Afrique', label: 'France 24 - Afrique', rssUrl: 'https://www.france24.com/fr/afrique/rss' },
  // Business
  { category: 'Business', label: 'Jeune Afrique - Économie', rssUrl: 'https://www.jeuneafrique.com/categorie/economie/rss/' },
  // Politique
  { category: 'Politique', label: 'Jeune Afrique - Politique', rssUrl: 'https://www.jeuneafrique.com/categorie/politique/rss/' },
  // Développement
  { category: 'Développement', label: 'Banque Mondiale - Afrique', rssUrl: 'https://www.banquemondiale.org/fr/region/afr/rss' },
  // Carrière
  { category: 'Carrière', label: 'Welcome to the Jungle - Conseils', rssUrl: 'https://www.welcometothejungle.com/fr/collections.rss' },
];

async function ensureDefaultFeeds() {
  const count = await RssFeed.countDocuments();
  if (count > 0) return;
  await RssFeed.insertMany(DEFAULT_FEEDS.map(f => ({
    label: f.label,
    category: f.category,
    rssUrl: f.rssUrl
  })));
}

// Public: liste des feeds configurés
router.get('/feeds', async (req, res) => {
  try {
    await ensureDefaultFeeds();
    const feeds = await RssFeed.find().sort({ createdAt: -1 });
    res.json(feeds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: items agrégés (proxy backend pour éviter CORS côté navigateur)
router.get('/items', async (req, res) => {
  try {
    await ensureDefaultFeeds();
    const feeds = await RssFeed.find().sort({ createdAt: -1 });
    const maxPerFeed = Math.max(1, Math.min(10, Number(req.query.maxPerFeed || 3)));
    const maxTotal = Math.max(1, Math.min(30, Number(req.query.maxTotal || 10)));

    const results = await Promise.all((feeds || []).map(async (f) => {
      try {
        const parsed = await parser.parseURL(f.rssUrl);
        const items = (parsed.items || []).slice(0, maxPerFeed).map(it => ({
          title: it.title || '',
          link: it.link || '',
          pubDate: it.pubDate || it.isoDate || '',
          source: f.label,
          category: f.category || ''
        }));
        return items;
      } catch {
        return [];
      }
    }));

    const items = results.flat()
      .filter(i => i?.title && i?.link)
      .sort((a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime())
      .slice(0, maxTotal);

    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: ajouter un feed
router.post('/feeds', auth, adminOnly, async (req, res) => {
  try {
    const { label, rssUrl, category } = req.body || {};
    if (!label || !rssUrl) return res.status(400).json({ error: 'label et rssUrl requis' });
    const feed = new RssFeed({
      label: String(label).trim(),
      rssUrl: String(rssUrl).trim(),
      category: String(category || '').trim(),
    });
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

