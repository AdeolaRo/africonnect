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
  { category: 'Afrique', label: 'RFI - Afrique', rssUrl: 'https://www.rfi.fr/fr/afrique/rss', lang: 'fr' },
  { category: 'Afrique', label: 'France 24 - Afrique', rssUrl: 'https://www.france24.com/fr/afrique/rss', lang: 'fr' },
  // Business
  { category: 'Business', label: 'Jeune Afrique - Économie', rssUrl: 'https://www.jeuneafrique.com/categorie/economie/rss/', lang: 'fr' },
  // Politique
  { category: 'Politique', label: 'Jeune Afrique - Politique', rssUrl: 'https://www.jeuneafrique.com/categorie/politique/rss/', lang: 'fr' },
  // Développement
  { category: 'Développement', label: 'Banque Mondiale - Afrique', rssUrl: 'https://www.banquemondiale.org/fr/region/afr/rss', lang: 'fr' },
  // Carrière
  { category: 'Carrière', label: 'Welcome to the Jungle - Conseils', rssUrl: 'https://www.welcometothejungle.com/fr/collections.rss', lang: 'fr' }
];

const DEFAULT_FEEDS_EN = [
  { category: 'Africa', label: 'BBC - Africa', rssUrl: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', lang: 'en' },
  { category: 'Africa', label: 'RFI - Africa (English)', rssUrl: 'https://www.rfi.fr/en/africa/rss', lang: 'en' },
  { category: 'Africa', label: 'France 24 - Africa', rssUrl: 'https://www.france24.com/en/africa/rss', lang: 'en' },
  { category: 'World', label: 'Al Jazeera - All feeds', rssUrl: 'https://www.aljazeera.com/xml/rss/all.xml', lang: 'en' },
  { category: 'Africa', label: 'Africanews', rssUrl: 'https://www.africanews.com/feed/rss', lang: 'en' }
];

function pickFeedsByLang(feeds, wantLang) {
  const w = wantLang === 'en' ? 'en' : 'fr';
  return (feeds || []).filter(f => {
    const l = f.lang || 'fr';
    if (l === 'all') return true;
    return l === w;
  });
}

async function ensureDefaultFeeds() {
  const count = await RssFeed.countDocuments();
  if (count > 0) return;
  await RssFeed.insertMany(
    DEFAULT_FEEDS.map(f => ({
      label: f.label,
      category: f.category,
      rssUrl: f.rssUrl,
      lang: f.lang || 'fr'
    }))
  );
}

async function ensureEnglishFeeds() {
  const n = await RssFeed.countDocuments({ $or: [{ lang: 'en' }, { lang: 'all' }] });
  if (n > 0) return;
  await RssFeed.insertMany(
    DEFAULT_FEEDS_EN.map(f => ({
      label: f.label,
      category: f.category,
      rssUrl: f.rssUrl,
      lang: f.lang || 'en'
    }))
  );
}

// Liste des feeds : toutes par défaut (admin) ; ?lang=fr|en pour un sous-ensemble
router.get('/feeds', async (req, res) => {
  try {
    await ensureDefaultFeeds();
    await ensureEnglishFeeds();
    const all = await RssFeed.find().sort({ createdAt: -1 });
    const q = (req.query.lang || '').toLowerCase();
    if (q === 'en' || q === 'fr') {
      return res.json(pickFeedsByLang(all, q === 'en' ? 'en' : 'fr'));
    }
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: items agrégés (proxy backend pour éviter CORS côté navigateur) (?lang=fr|en)
router.get('/items', async (req, res) => {
  try {
    const wantLang = (req.query.lang || '').toLowerCase() === 'en' ? 'en' : 'fr';
    await ensureDefaultFeeds();
    if (wantLang === 'en') await ensureEnglishFeeds();
    const all = await RssFeed.find().sort({ createdAt: -1 });
    const feeds = pickFeedsByLang(all, wantLang);
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
    const { label, rssUrl, category, lang } = req.body || {};
    if (!label || !rssUrl) return res.status(400).json({ error: 'label et rssUrl requis' });
    const l = (lang || 'fr').toLowerCase();
    const langVal = l === 'en' ? 'en' : l === 'all' ? 'all' : 'fr';
    const feed = new RssFeed({
      label: String(label).trim(),
      rssUrl: String(rssUrl).trim(),
      category: String(category || '').trim(),
      lang: langVal
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

