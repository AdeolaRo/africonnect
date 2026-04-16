const express = require('express');
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');
const AdRequest = require('../models/AdRequest');

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function canSendEmail() {
  return !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS;
}

router.post('/', auth, async (req, res) => {
  const { option, mediaUrl } = req.body || {};
  if (!option || !['create_and_publish', 'publish_only'].includes(option)) {
    return res.status(400).json({ error: 'Option invalide' });
  }

  const doc = await new AdRequest({
    userId: String(req.userId),
    userEmail: String(req.userEmail),
    userPseudo: String(req.userPseudo || ''),
    option,
    mediaUrl: String(mediaUrl || ''),
    status: 'awaiting_payment'
  }).save();

  // notify admin + user (best-effort)
  if (canSendEmail()) {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
    const subject = 'Demande de publicité - African Connect';
    const html = `
      <p>Une nouvelle demande de publicité a été créée.</p>
      <ul>
        <li><strong>Utilisateur</strong>: ${doc.userPseudo || '—'} (${doc.userEmail})</li>
        <li><strong>Option</strong>: ${doc.option}</li>
        <li><strong>Média</strong>: ${doc.mediaUrl || '—'}</li>
        <li><strong>ID</strong>: ${doc._id}</li>
      </ul>
    `;
    try {
      await transporter.sendMail({ to: doc.userEmail, subject, html });
      if (adminEmail) await transporter.sendMail({ to: adminEmail, subject, html });
    } catch (e) {
      // ignore mail failures
    }
  }

  res.status(201).json(doc);
});

router.get('/mine', auth, async (req, res) => {
  const items = await AdRequest.find({ userId: String(req.userId) }).sort({ createdAt: -1 });
  res.json(items);
});

router.post('/:id/confirm-payment', auth, async (req, res) => {
  const { method } = req.body || {};
  const item = await AdRequest.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (String(item.userId) !== String(req.userId)) return res.status(403).json({ error: 'Non autorisé' });

  item.status = 'paid';
  item.paymentMethod = String(method || '');
  item.receiptSentAt = new Date();
  await item.save();

  if (canSendEmail()) {
    const subject = 'Reçu de paiement - African Connect';
    const html = `
      <p>Merci. Nous avons reçu votre confirmation de paiement.</p>
      <ul>
        <li><strong>ID</strong>: ${item._id}</li>
        <li><strong>Option</strong>: ${item.option}</li>
        <li><strong>Méthode</strong>: ${item.paymentMethod || '—'}</li>
      </ul>
      <p>Votre demande sera traitée par l’administrateur.</p>
    `;
    try {
      await transporter.sendMail({ to: item.userEmail, subject, html });
    } catch (e) {
      // ignore
    }
  }

  res.json(item);
});

module.exports = router;

