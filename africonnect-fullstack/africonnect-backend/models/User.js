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
  /** Continent code (e.g. AF) — préférence d’affichage / publ. */
  continent: String,
  origin: String,
  passions: String,
  bio: String,
  savedPosts: [{ type: String }],
  createdByAdmin: { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: false },
  mustChangePseudo: { type: Boolean, default: false },
  mustChangeEmail: { type: Boolean, default: false },
  termsAcceptedVersion: { type: Number, default: 0 },
  /** Consentement cookies non essentiels (analytique) — synchronisé depuis le compte */
  analyticsOptIn: { type: Boolean, default: false },
  cookiePreferencesAt: { type: Date },
  verificationToken: String,
  resetToken: String,
  resetExpires: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);