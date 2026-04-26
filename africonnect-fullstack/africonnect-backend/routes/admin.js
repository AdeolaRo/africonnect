const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const AccessLog = require('../models/AccessLog');
const { logSecurityAudit } = require('../utils/securityAudit');

const router = express.Router();

const VALID_ROLES = ['user', 'moderator', 'admin'];

const adminOnly = (req, res, next) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Admin requis' });
  next();
};

function normalizeRole(r) {
  const s = String(r || '').trim();
  return VALID_ROLES.includes(s) ? s : null;
}

async function countAdmins() {
  return User.countDocuments({ role: 'admin' });
}

router.get('/users', auth, adminOnly, async (req, res) => {
  const users = await User.find().select('-password -verificationToken -resetToken -resetExpires');
  res.json(users);
});

router.post('/users', auth, adminOnly, async (req, res) => {
  try {
    const { email, password, role, verified, pseudo, fullName, city, origin, passions, avatar, bio } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

    const nr = normalizeRole(role) || 'user';

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email déjà utilisé' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashed,
      role: nr,
      verified: typeof verified === 'boolean' ? verified : true,
      pseudo,
      fullName,
      city,
      origin,
      passions,
      avatar,
      bio,
      createdByAdmin: true,
      mustChangePassword: true,
      mustChangePseudo: true,
      mustChangeEmail: true
    });
    await user.save();
    logSecurityAudit({
      req,
      actorId: String(req.userId),
      actorRole: req.role,
      action: 'admin.user.create',
      targetType: 'user',
      targetId: String(user._id),
      details: `role=${nr}`
    });
    const safe = await User.findById(user._id).select('-password -verificationToken -resetToken -resetExpires');
    res.status(201).json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

    if (role !== undefined) {
      const nr = normalizeRole(role);
      if (!nr) return res.status(400).json({ error: 'Rôle invalide' });
      if (user.role === 'admin' && nr !== 'admin') {
        const c = await countAdmins();
        if (c <= 1) {
          return res.status(400).json({ error: 'Impossible de retirer le rôle admin au dernier administrateur' });
        }
      }
      const prev = user.role;
      user.role = nr;
      if (prev !== nr) {
        logSecurityAudit({
          req,
          actorId: String(req.userId),
          actorRole: req.role,
          action: 'admin.user.role',
          targetType: 'user',
          targetId: String(user._id),
          details: `${prev}→${nr}`
        });
      }
    }

    if (email) user.email = email;
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

router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    if (user.role === 'admin') {
      const c = await countAdmins();
      if (c <= 1) {
        return res.status(400).json({ error: 'Impossible de supprimer le dernier administrateur' });
      }
    }
    const tid = String(user._id);
    await user.deleteOne();
    logSecurityAudit({
      req,
      actorId: String(req.userId),
      actorRole: req.role,
      action: 'admin.user.delete',
      targetType: 'user',
      targetId: tid,
      details: ''
    });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/role', auth, adminOnly, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  const nr = normalizeRole(req.body?.role);
  if (!nr) return res.status(400).json({ error: 'Rôle invalide' });
  if (user.role === 'admin' && nr !== 'admin') {
    const c = await countAdmins();
    if (c <= 1) {
      return res.status(400).json({ error: 'Impossible de retirer le rôle admin au dernier administrateur' });
    }
  }
  const prev = user.role;
  user.role = nr;
  await user.save();
  logSecurityAudit({
    req,
    actorId: String(req.userId),
    actorRole: req.role,
    action: 'admin.user.role',
    targetType: 'user',
    targetId: String(user._id),
    details: `${prev}→${nr}`
  });
  const safe = await User.findById(user._id).select('-password -verificationToken -resetToken -resetExpires');
  res.json(safe);
});

/** Journal des requêtes API (TTL 90j côté collection AccessLog) — admin uniquement */
router.get('/access-logs', auth, adminOnly, async (req, res) => {
  try {
    const limit = Math.min(2000, Math.max(1, parseInt(String(req.query.limit || '500'), 10) || 500));
    const skip = Math.max(0, parseInt(String(req.query.skip || '0'), 10) || 0);
    const [items, total] = await Promise.all([
      AccessLog.find().sort({ at: -1 }).skip(skip).limit(limit).lean(),
      AccessLog.countDocuments()
    ]);
    res.json({ items, total, limit, skip });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/access-logs/export.csv', auth, adminOnly, async (req, res) => {
  try {
    const limit = Math.min(5000, Math.max(1, parseInt(String(req.query.limit || '2000'), 10) || 2000));
    const items = await AccessLog.find().sort({ at: -1 }).limit(limit).lean();
    logSecurityAudit({
      req,
      actorId: String(req.userId),
      actorRole: req.role,
      action: 'admin.access_log.export',
      targetType: 'accesslog',
      targetId: '',
      details: `rows=${items.length},limit=${limit}`
    });
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['at', 'method', 'path', 'ip', 'userId', 'userAgent', 'referer'].join(',') + '\n';
    const body = items
      .map((r) =>
        [esc(r.at), esc(r.method), esc(r.path), esc(r.ip), esc(r.userId), esc(r.userAgent), esc(r.referer)].join(',')
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="access-logs.csv"');
    res.send('\ufeff' + header + body);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
