const mongoose = require('mongoose');

const SolutionSchema = new mongoose.Schema({
  title: String,
  category: String,
  desc: String,
  imageUrl: String,
  userId: String,
  authorName: String,
  likes: { type: [String], default: [] },
  shares: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Solution', SolutionSchema);