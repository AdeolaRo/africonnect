const mongoose = require('mongoose');

const AdvertisementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  mediaUrl: { type: String, required: true }, // URL de la vidéo ou image
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  buttonText: { type: String, default: 'En savoir plus' },
  buttonLink: { type: String },
  targetUrl: { type: String }, // URL de destination du clic
  isActive: { type: Boolean, default: true },
  displayIn: { 
    type: [String], 
    enum: ['forum', 'marketplace', 'jobs', 'solutions', 'solidarity', 'events', 'groups'],
    default: ['forum', 'marketplace', 'jobs', 'solutions', 'solidarity', 'events', 'groups']
  },
  order: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Advertisement', AdvertisementSchema);