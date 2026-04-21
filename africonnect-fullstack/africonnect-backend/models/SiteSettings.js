const mongoose = require('mongoose');

const SiteSettingsSchema = new mongoose.Schema({
  termsVersion: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now }
});

SiteSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('SiteSettings', SiteSettingsSchema);

