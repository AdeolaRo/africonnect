const mongoose = require('mongoose');

const SolidaritySchema = new mongoose.Schema({
  title: String,
  type: String,
  desc: String,
  userId: String,
  authorName: String,
  likes: { type: [String], default: [] },
  shares: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Solidarity', SolidaritySchema);