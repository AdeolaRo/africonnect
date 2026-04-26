const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  label: { type: String, default: '' },
  url: { type: String, required: true }
}, { _id: false });

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
  links: { type: [LinkSchema], default: [] },
  userId: String,
  authorName: String,
  comments: [CommentSchema],
  approved: { type: Boolean, default: true },
  likes: { type: [String], default: [] },
  shares: { type: Number, default: 0 },
  continent: { type: String, default: '' },
  city: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ForumPost', ForumPostSchema);