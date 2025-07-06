const mongoose = require('mongoose');

const communicationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['email', 'sms', 'call', 'meeting', 'chat'],
    required: true
  },
  subject: {
    type: String
  },
  content: {
    type: String,
    required: true
  },
  recipient: {
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String
    }
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'failed'],
    default: 'draft'
  },
  sentAt: {
    type: Date
  },
  openedAt: {
    type: Date
  },
  clickedAt: {
    type: Date
  },
  repliedAt: {
    type: Date
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  tags: [{
    type: String
  }],
  recordingUrl: {
    type: String
  },
  duration: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
communicationSchema.index({ sender: 1, campaign: 1 });
communicationSchema.index({ 'recipient.email': 1 });
communicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Communication', communicationSchema);