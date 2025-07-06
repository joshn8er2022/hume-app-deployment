const mongoose = require('mongoose');

const conversionSchema = new mongoose.Schema({
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
  leadType: {
    type: String,
    enum: ['clinical', 'affiliate', 'wholesale'],
    required: true
  },
  leadData: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    companyName: String,
    businessType: String
  },
  userAgent: {
    type: String
  },
  ipAddress: {
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
conversionSchema.index({ landingPageId: 1, timestamp: -1 });
conversionSchema.index({ leadType: 1, timestamp: -1 });
conversionSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Conversion', conversionSchema);