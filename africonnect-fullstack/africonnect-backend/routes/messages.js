const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// Liste des messages reçus par l'utilisateur connecté
router.get('/inbox', auth, async (req, res) => {
  try {
    const messages = await Message.find({ to: String(req.userId) }).sort({ timestamp: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Liste des messages envoyés par l'utilisateur connecté
router.get('/sent', auth, async (req, res) => {
  try {
    const messages = await Message.find({ from: String(req.userId) }).sort({ timestamp: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Conversation avec un autre utilisateur
router.get('/with/:userId', auth, async (req, res) => {
  try {
    const otherId = String(req.params.userId);
    const me = String(req.userId);
    const messages = await Message.find({
      $or: [{ from: me, to: otherId }, { from: otherId, to: me }]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Envoyer un message
router.post('/', auth, async (req, res) => {
  try {
    const { to, subject, content } = req.body || {};
    if (!to || !content || !String(content).trim()) {
      return res.status(400).json({ error: 'Destinataire et message requis' });
    }
    const msg = new Message({
      from: String(req.userId),
      to: String(to),
      subject: subject ? String(subject) : '',
      content: String(content).trim(),
      timestamp: new Date()
    });
    await msg.save();

    // Si socket.io est dispo, pousser en temps réel
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${String(to)}`).emit('new_message', msg);
      io.to(`user_${String(req.userId)}`).emit('new_message', msg);
    }

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supprimer un message (uniquement si owner: expéditeur ou destinataire)
router.delete('/:id', auth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message non trouvé' });

    const me = String(req.userId);
    if (msg.from !== me && msg.to !== me) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    await msg.deleteOne();
    res.json({ message: 'Message supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;