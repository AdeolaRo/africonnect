const mongoose = require('mongoose');

/** Requêtes API (rétention TTL — pas d’index sensible au-delà du besoin) */
const AccessLogSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    ip: { type: String, default: '' },
    method: { type: String, default: '' },
    path: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    referer: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { collection: 'accesslogs' }
);

AccessLogSchema.index({ at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('AccessLog', AccessLogSchema);
