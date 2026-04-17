const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, index: true, required: true },
  type: { type: String, default: 'info' },
  title: { type: String, default: '' },
  body: { type: String, default: '' },
  data: { type: Object, default: {} },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);

