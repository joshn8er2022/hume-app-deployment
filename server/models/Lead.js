const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  phone: {
    type: String
  },
  companyName: {
    type: String
  },
  businessType: {
    type: String,
    enum: ['diabetic', 'wellness', 'longevity', 'glp1', 'telehealth', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'closed-won', 'closed-lost'],
    default: 'new'
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'social', 'email', 'phone', 'other']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);