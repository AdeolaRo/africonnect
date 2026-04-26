const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  label: { type: String, default: '' },
  url: { type: String, required: true }
}, { _id: false });

const EventSchema = new mongoose.Schema({
  title: String,
  desc: String,
  eventDate: Date,
  location: String,
  imageUrl: String,
  imageUrls: { type: [String], default: [] },
  links: { type: [LinkSchema], default: [] },
  userId: String,
  authorName: String,
  likes: { type: [String], default: [] },
  shares: { type: Number, default: 0 },
  continent: { type: String, default: '' },
  city: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);