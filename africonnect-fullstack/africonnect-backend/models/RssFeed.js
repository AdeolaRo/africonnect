const mongoose = require('mongoose');

const RssFeedSchema = new mongoose.Schema({
  label: { type: String, required: true },
  rssUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RssFeed', RssFeedSchema);

