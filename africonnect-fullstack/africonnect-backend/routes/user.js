const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const ForumPost = require('../models/ForumPost');
const MarketplaceItem = require('../models/MarketplaceItem');
const Job = require('../models/Job');
const Solution = require('../models/Solution');
const Solidarity = require('../models/Solidarity');
const Event = require('../models/Event');
const Group = require('../models/Group');

// Obtenir son profil
router.get('/profile', auth, async (req, res) => {
  const user = await User.findById(req.userId).select('-password');
  res.json(user);
});

// Mettre à jour son profil
router.put('/profile', auth, async (req, res) => {
  const { fullName, pseudo, avatar, city, origin, passions } = req.body;
  await User.findByIdAndUpdate(req.userId, { fullName, pseudo, avatar, city, origin, passions });
  res.json({ message: 'Profil mis à jour' });
});

// Obtenir les publications de l'utilisateur (tous types)
router.get('/posts', auth, async (req, res) => {
  const models = [ForumPost, MarketplaceItem, Job, Solution, Solidarity, Event, Group];
  let allPosts = [];
  for (const Model of models) {
    const posts = await Model.find({ userId: req.userId }).sort({ createdAt: -1 });
    allPosts.push(...posts);
  }
  res.json(allPosts);
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

module.exports = router;