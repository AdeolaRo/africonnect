const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  label: { type: String, default: '' },
  url: { type: String, required: true }
}, { _id: false });

const GroupSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  imageUrl: String,
  imageUrls: { type: [String], default: [] },
  links: { type: [LinkSchema], default: [] },
  members: [String],
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  rules: { type: String, default: '' },
  moderators: { type: [String], default: [] },
  bannedMembers: { type: [String], default: [] },
  joinRequests: { type: [String], default: [] }, // userIds pending approval (private groups)
  invites: {
    type: [{
      userId: String,
      email: String,
      status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
      createdAt: { type: Date, default: Date.now }
    }],
    default: []
  },
  userId: String,
  authorName: String,
  /** Localisation d’annonce (recherche / affichage), comme les autres rubriques */
  continent: { type: String, default: '' },
  city: { type: String, default: '' },
  likes: { type: [String], default: [] },
  shares: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

GroupSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Group', GroupSchema);