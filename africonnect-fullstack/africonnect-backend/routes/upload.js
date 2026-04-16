const multer = require('multer');
const path = require('path');
const router = require('express').Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

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

  const urls = files.slice(0, 3).map(f => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`);
  res.json({ url: urls[0], urls });
});

module.exports = router;