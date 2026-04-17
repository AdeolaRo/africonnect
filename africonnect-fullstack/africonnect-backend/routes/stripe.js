const express = require('express');
const auth = require('../middleware/auth');
const AdRequest = require('../models/AdRequest');
const { canSendEmail, sendMailSafe } = require('../utils/mailer');
const { getStripeClient, createCheckoutSessionForAdRequest } = require('../utils/stripe');

const router = express.Router();

router.post('/create-checkout-session', auth, async (req, res) => {
  const { requestId } = req.body || {};
  if (!requestId) return res.status(400).json({ error: 'requestId requis' });

  const item = await AdRequest.findById(requestId);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (String(item.userId) !== String(req.userId)) return res.status(403).json({ error: 'Non autorisé' });
  if (item.option !== 'publish_only') return res.status(400).json({ error: 'Paiement direct non disponible pour cette option' });
  if (!['awaiting_payment'].includes(String(item.status || ''))) return res.status(400).json({ error: 'Demande non payable' });

  const session = await createCheckoutSessionForAdRequest({ adRequest: item });
  item.stripeSessionId = String(session?.id || '');
  await item.save();

  res.json({ url: session.url });
});

async function handlePaid(requestId, session) {
  const item = await AdRequest.findById(requestId);
  if (!item) return;

  item.status = item.option === 'publish_only' ? 'under_review' : 'paid';
  item.paymentMethod = 'stripe';
  item.receiptSentAt = new Date();
  await item.save();

  if (canSendEmail()) {
    const subject = 'Reçu de paiement (Stripe) - African Connect';
    const html = `
      <p>Merci. Votre paiement a été confirmé.</p>
      <ul>
        <li><strong>ID demande</strong>: ${item._id}</li>
        <li><strong>Option</strong>: ${item.option}</li>
        <li><strong>Transaction</strong>: ${session?.payment_intent || session?.id || '—'}</li>
      </ul>
      <p>Votre demande sera traitée par l’administrateur.</p>
    `;
    try {
      await sendMailSafe({ to: item.userEmail, subject, html });
    } catch {
      // ignore
    }
  }

  // notify admin (best-effort)
  try {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
    if (adminEmail && canSendEmail()) {
      const subject = 'Paiement confirmé - Demande de publicité';
      const html = `
        <p>Un paiement a été confirmé pour une demande de publicité.</p>
        <ul>
          <li><strong>ID</strong>: ${item._id}</li>
          <li><strong>Utilisateur</strong>: ${item.userPseudo || '—'} (${item.userEmail})</li>
          <li><strong>Option</strong>: ${item.option}</li>
          <li><strong>Statut</strong>: ${item.status}</li>
          <li><strong>Média</strong>: ${item.mediaUrl || '—'}</li>
        </ul>
      `;
      await sendMailSafe({ to: adminEmail, subject, html });
    }
  } catch {
    // ignore
  }
}

// Webhook handler must be mounted with express.raw({ type: 'application/json' })
async function webhookHandler(req, res) {
  const stripe = getStripeClient();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).send('Stripe non configuré');
  }

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const requestId = session?.metadata?.requestId;
      if (requestId) await handlePaid(requestId, session);
    }
  } catch (e) {
    // swallow processing errors to avoid retries storm; log if needed
  }

  res.json({ received: true });
}

module.exports = { router, webhookHandler };

