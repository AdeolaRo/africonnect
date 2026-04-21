const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  label: { type: String, default: '' },
  url: { type: String, required: true }
}, { _id: false });

const CommentSchema = new mongoose.Schema({
  userId: String,
  authorName: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const GroupPostSchema = new mongoose.Schema({
  groupId: { type: String, index: true, required: true },
  userId: { type: String, required: true },
  authorName: { type: String, default: '' },
  content: { type: String, default: '' },
  imageUrls: { type: [String], default: [] },
  links: { type: [LinkSchema], default: [] },
  likes: { type: [String], default: [] },
  comments: { type: [CommentSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GroupPost', GroupPostSchema);

