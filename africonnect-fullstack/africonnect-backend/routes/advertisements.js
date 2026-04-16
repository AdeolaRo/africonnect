const express = require('express');
const router = express.Router();
const Advertisement = require('../models/Advertisement');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration multer pour les uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/ads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images et vidéos sont autorisées'));
    }
  }
});

// Middleware admin seulement
const adminOnly = (req, res, next) => {
  if (req.role !== 'admin') {
    return res.status(403).json({ error: 'Admin requis' });
  }
  next();
};

// Récupérer toutes les publicités actives (publique)
router.get('/', async (req, res) => {
  try {
    const { section } = req.query;
    const query = { isActive: true };
    
    if (section) {
      query.displayIn = section;
    }
    
    const ads = await Advertisement.find(query)
      .sort({ order: 1, createdAt: -1 })
      .populate('createdBy', 'email pseudo');
    
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer toutes les publicités (admin seulement)
router.get('/all', auth, adminOnly, async (req, res) => {
  try {
    const ads = await Advertisement.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'email pseudo');
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une nouvelle publicité
router.post('/', auth, adminOnly, upload.single('media'), async (req, res) => {
  try {
    const { title, description, buttonText, buttonLink, targetUrl, mediaType, displayIn, order, endDate } = req.body;
    
    let mediaUrl = '';
    if (req.file) {
      mediaUrl = `/uploads/ads/${req.file.filename}`;
    } else if (req.body.mediaUrl) {
      mediaUrl = req.body.mediaUrl;
    } else {
      return res.status(400).json({ error: 'Media requis' });
    }
    
    const displayInArray = displayIn ? displayIn.split(',').map(item => item.trim()) : 
      ['forum', 'marketplace', 'jobs', 'solutions', 'solidarity', 'events', 'groups'];
    
    const ad = new Advertisement({
      title,
      description,
      mediaUrl,
      mediaType: mediaType || (req.file ? (req.file.mimetype.startsWith('video') ? 'video' : 'image') : 'image'),
      buttonText: buttonText || 'En savoir plus',
      buttonLink,
      targetUrl,
      displayIn: displayInArray,
      order: order || 0,
      endDate: endDate ? new Date(endDate) : null,
      createdBy: req.userId
    });
    
    await ad.save();
    res.status(201).json(ad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour une publicité
router.put('/:id', auth, adminOnly, upload.single('media'), async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ error: 'Publicité non trouvée' });
    }
    
    const updates = req.body;
    
    if (req.file) {
      updates.mediaUrl = `/uploads/ads/${req.file.filename}`;
      updates.mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
      
      // Supprimer l'ancien fichier si c'est une URL locale
      if (ad.mediaUrl && ad.mediaUrl.startsWith('/uploads/ads/')) {
        const oldPath = path.join(__dirname, '..', ad.mediaUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }
    
    if (updates.displayIn && typeof updates.displayIn === 'string') {
      updates.displayIn = updates.displayIn.split(',').map(item => item.trim());
    }
    
    if (updates.endDate) {
      updates.endDate = new Date(updates.endDate);
    }
    
    Object.assign(ad, updates);
    await ad.save();
    
    res.json(ad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une publicité
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ error: 'Publicité non trouvée' });
    }
    
    // Supprimer le fichier associé
    if (ad.mediaUrl && ad.mediaUrl.startsWith('/uploads/ads/')) {
      const filePath = path.join(__dirname, '..', ad.mediaUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await ad.deleteOne();
    res.json({ message: 'Publicité supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle active/inactive
router.patch('/:id/toggle', auth, adminOnly, async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ error: 'Publicité non trouvée' });
    }
    
    ad.isActive = !ad.isActive;
    await ad.save();
    
    res.json({ 
      message: `Publicité ${ad.isActive ? 'activée' : 'désactivée'}`,
      isActive: ad.isActive 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;