const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const ForumPost = require('../models/ForumPost');
const MarketplaceItem = require('../models/MarketplaceItem');
const Job = require('../models/Job');
const Solution = require('../models/Solution');
const Solidarity = require('../models/Solidarity');
const Event = require('../models/Event');
const Group = require('../models/Group');
const Message = require('../models/Message');

function sanitizeLinks(input) {
  const arr = Array.isArray(input) ? input : [];
  const out = [];
  for (const item of arr) {
    const url = String(item?.url || '').trim();
    if (!url) continue;
    // Accept only http(s) to keep clickable links safe/predictable
    if (!/^https?:\/\//i.test(url)) continue;
    const label = String(item?.label || '').trim();
    out.push({ ...(label ? { label } : {}), url });
  }
  return out;
}

// Obtenir son profil
router.get('/profile', auth, async (req, res) => {
  const user = await User.findById(req.userId).select('-password');
  res.json(user);
});

// Mettre à jour son profil
router.put('/profile', auth, async (req, res) => {
  const { fullName, pseudo, avatar, city, origin, passions, bio } = req.body;
  await User.findByIdAndUpdate(req.userId, { fullName, pseudo, avatar, city, origin, passions, bio });
  res.json({ message: 'Profil mis à jour' });
});

// Compléter l'onboarding (comptes créés par admin) : changer email/pseudo/mot de passe avant de continuer
router.post('/complete-onboarding', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const currentPassword = String(req.body?.currentPassword || '').trim();
    const newPassword = String(req.body?.newPassword || '').trim();
    const newEmail = String(req.body?.newEmail || '').trim().toLowerCase();
    const newPseudo = String(req.body?.newPseudo || '').trim();

    if (user.mustChangePassword || user.mustChangeEmail) {
      if (!currentPassword) return res.status(400).json({ error: 'Mot de passe actuel requis' });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ error: 'Mot de passe actuel invalide' });
    }

    if (user.mustChangePassword) {
      if (!newPassword) return res.status(400).json({ error: 'Nouveau mot de passe requis' });
      user.password = await bcrypt.hash(newPassword, 10);
      user.mustChangePassword = false;
    }

    if (user.mustChangeEmail) {
      if (!newEmail) return res.status(400).json({ error: 'Nouvel email requis' });
      const existing = await User.findOne({ email: newEmail, _id: { $ne: user._id } });
      if (existing) return res.status(400).json({ error: 'Email déjà utilisé' });
      user.email = newEmail;
      user.mustChangeEmail = false;
    }

    if (user.mustChangePseudo) {
      if (!newPseudo) return res.status(400).json({ error: 'Nouveau pseudo requis' });
      user.pseudo = newPseudo;
      user.mustChangePseudo = false;
    }

    await user.save();

    const pseudo = user.pseudo || user.email?.split('@')?.[0] || 'Utilisateur';
    const token = jwt.sign({
      userId: user._id,
      role: user.role,
      pseudo,
      mustChangePassword: !!user.mustChangePassword,
      mustChangePseudo: !!user.mustChangePseudo,
      mustChangeEmail: !!user.mustChangeEmail,
      termsAcceptedVersion: Number(user.termsAcceptedVersion || 0)
    }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Accept updated terms/conditions (versioned)
router.post('/accept-terms', auth, async (req, res) => {
  try {
    const version = Number(req.body?.version || 0);
    if (!version || version < 1) return res.status(400).json({ error: 'Version requise' });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    user.termsAcceptedVersion = Math.max(Number(user.termsAcceptedVersion || 0), version);
    await user.save();

    const pseudo = user.pseudo || user.email?.split('@')?.[0] || 'Utilisateur';
    const token = jwt.sign({
      userId: user._id,
      role: user.role,
      pseudo,
      mustChangePassword: !!user.mustChangePassword,
      mustChangePseudo: !!user.mustChangePseudo,
      mustChangeEmail: !!user.mustChangeEmail,
      termsAcceptedVersion: Number(user.termsAcceptedVersion || 0)
    }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, role: user.role, termsAcceptedVersion: Number(user.termsAcceptedVersion || 0) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Liste des utilisateurs (pour messagerie) - connecté seulement
router.get('/users', auth, async (req, res) => {
  const users = await User.find().select('-password -verificationToken -resetToken -resetExpires');
  res.json(users);
});

// Obtenir les publications de l'utilisateur (tous types)
router.get('/posts', auth, async (req, res) => {
  const models = [
    { key: 'forum', Model: ForumPost },
    { key: 'marketplace', Model: MarketplaceItem },
    { key: 'jobs', Model: Job },
    { key: 'solutions', Model: Solution },
    { key: 'solidarity', Model: Solidarity },
    { key: 'events', Model: Event },
    { key: 'groups', Model: Group }
  ];
  let allPosts = [];
  for (const entry of models) {
    const posts = await entry.Model.find({ userId: req.userId }).sort({ createdAt: -1 });
    const tagged = posts.map(p => ({ ...p.toObject(), _type: entry.key }));
    allPosts.push(...tagged);
  }
  allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(allPosts);
});

async function findPostById(postId) {
  const list = [
    { key: 'forum', Model: ForumPost },
    { key: 'marketplace', Model: MarketplaceItem },
    { key: 'jobs', Model: Job },
    { key: 'solutions', Model: Solution },
    { key: 'solidarity', Model: Solidarity },
    { key: 'events', Model: Event },
    { key: 'groups', Model: Group }
  ];
  for (const entry of list) {
    const doc = await entry.Model.findById(postId);
    if (doc) return { key: entry.key, doc };
  }
  return null;
}

// Supprimer une publication (tous types) - owner ou admin/moderator
router.delete('/posts/:postId', auth, async (req, res) => {
  const found = await findPostById(req.params.postId);
  if (!found) return res.status(404).json({ error: 'Non trouvé' });
  const { doc } = found;
  if (
    String(doc.userId) !== String(req.userId) &&
    req.role !== 'admin' &&
    req.role !== 'moderator'
  ) return res.status(403).json({ error: 'Non autorisé' });
  await doc.deleteOne();
  res.json({ message: 'Supprimé' });
});

// Modifier une publication (tous types) - owner ou admin/moderator
router.put('/posts/:postId', auth, async (req, res) => {
  const found = await findPostById(req.params.postId);
  if (!found) return res.status(404).json({ error: 'Non trouvé' });
  const { doc } = found;
  if (
    String(doc.userId) !== String(req.userId) &&
    req.role !== 'admin' &&
    req.role !== 'moderator'
  ) return res.status(403).json({ error: 'Non autorisé' });

  const body = { ...(req.body || {}) };
  if (Array.isArray(body.imageUrls)) body.imageUrls = body.imageUrls.filter(Boolean).slice(0, 3);
  else if (body.imageUrl && !body.imageUrls) body.imageUrls = [body.imageUrl].filter(Boolean).slice(0, 3);
  if (Array.isArray(body.links)) body.links = sanitizeLinks(body.links);

  // Only allow updating known fields (best-effort per model)
  const allowed = ['title', 'subject', 'content', 'desc', 'price', 'location', 'company', 'contact', 'category', 'eventDate', 'rules', 'name', 'description', 'imageUrls', 'imageUrl', 'links'];
  for (const k of allowed) {
    if (body[k] !== undefined) doc[k] = body[k];
  }
  await doc.save();
  res.json(doc);
});

// Sauvegarder un post
router.post('/save/:postId', auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user.savedPosts.includes(req.params.postId)) user.savedPosts.push(req.params.postId);
  await user.save();
  res.json({ message: 'Sauvegardé' });
});

// Retirer un post sauvegardé
router.delete('/save/:postId', auth, async (req, res) => {
  const user = await User.findById(req.userId);
  user.savedPosts = user.savedPosts.filter(id => id !== req.params.postId);
  await user.save();
  res.json({ message: 'Retiré' });
});

// Obtenir les posts sauvegardés
router.get('/saved', auth, async (req, res) => {
  const user = await User.findById(req.userId);
  const models = [ForumPost, MarketplaceItem, Job, Solution, Solidarity, Event, Group];
  let saved = [];
  for (const Model of models) {
    const posts = await Model.find({ _id: { $in: user.savedPosts } });
    saved.push(...posts);
  }
  res.json(saved);
});

// Supprimer son compte + données (profil, messages, contenus)
router.delete('/account', auth, async (req, res) => {
  try {
    const userId = String(req.userId);

    // Supprimer messages liés
    await Message.deleteMany({ $or: [{ from: userId }, { to: userId }] });

    // Supprimer contenus créés (tous types)
    const models = [ForumPost, MarketplaceItem, Job, Solution, Solidarity, Event, Group];
    for (const Model of models) {
      await Model.deleteMany({ userId });
    }

    await User.findByIdAndDelete(req.userId);
    res.json({ message: 'Compte supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;