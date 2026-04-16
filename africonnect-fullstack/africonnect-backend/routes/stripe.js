const express = require('express');
const Stripe = require('stripe');
const auth = require('../middleware/auth');
const AdRequest = require('../models/AdRequest');
const { canSendEmail, sendMailSafe } = require('../utils/mailer');

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20'
});

function getAmountCents(option) {
  if (option === 'create_and_publish') {
    return Number(process.env.STRIPE_AMOUNT_CREATE_AND_PUBLISH_CENTS || 5000);
  }
  return Number(process.env.STRIPE_AMOUNT_PUBLISH_ONLY_CENTS || 2000);
}

router.post('/create-checkout-session', auth, async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe non configuré' });
  }

  const { requestId } = req.body || {};
  if (!requestId) return res.status(400).json({ error: 'requestId requis' });

  const item = await AdRequest.findById(requestId);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (String(item.userId) !== String(req.userId)) return res.status(403).json({ error: 'Non autorisé' });

  const amount = getAmountCents(item.option);
  const frontend = process.env.FRONTEND_URL || 'https://africanconnect.net';
  const successUrl = `${frontend}/paiement?success=1&requestId=${encodeURIComponent(String(item._id))}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${frontend}/paiement?canceled=1&requestId=${encodeURIComponent(String(item._id))}`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.option === 'create_and_publish'
              ? 'Publicité (création + publication)'
              : 'Publicité (publication seulement)'
          },
          unit_amount: amount
        },
        quantity: 1
      }
    ],
    metadata: {
      requestId: String(item._id),
      userId: String(item.userId),
      userEmail: String(item.userEmail || '')
    },
    customer_email: item.userEmail,
    success_url: successUrl,
    cancel_url: cancelUrl
  });

  item.status = 'awaiting_payment';
  await item.save();

  res.json({ url: session.url });
});

async function handlePaid(requestId, session) {
  const item = await AdRequest.findById(requestId);
  if (!item) return;

  item.status = 'paid';
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
}

// Webhook handler must be mounted with express.raw({ type: 'application/json' })
async function webhookHandler(req, res) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
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

