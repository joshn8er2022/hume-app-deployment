const mongoose = require('mongoose');

const validationRuleSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['required', 'minLength', 'maxLength', 'pattern', 'email', 'phone', 'custom']
  },
  value: mongoose.Schema.Types.Mixed, // String, Number, RegExp, or custom function
  message: {
    type: String,
    required: true
  }
});

const optionSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  metadata: mongoose.Schema.Types.Mixed // Additional data for complex options
});

const conditionalLogicSchema = new mongoose.Schema({
  dependsOn: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    required: true,
    enum: ['equals', 'contains', 'not_equals', 'greater_than', 'less_than', 'in_array']
  },
  value: mongoose.Schema.Types.Mixed,
  action: {
    type: String,
    required: true,
    enum: ['show', 'hide', 'require', 'optional']
  }
});

const fieldSchema = new mongoose.Schema({
  fieldId: {
    type: String,
    required: true,
    unique: true
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'textarea', 'email', 'phone', 'number', 'select', 'multiselect', 'radio', 'checkbox', 'date', 'file']
  },
  required: {
    type: Boolean,
    default: false
  },
  placeholder: String,
  helpText: String,
  order: {
    type: Number,
    required: true
  },
  section: {
    type: String,
    default: 'general'
  },
  // Field-specific configurations
  options: [optionSchema], // For select, radio, checkbox fields
  validationRules: [validationRuleSchema],
  conditionalLogic: [conditionalLogicSchema],
  
  // Field behavior
  defaultValue: mongoose.Schema.Types.Mixed,
  readonly: {
    type: Boolean,
    default: false
  },
  hidden: {
    type: Boolean,
    default: false
  },
  
  // Analytics and tracking
  trackChanges: {
    type: Boolean,
    default: true
  },
  includeInAnalytics: {
    type: Boolean,
    default: true
  },
  
  // Metadata for extensions
  metadata: mongoose.Schema.Types.Mixed
});

const formConfigurationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  applicationType: {
    type: String,
    required: true,
    enum: ['clinical', 'affiliate', 'wholesale', 'custom']
  },
  version: {
    type: String,
    required: true,
    default: '1.0.0'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  
  // Form structure
  fields: [fieldSchema],
  sections: [{
    sectionId: String,
    title: String,
    description: String,
    order: Number
  }],
  
  // Form behavior
  allowPartialSubmission: {
    type: Boolean,
    default: false
  },
  enableAutoSave: {
    type: Boolean,
    default: true
  },
  maxSubmissions: {
    type: Number,
    default: 1
  },
  
  // Email notifications
  notifications: {
    submitNotification: {
      enabled: Boolean,
      recipients: [String],
      template: String
    },
    confirmationEmail: {
      enabled: Boolean,
      template: String,
      subject: String
    }
  },
  
  // Analytics settings
  analytics: {
    trackPageViews: {
      type: Boolean,
      default: true
    },
    trackFieldInteractions: {
      type: Boolean,
      default: true
    },
    trackSubmissionTime: {
      type: Boolean,
      default: true
    }
  },
  
  // Access control
  accessControl: {
    requireAuth: {
      type: Boolean,
      default: false
    },
    allowedRoles: [String],
    ipWhitelist: [String]
  },
  
  // Styling and branding
  styling: {
    theme: {
      type: String,
      default: 'default'
    },
    customCSS: String,
    logo: String,
    brandColors: {
      primary: String,
      secondary: String,
      accent: String
    }
  },
  
  // Form metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  publishedAt: Date,
  archivedAt: Date,
  
  // Usage statistics
  statistics: {
    totalViews: {
      type: Number,
      default: 0
    },
    totalSubmissions: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
formConfigurationSchema.index({ applicationType: 1, isActive: 1 });
formConfigurationSchema.index({ isDefault: 1, applicationType: 1 });
formConfigurationSchema.index({ version: 1, name: 1 });
formConfigurationSchema.index({ createdBy: 1 });
// Remove global unique index on fieldId - fieldId only needs to be unique within a form
// formConfigurationSchema.index({ 'fields.fieldId': 1 });

// Pre-save middleware for validation
formConfigurationSchema.pre('save', function(next) {
  // Ensure field orders are unique
  const orders = this.fields.map(field => field.order);
  const uniqueOrders = [...new Set(orders)];
  if (orders.length !== uniqueOrders.length) {
    return next(new Error('Field orders must be unique'));
  }
  
  // Ensure fieldIds are unique within the form
  const fieldIds = this.fields.map(field => field.fieldId);
  const uniqueFieldIds = [...new Set(fieldIds)];
  if (fieldIds.length !== uniqueFieldIds.length) {
    return next(new Error('Field IDs must be unique within the form'));
  }
  
  // Only one default form per application type
  if (this.isDefault) {
    this.constructor.updateMany(
      { applicationType: this.applicationType, _id: { $ne: this._id } },
      { isDefault: false }
    ).exec();
  }
  
  next();
});

// Instance methods
formConfigurationSchema.methods.getFieldById = function(fieldId) {
  return this.fields.find(field => field.fieldId === fieldId);
};

formConfigurationSchema.methods.validateResponse = function(responseData) {
  const errors = [];
  const warnings = [];
  
  // Validate each field based on its configuration
  this.fields.forEach(field => {
    const value = responseData[field.fieldId];
    
    // Check required fields
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors.push(`${field.label} is required`);
      return;
    }
    
    // Skip validation if field is empty and not required
    if (!value) return;
    
    // Apply validation rules
    field.validationRules.forEach(rule => {
      const isValid = this.applyValidationRule(rule, value, field);
      if (!isValid) {
        errors.push(rule.message || `Invalid value for ${field.label}`);
      }
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

formConfigurationSchema.methods.applyValidationRule = function(rule, value, field) {
  switch (rule.type) {
    case 'required':
      return value !== null && value !== undefined && value !== '';
    
    case 'minLength':
      return typeof value === 'string' && value.length >= rule.value;
    
    case 'maxLength':
      return typeof value === 'string' && value.length <= rule.value;
    
    case 'pattern':
      const regex = new RegExp(rule.value);
      return regex.test(value);
    
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    
    case 'phone':
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
      return phoneRegex.test(value);
    
    default:
      return true;
  }
};

// Static methods
formConfigurationSchema.statics.getActiveFormByType = function(applicationType) {
  return this.findOne({
    applicationType,
    isActive: true,
    isDefault: true
  }).sort({ createdAt: -1 });
};

formConfigurationSchema.statics.createDefaultForm = function(applicationType, createdBy) {
  // Create a basic default form based on current application structure
  const defaultFields = [
    {
      fieldId: 'firstName',
      label: 'First Name',
      type: 'text',
      required: true,
      order: 1,
      section: 'personal',
      validationRules: [
        { type: 'required', message: 'First name is required' },
        { type: 'minLength', value: 1, message: 'First name must not be empty' }
      ]
    },
    {
      fieldId: 'lastName',
      label: 'Last Name',
      type: 'text',
      required: true,
      order: 2,
      section: 'personal',
      validationRules: [
        { type: 'required', message: 'Last name is required' },
        { type: 'minLength', value: 1, message: 'Last name must not be empty' }
      ]
    },
    {
      fieldId: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      order: 3,
      section: 'personal',
      validationRules: [
        { type: 'required', message: 'Email is required' },
        { type: 'email', message: 'Please provide a valid email address' }
      ]
    },
    {
      fieldId: 'phone',
      label: 'Phone Number',
      type: 'phone',
      required: true,
      order: 4,
      section: 'personal',
      validationRules: [
        { type: 'required', message: 'Phone number is required' },
        { type: 'phone', message: 'Please provide a valid phone number' }
      ]
    },
    {
      fieldId: 'companyName',
      label: 'Company Name',
      type: 'text',
      required: true,
      order: 5,
      section: 'business',
      validationRules: [
        { type: 'required', message: 'Company name is required' }
      ]
    },
    {
      fieldId: 'businessType',
      label: 'Business Type',
      type: 'select',
      required: true,
      order: 6,
      section: 'business',
      options: [
        { value: 'diabetic', label: 'Diabetic Care' },
        { value: 'wellness', label: 'Wellness' },
        { value: 'longevity', label: 'Longevity' },
        { value: 'glp1', label: 'GLP-1' },
        { value: 'telehealth', label: 'Telehealth' },
        { value: 'affiliate', label: 'Affiliate' },
        { value: 'wholesale', label: 'Wholesale' },
        { value: 'health-coach', label: 'Health Coach' },
        { value: 'wellness-influencer', label: 'Wellness Influencer' },
        { value: 'other', label: 'Other' }
      ],
      validationRules: [
        { type: 'required', message: 'Business type is required' }
      ]
    }
  ];
  
  return this.create({
    name: `Default ${applicationType} Form`,
    description: `Default form configuration for ${applicationType} applications`,
    applicationType,
    isDefault: true,
    createdBy,
    fields: defaultFields,
    sections: [
      { sectionId: 'personal', title: 'Personal Information', order: 1 },
      { sectionId: 'business', title: 'Business Information', order: 2 }
    ]
  });
};

module.exports = mongoose.model('FormConfiguration', formConfigurationSchema);