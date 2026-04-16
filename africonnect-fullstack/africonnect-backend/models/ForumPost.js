const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  content: String,
  userId: String,
  authorName: String,
  createdAt: { type: Date, default: Date.now }
});

const ForumPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: String,
  imageUrls: { type: [String], default: [] },
  userId: String,
  authorName: String,
  comments: [CommentSchema],
  approved: { type: Boolean, default: true },
  likes: { type: [String], default: [] },
  shares: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ForumPost', ForumPostSchema);