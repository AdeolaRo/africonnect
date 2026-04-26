const SecurityAuditLog = require('../models/SecurityAuditLog');

function clientIp(req) {
  const xff = (req.headers['x-forwarded-for'] || '').toString();
  const first = xff.split(',')[0].trim();
  if (first) return first.slice(0, 80);
  return String(req.ip || req.connection?.remoteAddress || '').slice(0, 80);
}

/**
 * @param {object} p
 * @param {string} [p.actorId]
 * @param {string} [p.actorRole]
 * @param {string} p.action
 * @param {string} [p.targetType]
 * @param {string} [p.targetId]
 * @param {import('express').Request} [p.req] — remplit l’IP si fourni
 * @param {string} [p.ip]
 * @param {string} [p.details] — max 500
 */
function logSecurityAudit(p) {
  const ip = p.ip != null ? String(p.ip) : p.req ? clientIp(p.req) : '';
  const details = String(p.details || '').slice(0, 500);
  setImmediate(() => {
    SecurityAuditLog.create({
      actorId: p.actorId || null,
      actorRole: String(p.actorRole || ''),
      action: String(p.action),
      targetType: String(p.targetType || ''),
      targetId: String(p.targetId || ''),
      ip,
      details
    }).catch(() => {});
  });
}

/**
 * Toute suppression d’un contenu par quelqu’un d’autre que l’auteur (modo site, modé groupe, admin, etc.)
 */
function logIfNotOwnerContentDelete(req, item, targetType) {
  if (!item) return;
  if (String(item.userId) === String(req.userId)) return;
  logSecurityAudit({
    req,
    actorId: String(req.userId),
    actorRole: req.role,
    action: 'moderation.content.delete',
    targetType: String(targetType),
    targetId: String(item._id)
  });
}

function logIfNotOwnerContentUpdate(req, item, targetType) {
  if (!item) return;
  if (String(item.userId) === String(req.userId)) return;
  logSecurityAudit({
    req,
    actorId: String(req.userId),
    actorRole: req.role,
    action: 'moderation.content.update',
    targetType: String(targetType),
    targetId: String(item._id)
  });
}

module.exports = { logSecurityAudit, clientIp, logIfNotOwnerContentDelete, logIfNotOwnerContentUpdate };
