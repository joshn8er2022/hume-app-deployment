const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  
  // Business Information
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    required: true,
    enum: ['diabetic', 'wellness', 'longevity', 'glp1', 'telehealth', 'affiliate', 'wholesale', 'health-coach', 'other']
  },
  yearsInBusiness: {
    type: String,
    required: true,
    enum: ['0-1', '2-5', '6-10', '11-20', '20+']
  },
  numberOfEmployees: {
    type: String,
    enum: ['1-5', '6-20', '21-50', '51-100', '100+']
  },
  currentRevenue: {
    type: String,
    enum: ['0-100k', '100k-500k', '500k-1m', '1m-5m', '5m+']
  },
  
  // Specific Requirements
  currentSolutions: {
    type: String,
    trim: true
  },
  mainChallenges: {
    type: String,
    required: true,
    trim: true
  },
  goals: {
    type: String,
    required: true,
    trim: true
  },
  timeline: {
    type: String,
    required: true,
    enum: ['immediate', '1-3months', '3-6months', '6months+', 'exploring']
  },
  budget: {
    type: String,
    enum: ['under-5k', '5k-15k', '15k-50k', '50k+', 'not-sure']
  },
  
  // Additional Information
  hearAboutUs: {
    type: String,
    enum: ['google', 'linkedin', 'referral', 'conference', 'social', 'email', 'other']
  },
  additionalInfo: {
    type: String,
    trim: true
  },
  
  // Application metadata
  applicationType: {
    type: String,
    required: true,
    enum: ['clinical', 'affiliate', 'wholesale'],
    default: 'clinical'
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'scheduled'],
    default: 'pending'
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  scheduledCallDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
applicationSchema.index({ email: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ applicationType: 1 });
applicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);