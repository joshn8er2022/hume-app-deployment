const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // Core application metadata
  applicationType: {
    type: String,
    required: true,
    enum: ['clinical', 'affiliate', 'wholesale', 'custom'],
    default: 'clinical'
  },
  
  // Form configuration reference (optional for backwards compatibility)
  formConfiguration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FormConfiguration',
    required: false // Allow legacy applications without form configuration
  },
  formVersion: {
    type: String,
    required: false, // Allow legacy applications without version
    default: '1.0.0'
  },
  
  // Flexible response data storage
  responseData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Backwards compatibility - legacy fields (deprecated but maintained)
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: true
    // index: true removed to prevent duplicate with schema.index below
  },
  phone: {
    type: String,
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  businessType: {
    type: String
  },
  yearsInBusiness: {
    type: String
  },
  numberOfEmployees: {
    type: String
  },
  currentRevenue: {
    type: String
  },
  currentSolutions: {
    type: String,
    trim: true
  },
  mainChallenges: {
    type: String,
    trim: true
  },
  goals: {
    type: String,
    trim: true
  },
  timeline: {
    type: String
  },
  budget: {
    type: String
  },
  hearAboutUs: {
    type: String
  },
  additionalInfo: {
    type: String,
    trim: true
  },
  
  // Application processing
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'scheduled', 'archived'],
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
  },
  
  // Advanced features
  submissionMetadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    sessionId: String,
    browserFingerprint: String
  },
  
  // Form interaction analytics
  analytics: {
    startTime: Date,
    submitTime: Date,
    completionTimeSeconds: Number,
    pageViews: {
      type: Number,
      default: 1
    },
    fieldInteractions: [{
      fieldId: String,
      interactions: Number,
      timeSpent: Number,
      firstInteraction: Date,
      lastInteraction: Date
    }],
    abandonmentPoint: String, // Last field interacted with before abandoning
    deviceInfo: {
      type: String,
      browser: String,
      os: String,
      screenResolution: String,
      isMobile: Boolean
    }
  },
  
  // Quality scores and flags
  qualityScores: {
    completeness: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 100
    },
    engagement: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  
  // Flags for review
  flags: [{
    type: {
      type: String,
      enum: ['spam', 'incomplete', 'duplicate', 'suspicious', 'high_value', 'follow_up_required']
    },
    reason: String,
    flaggedBy: {
      type: String,
      enum: ['system', 'admin', 'ai']
    },
    flaggedAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Follow-up tracking
  followUp: {
    attempts: [{
      method: {
        type: String,
        enum: ['email', 'phone', 'sms', 'linkedin']
      },
      date: Date,
      success: Boolean,
      notes: String,
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    nextFollowUpDate: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
  },
  
  // Integration data
  integrations: {
    salesforce: {
      leadId: String,
      contactId: String,
      opportunityId: String,
      syncedAt: Date
    },
    hubspot: {
      contactId: String,
      dealId: String,
      syncedAt: Date
    },
    marketo: {
      leadId: String,
      syncedAt: Date
    },
    custom: mongoose.Schema.Types.Mixed
  },
  
  // Data processing
  isProcessed: {
    type: Boolean,
    default: false
  },
  processedAt: Date,
  processingErrors: [String],
  
  // Archival
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  archivalReason: String
}, {
  timestamps: true
});

// Enhanced indexes for performance
applicationSchema.index({ email: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ applicationType: 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ formConfiguration: 1 });
applicationSchema.index({ 'submissionMetadata.ipAddress': 1 });
applicationSchema.index({ 'analytics.submitTime': -1 });
applicationSchema.index({ 'qualityScores.completeness': -1 });
applicationSchema.index({ 'flags.type': 1, 'flags.resolved': 1 });
applicationSchema.index({ 'followUp.nextFollowUpDate': 1 });
applicationSchema.index({ isProcessed: 1 });

// Compound indexes for common queries
applicationSchema.index({ applicationType: 1, status: 1, createdAt: -1 });
applicationSchema.index({ formConfiguration: 1, createdAt: -1 });
applicationSchema.index({ status: 1, 'followUp.priority': -1 });

// Pre-save middleware
applicationSchema.pre('save', async function(next) {
  try {
    // Auto-populate legacy fields from responseData for backwards compatibility
    if (this.responseData) {
      this.firstName = this.responseData.firstName || this.firstName;
      this.lastName = this.responseData.lastName || this.lastName;
      this.email = this.responseData.email || this.email;
      this.phone = this.responseData.phone || this.phone;
      this.companyName = this.responseData.companyName || this.companyName;
      this.businessType = this.responseData.businessType || this.businessType;
      this.yearsInBusiness = this.responseData.yearsInBusiness || this.yearsInBusiness;
      this.mainChallenges = this.responseData.mainChallenges || this.responseData.currentChallenges || this.mainChallenges;
      this.goals = this.responseData.goals || this.responseData.primaryGoals || this.goals;
      this.timeline = this.responseData.timeline || this.timeline;
    }
    
    // Calculate completeness score
    if (this.responseData && this.formConfiguration) {
      this.qualityScores.completeness = await this.calculateCompletenessScore();
    }
    
    // Set submission analytics if not already set
    if (this.isNew && !this.analytics.submitTime) {
      this.analytics.submitTime = new Date();
      if (this.analytics.startTime) {
        this.analytics.completionTimeSeconds = Math.floor(
          (this.analytics.submitTime - this.analytics.startTime) / 1000
        );
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
applicationSchema.methods.calculateCompletenessScore = async function() {
  try {
    const FormConfiguration = mongoose.model('FormConfiguration');
    const formConfig = await FormConfiguration.findById(this.formConfiguration);
    
    if (!formConfig) return 0;
    
    const requiredFields = formConfig.fields.filter(field => field.required);
    const totalRequired = requiredFields.length;
    
    if (totalRequired === 0) return 100;
    
    let completedRequired = 0;
    requiredFields.forEach(field => {
      const value = this.responseData[field.fieldId];
      if (value && value !== '' && value !== null && value !== undefined) {
        completedRequired++;
      }
    });
    
    return Math.round((completedRequired / totalRequired) * 100);
  } catch (error) {
    console.error('Error calculating completeness score:', error);
    return 0;
  }
};

applicationSchema.methods.getResponseValue = function(fieldId) {
  return this.responseData ? this.responseData[fieldId] : this[fieldId];
};

applicationSchema.methods.setResponseValue = function(fieldId, value) {
  if (!this.responseData) {
    this.responseData = {};
  }
  this.responseData[fieldId] = value;
  this.markModified('responseData');
};

applicationSchema.methods.addFlag = function(type, reason, flaggedBy = 'system') {
  this.flags.push({
    type,
    reason,
    flaggedBy,
    flaggedAt: new Date()
  });
};

applicationSchema.methods.resolveFlag = function(flagId, resolvedBy) {
  const flag = this.flags.id(flagId);
  if (flag) {
    flag.resolved = true;
    flag.resolvedAt = new Date();
    flag.resolvedBy = resolvedBy;
  }
};

applicationSchema.methods.addFollowUpAttempt = function(method, success, notes, performedBy) {
  if (!this.followUp.attempts) {
    this.followUp.attempts = [];
  }
  this.followUp.attempts.push({
    method,
    date: new Date(),
    success,
    notes,
    performedBy
  });
};

applicationSchema.methods.toClientJSON = function() {
  const obj = this.toObject();
  
  // Remove sensitive/internal fields from client response
  delete obj.submissionMetadata;
  delete obj.analytics;
  delete obj.qualityScores;
  delete obj.flags;
  delete obj.followUp;
  delete obj.integrations;
  delete obj.processingErrors;
  
  return obj;
};

applicationSchema.methods.toAnalyticsJSON = function() {
  return {
    _id: this._id,
    applicationType: this.applicationType,
    status: this.status,
    formConfiguration: this.formConfiguration,
    formVersion: this.formVersion,
    responseData: this.responseData,
    qualityScores: this.qualityScores,
    analytics: this.analytics,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static methods
applicationSchema.statics.findByEmail = function(email, applicationType = null) {
  const query = { email: email.toLowerCase() };
  if (applicationType) {
    query.applicationType = applicationType;
  }
  return this.find(query).sort({ createdAt: -1 });
};

applicationSchema.statics.getAnalytics = function(filters = {}) {
  const pipeline = [
    // Match stage
    { $match: filters },
    
    // Group by status
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgCompleteness: { $avg: '$qualityScores.completeness' },
        avgCompletionTime: { $avg: '$analytics.completionTimeSeconds' }
      }
    },
    
    // Sort by count
    { $sort: { count: -1 } }
  ];
  
  return this.aggregate(pipeline);
};

applicationSchema.statics.getSubmissionTrends = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const pipeline = [
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 },
        avgCompleteness: { $avg: '$qualityScores.completeness' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ];
  
  return this.aggregate(pipeline);
};

applicationSchema.statics.findDuplicates = function() {
  const pipeline = [
    {
      $group: {
        _id: '$email',
        count: { $sum: 1 },
        applications: { $push: '$_id' }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

applicationSchema.statics.getQualityMetrics = function() {
  const pipeline = [
    {
      $group: {
        _id: null,
        avgCompleteness: { $avg: '$qualityScores.completeness' },
        avgAccuracy: { $avg: '$qualityScores.accuracy' },
        avgEngagement: { $avg: '$qualityScores.engagement' },
        totalApplications: { $sum: 1 },
        flaggedApplications: {
          $sum: {
            $cond: [{ $gt: [{ $size: '$flags' }, 0] }, 1, 0]
          }
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Virtual for display name
applicationSchema.virtual('displayName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.email || 'Unknown';
});

// Virtual for days since submission
applicationSchema.virtual('daysSinceSubmission').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Application', applicationSchema);