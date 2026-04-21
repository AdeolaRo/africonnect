const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Accès refusé' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) throw new Error();

    const pseudo = user.pseudo || user.email?.split('@')?.[0] || 'Utilisateur';

    req.userId = user._id;
    req.userEmail = user.email;
    req.userPseudo = pseudo;
    req.role = user.role;

    const mustChange =
      !!user.mustChangePassword ||
      !!user.mustChangePseudo ||
      !!user.mustChangeEmail;
    req.mustChangePassword = !!user.mustChangePassword;
    req.mustChangePseudo = !!user.mustChangePseudo;
    req.mustChangeEmail = !!user.mustChangeEmail;

    if (mustChange) {
      const url = String(req.originalUrl || '');
      const allow = [
        '/api/user/profile',
        '/api/user/complete-onboarding',
        '/api/user/accept-terms'
      ];
      const isAllowed = allow.some(prefix => url.startsWith(prefix));
      if (!isAllowed) {
        return res.status(403).json({ error: 'Mise à jour du profil requise' });
      }
    }

    next();
  } catch (err) {
    res.status(401).json({ error: 'Token invalide' });
  }
};