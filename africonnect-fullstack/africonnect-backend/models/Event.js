const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: String,
  desc: String,
  eventDate: Date,
  location: String,
  userId: String,
  authorName: String,
  likes: { type: [String], default: [] },
  shares: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);