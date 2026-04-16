const express = require('express');
const MarketplaceItem = require('../models/MarketplaceItem');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  const items = await MarketplaceItem.find().sort({ createdAt: -1 });
  res.json(items);
});

router.post('/', auth, async (req, res) => {
  const item = new MarketplaceItem({
    ...req.body,
    userId: String(req.userId),
    authorName: req.userEmail
  });
  await item.save();
  res.status(201).json(item);
});

router.post('/:id/like', auth, async (req, res) => {
  const item = await MarketplaceItem.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });

  const me = String(req.userId);
  const likes = Array.isArray(item.likes) ? item.likes : [];
  const hasLiked = likes.includes(me);
  item.likes = hasLiked ? likes.filter(id => id !== me) : [...likes, me];
  await item.save();

  res.json(item);
});

router.delete('/:id', auth, async (req, res) => {
  const item = await MarketplaceItem.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (
    String(item.userId) !== String(req.userId) &&
    req.role !== 'admin' &&
    req.role !== 'moderator'
  ) {
    return res.status(403).json({ error: 'Non autorisé' });
  }
  await item.deleteOne();
  res.json({ message: 'Supprimé' });
});

module.exports = router;