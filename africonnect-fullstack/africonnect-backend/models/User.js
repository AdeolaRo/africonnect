const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
  verified: { type: Boolean, default: false },
  fullName: String,
  pseudo: String,
  avatar: String,
  city: String,
  origin: String,
  passions: String,
  bio: String,
  savedPosts: [{ type: String }],
  verificationToken: String,
  resetToken: String,
  resetExpires: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);