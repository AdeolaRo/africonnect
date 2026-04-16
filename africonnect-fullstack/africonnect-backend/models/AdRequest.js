const mongoose = require('mongoose');

const AdRequestSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  userPseudo: { type: String, default: '' },
  option: { type: String, enum: ['create_and_publish', 'publish_only'], required: true },
  mediaUrl: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'awaiting_payment', 'paid', 'processed'], default: 'awaiting_payment' },
  paymentMethod: { type: String, default: '' },
  receiptSentAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdRequest', AdRequestSchema);

