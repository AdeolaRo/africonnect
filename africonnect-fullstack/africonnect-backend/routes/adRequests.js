const express = require('express');
const auth = require('../middleware/auth');
const AdRequest = require('../models/AdRequest');
const { canSendEmail, sendMailSafe } = require('../utils/mailer');
const { createCheckoutSessionForAdRequest } = require('../utils/stripe');
const Notification = require('../models/Notification');

const router = express.Router();

async function notify(req, userId, payload) {
  try {
    const doc = await new Notification({
      userId: String(userId),
      type: payload?.type || 'info',
      title: payload?.title || '',
      body: payload?.body || '',
      data: payload?.data || {}
    }).save();
    const io = req.app.get('io');
    if (io) io.to(`user_${String(userId)}`).emit('notification', doc);
  } catch {
    // ignore
  }
}

router.post('/', auth, async (req, res) => {
  const { option, mediaUrl, message, attachments } = req.body || {};
  if (!option || !['create_and_publish', 'publish_only'].includes(option)) {
    return res.status(400).json({ error: 'Option invalide' });
  }

  const safeMessage = String(message || '').trim();
  if (option === 'create_and_publish' && !safeMessage) {
    return res.status(400).json({ error: 'Message requis' });
  }
  if (option === 'publish_only' && !String(mediaUrl || '').trim()) {
    return res.status(400).json({ error: 'Média requis' });
  }

  const safeAttachments = Array.isArray(attachments) ? attachments.map(String).filter(Boolean).slice(0, 3) : [];

  const doc = await new AdRequest({
    userId: String(req.userId),
    userEmail: String(req.userEmail),
    userPseudo: String(req.userPseudo || ''),
    option,
    message: safeMessage,
    attachments: safeAttachments,
    mediaUrl: String(mediaUrl || ''),
    status: option === 'publish_only' ? 'awaiting_payment' : 'awaiting_admin_payment_link'
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
        <li><strong>Message</strong>: ${doc.message ? doc.message.replace(/</g, '&lt;') : '—'}</li>
        <li><strong>Média</strong>: ${doc.mediaUrl || (doc.attachments?.[0] || '—')}</li>
        <li><strong>ID</strong>: ${doc._id}</li>
      </ul>
    `;
    try {
      await sendMailSafe({ to: doc.userEmail, subject, html }); // accusé de réception
      if (adminEmail) await sendMailSafe({ to: adminEmail, subject, html });
    } catch (e) {
      // ignore mail failures
    }
  }

  // realtime notification to admin (if admin exists)
  try {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
    if (adminEmail) {
      // We don't have adminId here; email-only notification is handled above.
    }
  } catch {}

  res.status(201).json(doc);
});

router.get('/mine', auth, async (req, res) => {
  const items = await AdRequest.find({ userId: String(req.userId) }).sort({ createdAt: -1 });
  res.json(items);
});

// Admin: list all requests
router.get('/', auth, async (req, res) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });
  const items = await AdRequest.find().sort({ createdAt: -1 }).limit(200);
  res.json(items);
});

// Admin: send payment link for create_and_publish
router.post('/:id/send-payment-link', auth, async (req, res) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });
  const item = await AdRequest.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (item.option !== 'create_and_publish') return res.status(400).json({ error: 'Action invalide' });
  if (!['awaiting_admin_payment_link', 'payment_link_sent'].includes(String(item.status || ''))) {
    return res.status(400).json({ error: 'Statut incompatible' });
  }

  const session = await createCheckoutSessionForAdRequest({ adRequest: item });
  item.stripeSessionId = String(session?.id || '');
  item.status = 'payment_link_sent';
  item.paymentLinkSentAt = new Date();
  await item.save();

  const url = session?.url || '';
  if (url) {
    await notify(req, item.userId, {
      type: 'ad_payment_link',
      title: 'Paiement publicité',
      body: 'Un lien de paiement est disponible pour votre demande de publicité.',
      data: { requestId: String(item._id), url }
    });
  }

  if (canSendEmail()) {
    const subject = 'Lien de paiement - African Connect';
    const html = `
      <p>Votre demande de publicité est prête.</p>
      <p>Cliquez ici pour payer (Stripe) : <a href="${url}">Payer maintenant</a></p>
      <p>Si vous ne souhaitez pas continuer, vous pouvez ignorer ce message.</p>
      <p><strong>ID demande</strong>: ${item._id}</p>
    `;
    try { await sendMailSafe({ to: item.userEmail, subject, html }); } catch {}
  }

  res.json({ ok: true, url, item });
});

// User: refuse payment (create_and_publish)
router.post('/:id/refuse', auth, async (req, res) => {
  const item = await AdRequest.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (String(item.userId) !== String(req.userId)) return res.status(403).json({ error: 'Non autorisé' });
  if (item.option !== 'create_and_publish') return res.status(400).json({ error: 'Action invalide' });
  item.status = 'refused';
  await item.save();
  res.json(item);
});

// Admin: ask user to resubmit media (publish_only)
router.post('/:id/request-resubmission', auth, async (req, res) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });
  const item = await AdRequest.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (item.option !== 'publish_only') return res.status(400).json({ error: 'Action invalide' });
  if (!['under_review', 'needs_resubmission'].includes(String(item.status || ''))) return res.status(400).json({ error: 'Statut incompatible' });

  const msg = String(req.body?.message || '').trim();
  item.status = 'needs_resubmission';
  item.adminMessage = msg;
  await item.save();

  await notify(req, item.userId, {
    type: 'ad_resubmission',
    title: 'Nouveau média requis',
    body: msg || 'Merci de renvoyer une nouvelle photo/vidéo pour votre publicité.',
    data: { requestId: String(item._id) }
  });

  res.json(item);
});

// User: resubmit media (publish_only)
router.post('/:id/resubmit', auth, async (req, res) => {
  const item = await AdRequest.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (String(item.userId) !== String(req.userId)) return res.status(403).json({ error: 'Non autorisé' });
  if (item.option !== 'publish_only') return res.status(400).json({ error: 'Action invalide' });
  if (String(item.status || '') !== 'needs_resubmission') return res.status(400).json({ error: 'Statut incompatible' });

  const newMediaUrl = String(req.body?.mediaUrl || '').trim();
  if (!newMediaUrl) return res.status(400).json({ error: 'Média requis' });

  item.mediaUrl = newMediaUrl;
  item.status = 'under_review';
  item.adminMessage = '';
  await item.save();
  res.json(item);
});

// Admin: approve or reject (publish_only)
router.post('/:id/approve', auth, async (req, res) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });
  const item = await AdRequest.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (item.option !== 'publish_only') return res.status(400).json({ error: 'Action invalide' });
  if (!['under_review'].includes(String(item.status || ''))) return res.status(400).json({ error: 'Statut incompatible' });
  item.status = 'approved';
  await item.save();
  await notify(req, item.userId, {
    type: 'ad_approved',
    title: 'Publicité approuvée',
    body: 'Votre publicité a été approuvée. Elle sera publiée prochainement.',
    data: { requestId: String(item._id) }
  });
  res.json(item);
});

router.post('/:id/reject', auth, async (req, res) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });
  const item = await AdRequest.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  const msg = String(req.body?.message || '').trim();
  item.status = 'rejected';
  item.adminMessage = msg;
  await item.save();
  await notify(req, item.userId, {
    type: 'ad_rejected',
    title: 'Publicité refusée',
    body: msg || 'Votre publicité a été refusée.',
    data: { requestId: String(item._id) }
  });
  res.json(item);
});

router.post('/:id/confirm-payment', auth, async (req, res) => {
  const { method } = req.body || {};
  const item = await AdRequest.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (String(item.userId) !== String(req.userId)) return res.status(403).json({ error: 'Non autorisé' });

  if (item.option !== 'publish_only') return res.status(400).json({ error: 'Confirmation non disponible pour cette option' });
  if (String(item.status || '') !== 'awaiting_payment') return res.status(400).json({ error: 'Statut incompatible' });

  item.status = 'under_review';
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
      await sendMailSafe({ to: item.userEmail, subject, html });
    } catch (e) {
      // ignore
    }
  }

  res.json(item);
});

module.exports = router;

