const multer = require('multer');
const path = require('path');
const router = require('express').Router();
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch {}
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = String(file.originalname || '').replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, Date.now() + '-' + safe);
  }
});
const upload = multer({
  storage,
  limits: {
    fileSize: 60 * 1024 * 1024 // 60MB
  }
});

router.post('/', upload.fields([
  { name: 'image', maxCount: 1 },      // compat: ancien front
  { name: 'images', maxCount: 3 },     // nouveau: jusqu'à 3 images
  { name: 'media', maxCount: 1 },      // pub: image ou video
]), (req, res) => {
  const files = [
    ...(req.files?.images || []),
    ...(req.files?.image || []),
    ...(req.files?.media || []),
  ];

  if (!files.length) return res.status(400).json({ error: 'Aucun fichier' });

  // Return relative URLs to avoid mixed-content issues behind HTTPS proxies
  const urls = files.slice(0, 3).map(f => `/uploads/${f.filename}`);
  res.json({ url: urls[0], urls });
});

module.exports = router;