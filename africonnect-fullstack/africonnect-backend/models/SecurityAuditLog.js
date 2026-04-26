const mongoose = require('mongoose');

/**
 * Traçabilité des actions sensibles (admin / modération).
 * Rétention 24 mois (intérêt légitime de sécurité) — indépendante des access logs 90j.
 */
const SecurityAuditLogSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorRole: { type: String, default: '' },
    action: { type: String, required: true },
    targetType: { type: String, default: '' },
    targetId: { type: String, default: '' },
    ip: { type: String, default: '' },
    details: { type: String, default: '' }
  },
  { collection: 'securityauditlogs' }
);

// ~24 mois (2 × 365 j)
SecurityAuditLogSchema.index({ at: 1 }, { expireAfterSeconds: 63072000 });

module.exports = mongoose.model('SecurityAuditLog', SecurityAuditLogSchema);
