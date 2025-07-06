const mongoose = require('mongoose');

const pageViewSchema = new mongoose.Schema({
  landingPageId: {
    type: String,
    required: true
  },
  landingPageName: {
    type: String,
    required: true
  },
  landingPageUrl: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  ipAddress: {
    type: String
  },
  referrer: {
    type: String
  },
  sessionId: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
pageViewSchema.index({ landingPageId: 1, timestamp: -1 });
pageViewSchema.index({ timestamp: -1 });

module.exports = mongoose.model('PageView', pageViewSchema);