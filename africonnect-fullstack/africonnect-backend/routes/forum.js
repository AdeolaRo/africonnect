const express = require('express');
const ForumPost = require('../models/ForumPost');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  const items = await ForumPost.find().sort({ createdAt: -1 });
  res.json(items);
});

router.post('/', auth, async (req, res) => {
  const body = { ...req.body };
  if (Array.isArray(body.imageUrls)) body.imageUrls = body.imageUrls.filter(Boolean).slice(0, 3);
  else if (body.imageUrl && !body.imageUrls) body.imageUrls = [body.imageUrl].filter(Boolean).slice(0, 3);

  const item = new ForumPost({
    ...body,
    userId: String(req.userId),
    authorName: req.userPseudo
  });
  await item.save();
  res.status(201).json(item);
});

// Like / unlike
router.post('/:id/like', auth, async (req, res) => {
  const item = await ForumPost.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });

  const me = String(req.userId);
  const likes = Array.isArray(item.likes) ? item.likes : [];
  const hasLiked = likes.includes(me);
  item.likes = hasLiked ? likes.filter(id => id !== me) : [...likes, me];
  await item.save();

  res.json(item);
});

// Ajouter un commentaire (réponse)
router.post('/:id/comments', auth, async (req, res) => {
  const item = await ForumPost.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });

  const content = String(req.body?.content || '').trim();
  if (!content) return res.status(400).json({ error: 'Contenu requis' });

  item.comments = Array.isArray(item.comments) ? item.comments : [];
  item.comments.push({
    content,
    userId: String(req.userId),
    authorName: req.userPseudo,
    createdAt: new Date()
  });
  await item.save();

  res.status(201).json(item);
});

router.delete('/:id', auth, async (req, res) => {
  const item = await ForumPost.findById(req.params.id);
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