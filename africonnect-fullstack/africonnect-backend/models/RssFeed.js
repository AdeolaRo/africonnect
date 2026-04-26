const mongoose = require('mongoose');

const RssFeedSchema = new mongoose.Schema({
  label: { type: String, required: true },
  category: { type: String, default: '' },
  rssUrl: { type: String, required: true },
  /** fr | en | all (all = affiché dans les deux langues) */
  lang: { type: String, enum: ['fr', 'en', 'all'], default: 'fr' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RssFeed', RssFeedSchema);

