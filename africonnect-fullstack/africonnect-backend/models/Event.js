const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: String,
  desc: String,
  eventDate: Date,
  location: String,
  imageUrl: String,
  imageUrls: { type: [String], default: [] },
  userId: String,
  authorName: String,
  likes: { type: [String], default: [] },
  shares: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);