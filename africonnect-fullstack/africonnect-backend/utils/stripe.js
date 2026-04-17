const Stripe = require('stripe');

let stripeClient = null;
function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (stripeClient) return stripeClient;
  stripeClient = new Stripe(key, { apiVersion: '2024-06-20' });
  return stripeClient;
}

function getAmountCents(option) {
  if (option === 'create_and_publish') {
    return Number(process.env.STRIPE_AMOUNT_CREATE_AND_PUBLISH_CENTS || 5000);
  }
  return Number(process.env.STRIPE_AMOUNT_PUBLISH_ONLY_CENTS || 2000);
}

async function createCheckoutSessionForAdRequest({ adRequest, frontendUrl }) {
  const stripe = getStripeClient();
  if (!stripe) {
    const err = new Error('Stripe non configuré');
    err.statusCode = 500;
    throw err;
  }

  const amount = getAmountCents(adRequest.option);
  const frontend = frontendUrl || process.env.FRONTEND_URL || 'https://africanconnect.net';
  const requestId = String(adRequest._id);
  const successUrl = `${frontend}/paiement?success=1&requestId=${encodeURIComponent(requestId)}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${frontend}/paiement?canceled=1&requestId=${encodeURIComponent(requestId)}`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: adRequest.option === 'create_and_publish'
              ? 'Publicité (création + publication)'
              : 'Publicité (publication seulement)'
          },
          unit_amount: amount
        },
        quantity: 1
      }
    ],
    metadata: {
      requestId,
      userId: String(adRequest.userId),
      userEmail: String(adRequest.userEmail || '')
    },
    customer_email: adRequest.userEmail,
    success_url: successUrl,
    cancel_url: cancelUrl
  });

  return session;
}

module.exports = {
  getStripeClient,
  createCheckoutSessionForAdRequest
};

