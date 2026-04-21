const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  label: { type: String, default: '' },
  url: { type: String, required: true }
}, { _id: false });

const MarketplaceItemSchema = new mongoose.Schema({
  title: String,
  desc: String,
  price: String,
  location: String,
  imageUrl: String,
  imageUrls: { type: [String], default: [] },
  links: { type: [LinkSchema], default: [] },
  userId: String,
  authorName: String,
  likes: { type: [String], default: [] },
  shares: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MarketplaceItem', MarketplaceItemSchema);