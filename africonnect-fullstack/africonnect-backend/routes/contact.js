const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

const router = express.Router();

async function getAuthUser(req) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    return user || null;
  } catch {
    return null;
  }
}

// Public contact form: sends message to the first admin account
router.post('/', async (req, res) => {
  try {
    const fromUser = await getAuthUser(req);
    const email = String(req.body?.email || '').trim();
    const subject = String(req.body?.subject || '').trim();
    const content = String(req.body?.content || '').trim();

    if (!subject || !content) return res.status(400).json({ error: 'Objet et message requis' });

    const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    if (!admin) return res.status(500).json({ error: 'Admin introuvable' });

    const from = fromUser ? String(fromUser._id) : (email || 'anonymous');
    const bodyLines = [
      content,
      '',
      `ContactEmail: ${email || (fromUser?.email || '')}`.trim(),
      fromUser ? `FromUserId: ${String(fromUser._id)}` : ''
    ].filter(Boolean);

    const msg = await new Message({
      from,
      to: String(admin._id),
      subject,
      content: bodyLines.join('\n'),
      timestamp: new Date()
    }).save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${String(admin._id)}`).emit('new_message', msg);
    }

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

