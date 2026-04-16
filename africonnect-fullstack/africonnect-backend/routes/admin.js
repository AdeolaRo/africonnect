const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Admin requis' });
  next();
};

router.get('/users', auth, adminOnly, async (req, res) => {
  const users = await User.find().select('-password -verificationToken -resetToken -resetExpires');
  res.json(users);
});

// Création user par admin (email+password+role)
router.post('/users', auth, adminOnly, async (req, res) => {
  try {
    const { email, password, role, verified, pseudo, fullName, city, origin, passions, avatar, bio } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email déjà utilisé' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashed,
      role: role || 'user',
      verified: typeof verified === 'boolean' ? verified : true,
      pseudo,
      fullName,
      city,
      origin,
      passions,
      avatar,
      bio
    });
    await user.save();
    const safe = await User.findById(user._id).select('-password -verificationToken -resetToken -resetExpires');
    res.status(201).json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mise à jour user par admin (profil + role + verified + password optionnel)
router.put('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const {
      email,
      password,
      role,
      verified,
      pseudo,
      fullName,
      city,
      origin,
      passions,
      avatar,
      bio
    } = req.body || {};

    if (email) user.email = email;
    if (typeof role === 'string') user.role = role;
    if (typeof verified === 'boolean') user.verified = verified;

    if (typeof pseudo === 'string') user.pseudo = pseudo;
    if (typeof fullName === 'string') user.fullName = fullName;
    if (typeof city === 'string') user.city = city;
    if (typeof origin === 'string') user.origin = origin;
    if (typeof passions === 'string') user.passions = passions;
    if (typeof avatar === 'string') user.avatar = avatar;
    if (typeof bio === 'string') user.bio = bio;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    const safe = await User.findById(user._id).select('-password -verificationToken -resetToken -resetExpires');
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Suppression user par admin
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    await user.deleteOne();
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/role', auth, adminOnly, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  user.role = req.body.role;
  await user.save();
  const safe = await User.findById(user._id).select('-password -verificationToken -resetToken -resetExpires');
  res.json(safe);
});

module.exports = router;