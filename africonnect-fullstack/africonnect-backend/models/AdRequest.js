const mongoose = require('mongoose');

const AdRequestSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  userPseudo: { type: String, default: '' },
  option: { type: String, enum: ['create_and_publish', 'publish_only'], required: true },
  message: { type: String, default: '' },
  attachments: { type: [String], default: [] }, // optional refs for "create_and_publish"
  mediaUrl: { type: String, default: '' },
  status: {
    type: String,
    enum: [
      'awaiting_admin_payment_link', // create_and_publish: waiting admin to send stripe link
      'payment_link_sent',          // create_and_publish: link sent to user
      'awaiting_payment',           // publish_only: user can pay
      'paid',                       // create_and_publish: paid, awaiting work
      'under_review',               // publish_only: paid, awaiting admin moderation
      'needs_resubmission',         // publish_only: admin asks new media
      'approved',                   // publish_only: approved by admin
      'rejected',                   // admin rejected (policy)
      'refused',                    // user refused to pay
      'published'                   // final state if you later link to Ads module
    ],
    default: 'awaiting_admin_payment_link'
  },
  adminMessage: { type: String, default: '' },
  paymentMethod: { type: String, default: '' },
  stripeSessionId: { type: String, default: '' },
  paymentLinkSentAt: { type: Date },
  receiptSentAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdRequest', AdRequestSchema);

