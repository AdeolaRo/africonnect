const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { canSendEmail, sendMailSafe } = require('../utils/mailer');
const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.' }
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de créations de compte depuis cette adresse. Réessayez plus tard.' }
});
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de demandes. Réessayez plus tard.' }
});
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez plus tard.' }
});

// Inscription
router.post('/register', registerLimiter, async (req, res) => {
  const { email, password, pseudo, fullName, city } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email déjà utilisé' });
    const hashed = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = new User({
      email,
      password: hashed,
      verificationToken,
      ...(pseudo ? { pseudo } : {}),
      ...(fullName ? { fullName } : {}),
      ...(city ? { city } : {}),
    });
    await user.save();

    // Envoi d'email de vérification / bienvenue (best-effort)
    try {
      const verifyUrl = `${process.env.FRONTEND_URL || 'https://africanconnect.net'}/verify-email/${verificationToken}`;
      await sendMailSafe({
        to: email,
        subject: 'Bienvenue sur African Connect',
        html: `
          <p>Bienvenue sur <strong>African Connect</strong> !</p>
          <p><strong>Email du compte</strong> : ${email}</p>
          <p>Par sécurité, nous n’envoyons jamais votre mot de passe par email.</p>
          <p>Cliquez sur <a href="${verifyUrl}">ce lien</a> pour vérifier votre email.</p>
        `
      });
    } catch (mailErr) {
      console.error('Erreur envoi email:', mailErr);
      // On ne bloque pas l'inscription
    }
    res.status(201).json({ message: 'Utilisateur créé. Vérifiez votre email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Connexion
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Identifiants invalides' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });
    const pseudo = user.pseudo || user.email?.split('@')?.[0] || 'Utilisateur';
    const token = jwt.sign({
      userId: user._id,
      role: user.role,
      pseudo,
      verified: !!user.verified,
      mustChangePassword: !!user.mustChangePassword,
      mustChangePseudo: !!user.mustChangePseudo,
      mustChangeEmail: !!user.mustChangeEmail,
      termsAcceptedVersion: Number(user.termsAcceptedVersion || 0)
    }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      role: user.role,
      verified: !!user.verified,
      mustChangePassword: !!user.mustChangePassword,
      mustChangePseudo: !!user.mustChangePseudo,
      mustChangeEmail: !!user.mustChangeEmail
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mot de passe oublié
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });
  try {
    const user = await User.findOne({ email });
    // Toujours répondre OK pour éviter d'exposer si l'email existe ou non
    if (!user) return res.json({ message: 'Email envoyé' });
    if (!canSendEmail()) return res.json({ message: 'Email envoyé' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetExpires = Date.now() + 3600000;
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL || 'https://africanconnect.net'}/reset-password/${resetToken}`;
    await sendMailSafe({
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <p>Vous avez demandé une réinitialisation de mot de passe.</p>
        <p><strong>Email</strong> : ${user.email}</p>
        <p>Cliquez sur <a href="${resetUrl}">ce lien</a> pour définir un nouveau mot de passe.</p>
        <p>Lien valable 1 heure.</p>
      `
    });
    res.json({ message: 'Email envoyé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Réinitialisation du mot de passe
router.post('/reset-password', resetPasswordLimiter, async (req, res) => {
  const token = String(req.body?.token || req.body?.resetToken || '').trim();
  const newPassword = String(req.body?.newPassword || '').trim();
  if (!token || !newPassword) return res.status(400).json({ error: 'Token et nouveau mot de passe requis' });
  try {
    const user = await User.findOne({ resetToken: token, resetExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: 'Token invalide ou expiré' });
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetExpires = undefined;
    await user.save();
    res.json({ message: 'Mot de passe mis à jour' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Vérification d'email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) return res.status(400).json({ error: 'Token invalide' });
    user.verified = true;
    user.verificationToken = undefined;
    await user.save();
    res.json({ message: 'Email vérifié, vous pouvez vous connecter.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;