const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  members: [String],
  userId: String,
  authorName: String,
  likes: { type: [String], default: [] },
  shares: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Group', GroupSchema);