const express = require('express');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

router.get('/mine', auth, async (req, res) => {
  const items = await Notification.find({ userId: String(req.userId) }).sort({ createdAt: -1 }).limit(50);
  res.json(items);
});

router.post('/:id/read', auth, async (req, res) => {
  const item = await Notification.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (String(item.userId) !== String(req.userId)) return res.status(403).json({ error: 'Non autorisé' });
  item.read = true;
  await item.save();
  res.json(item);
});

module.exports = router;

