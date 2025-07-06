const FormConfiguration = require('../models/FormConfiguration');

/**
 * Initialize default form configurations for all application types
 * This ensures there's always at least one active form available
 */
async function initializeDefaultForms() {
  console.log('=== INITIALIZING DEFAULT FORM CONFIGURATIONS FOR ALL TYPES ===');
  
  try {
    const applicationTypes = ['clinical', 'affiliate', 'wholesale'];
    const mongoose = require('mongoose');
    const defaultUserId = new mongoose.Types.ObjectId(); // Create a valid ObjectId for system user
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const applicationType of applicationTypes) {
      console.log(`\n--- Processing ${applicationType.toUpperCase()} application type ---`);
      
      try {
        // Check if a default form already exists for this application type
        const existingForm = await FormConfiguration.findOne({
          applicationType,
          isDefault: true,
          isActive: true
        });
        
        if (existingForm) {
          console.log(`✓ Default form already exists for ${applicationType}: ${existingForm.name}`);
          successCount++;
          continue;
        }
        
        console.log(`Creating default form for ${applicationType}...`);
        
        // Create default form configuration with retry logic
        let attempts = 0;
        let defaultForm = null;
        
        while (attempts < 3 && !defaultForm) {
          try {
            attempts++;
            console.log(`Attempt ${attempts} to create ${applicationType} form...`);
            
            defaultForm = await createDefaultFormForType(applicationType, defaultUserId);
            
            console.log(`✓ Created default form for ${applicationType}: ${defaultForm.name} (${defaultForm._id})`);
            successCount++;
            break;
            
          } catch (createError) {
            console.error(`❌ Attempt ${attempts} failed for ${applicationType}:`, createError.message);
            
            if (createError.message.includes('E11000') && attempts < 3) {
              console.log(`Retrying ${applicationType} form creation (attempt ${attempts + 1})...`);
              // Wait a bit before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              throw createError;
            }
          }
        }
        
        if (!defaultForm) {
          throw new Error(`Failed to create form after ${attempts} attempts`);
        }
        
      } catch (typeError) {
        console.error(`❌ FAILED to create ${applicationType} form:`, typeError.message);
        errorCount++;
        
        // Continue with other types even if one fails
        continue;
      }
    }
    
    console.log('\n=== DEFAULT FORM INITIALIZATION SUMMARY ===');
    console.log(`✅ Successfully processed: ${successCount}/${applicationTypes.length} application types`);
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount}/${applicationTypes.length} application types`);
    }
    
    if (successCount === applicationTypes.length) {
      console.log('🎉 ALL APPLICATION TYPES NOW HAVE DEFAULT FORMS');
    } else {
      console.log('⚠️  Some application types may need manual form creation');
    }
    
  } catch (error) {
    console.error('=== CRITICAL ERROR INITIALIZING DEFAULT FORMS ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=== ALL APPLICATION TYPES NEED MANUAL SETUP ===');
  }
}

/**
 * Create a default form configuration for a specific application type
 */
async function createDefaultFormForType(applicationType, createdBy) {
  const defaultFields = getDefaultFieldsForType(applicationType);
  
  const formConfig = new FormConfiguration({
    name: `Default ${applicationType.charAt(0).toUpperCase() + applicationType.slice(1)} Application Form`,
    description: `Auto-generated default form for ${applicationType} applications. This form provides backwards compatibility with the legacy system while enabling dynamic form capabilities.`,
    applicationType,
    version: '1.0.0',
    isActive: true,
    isDefault: true,
    createdBy,
    
    fields: defaultFields,
    
    sections: [
      {
        sectionId: 'personal',
        title: 'Personal Information',
        description: 'Basic contact information',
        order: 1
      },
      {
        sectionId: 'business',
        title: 'Business Information',
        description: 'Company and business details',
        order: 2
      },
      {
        sectionId: 'requirements',
        title: 'Requirements & Goals',
        description: 'Your specific needs and objectives',
        order: 3
      }
    ],
    
    // Form behavior settings
    allowPartialSubmission: false,
    enableAutoSave: true,
    maxSubmissions: 1,
    
    // Analytics settings
    analytics: {
      trackPageViews: true,
      trackFieldInteractions: true,
      trackSubmissionTime: true
    },
    
    // Email notifications
    notifications: {
      submitNotification: {
        enabled: true,
        recipients: ['admin@company.com'], // Configure based on environment
        template: 'new-application-notification'
      },
      confirmationEmail: {
        enabled: true,
        template: 'application-confirmation',
        subject: `Thank you for your ${applicationType} application`
      }
    },
    
    // Styling
    styling: {
      theme: 'default',
      brandColors: {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#0ea5e9'
      }
    }
  });
  
  return await formConfig.save();
}

/**
 * Get default field configurations for each application type
 */
function getDefaultFieldsForType(applicationType) {
  // Base fields common to all application types
  const baseFields = [
    {
      fieldId: 'firstName',
      label: 'First Name',
      type: 'text',
      required: true,
      order: 1,
      section: 'personal',
      placeholder: 'Enter your first name',
      validationRules: [
        { type: 'required', message: 'First name is required' },
        { type: 'minLength', value: 1, message: 'First name cannot be empty' },
        { type: 'maxLength', value: 50, message: 'First name must be less than 50 characters' }
      ]
    },
    {
      fieldId: 'lastName',
      label: 'Last Name',
      type: 'text',
      required: true,
      order: 2,
      section: 'personal',
      placeholder: 'Enter your last name',
      validationRules: [
        { type: 'required', message: 'Last name is required' },
        { type: 'minLength', value: 1, message: 'Last name cannot be empty' },
        { type: 'maxLength', value: 50, message: 'Last name must be less than 50 characters' }
      ]
    },
    {
      fieldId: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      order: 3,
      section: 'personal',
      placeholder: 'Enter your email address',
      helpText: 'We will use this email to contact you about your application',
      validationRules: [
        { type: 'required', message: 'Email address is required' },
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
      placeholder: 'Enter your phone number',
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
      placeholder: 'Enter your company name',
      validationRules: [
        { type: 'required', message: 'Company name is required' },
        { type: 'minLength', value: 1, message: 'Company name cannot be empty' }
      ]
    },
    {
      fieldId: 'businessType',
      label: 'Business Type',
      type: 'select',
      required: true,
      order: 6,
      section: 'business',
      helpText: 'Select the category that best describes your business',
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
    },
    {
      fieldId: 'yearsInBusiness',
      label: 'Years in Business',
      type: 'select',
      required: true,
      order: 7,
      section: 'business',
      options: [
        { value: '0-1', label: 'Less than 1 year' },
        { value: '2-5', label: '2-5 years' },
        { value: '6-10', label: '6-10 years' },
        { value: '11-20', label: '11-20 years' },
        { value: '20+', label: 'More than 20 years' }
      ],
      validationRules: [
        { type: 'required', message: 'Years in business is required' }
      ]
    },
    {
      fieldId: 'currentChallenges',
      label: 'Current Challenges',
      type: 'textarea',
      required: true,
      order: 8,
      section: 'requirements',
      placeholder: 'Describe your current business challenges and pain points',
      helpText: 'Help us understand what specific problems you are trying to solve',
      validationRules: [
        { type: 'required', message: 'Please describe your current challenges' },
        { type: 'minLength', value: 10, message: 'Please provide at least 10 characters' }
      ]
    },
    {
      fieldId: 'primaryGoals',
      label: 'Primary Goals',
      type: 'textarea',
      required: true,
      order: 9,
      section: 'requirements',
      placeholder: 'What are your main objectives and goals?',
      helpText: 'Tell us what you hope to achieve',
      validationRules: [
        { type: 'required', message: 'Please describe your primary goals' },
        { type: 'minLength', value: 10, message: 'Please provide at least 10 characters' }
      ]
    },
    {
      fieldId: 'timeline',
      label: 'Implementation Timeline',
      type: 'select',
      required: true,
      order: 10,
      section: 'requirements',
      helpText: 'When do you need this implemented?',
      options: [
        { value: 'immediate', label: 'Immediate (within 1 month)' },
        { value: '1-3months', label: '1-3 months' },
        { value: '3-6months', label: '3-6 months' },
        { value: '6months+', label: '6+ months' },
        { value: 'exploring', label: 'Just exploring options' }
      ],
      validationRules: [
        { type: 'required', message: 'Please select your preferred timeline' }
      ]
    }
  ];
  
  // Add application-type specific fields
  const typeSpecificFields = getTypeSpecificFields(applicationType);
  
  return [...baseFields, ...typeSpecificFields].sort((a, b) => a.order - b.order);
}

/**
 * Get fields specific to each application type
 */
function getTypeSpecificFields(applicationType) {
  switch (applicationType) {
    case 'clinical':
      return [
        {
          fieldId: 'numberOfEmployees',
          label: 'Number of Employees',
          type: 'select',
          required: false,
          order: 7.5,
          section: 'business',
          options: [
            { value: '1-5', label: '1-5 employees' },
            { value: '6-20', label: '6-20 employees' },
            { value: '21-50', label: '21-50 employees' },
            { value: '51-100', label: '51-100 employees' },
            { value: '100+', label: '100+ employees' }
          ]
        },
        {
          fieldId: 'currentRevenue',
          label: 'Annual Revenue',
          type: 'select',
          required: false,
          order: 8.5,
          section: 'business',
          options: [
            { value: '0-100k', label: 'Under $100k' },
            { value: '100k-500k', label: '$100k - $500k' },
            { value: '500k-1m', label: '$500k - $1M' },
            { value: '1m-5m', label: '$1M - $5M' },
            { value: '5m+', label: 'Over $5M' }
          ]
        }
      ];
      
    case 'affiliate':
      return [
        {
          fieldId: 'audienceSize',
          label: 'Audience Size',
          type: 'select',
          required: false,
          order: 7.5,
          section: 'business',
          options: [
            { value: '0-1k', label: 'Under 1,000' },
            { value: '1k-10k', label: '1,000 - 10,000' },
            { value: '10k-50k', label: '10,000 - 50,000' },
            { value: '50k-100k', label: '50,000 - 100,000' },
            { value: '100k+', label: 'Over 100,000' }
          ]
        },
        {
          fieldId: 'primaryPlatform',
          label: 'Primary Platform',
          type: 'select',
          required: false,
          order: 8.5,
          section: 'business',
          options: [
            { value: 'instagram', label: 'Instagram' },
            { value: 'youtube', label: 'YouTube' },
            { value: 'tiktok', label: 'TikTok' },
            { value: 'facebook', label: 'Facebook' },
            { value: 'linkedin', label: 'LinkedIn' },
            { value: 'website', label: 'Website/Blog' },
            { value: 'other', label: 'Other' }
          ]
        }
      ];
      
    case 'wholesale':
      return [
        {
          fieldId: 'distributionChannels',
          label: 'Distribution Channels',
          type: 'multiselect',
          required: false,
          order: 7.5,
          section: 'business',
          options: [
            { value: 'retail-stores', label: 'Retail Stores' },
            { value: 'online-marketplace', label: 'Online Marketplace' },
            { value: 'direct-sales', label: 'Direct Sales' },
            { value: 'pharmacy', label: 'Pharmacy' },
            { value: 'healthcare', label: 'Healthcare Facilities' }
          ]
        },
        {
          fieldId: 'orderVolume',
          label: 'Expected Monthly Order Volume',
          type: 'select',
          required: false,
          order: 8.5,
          section: 'business',
          options: [
            { value: '1-50', label: '1-50 units' },
            { value: '51-200', label: '51-200 units' },
            { value: '201-500', label: '201-500 units' },
            { value: '501-1000', label: '501-1,000 units' },
            { value: '1000+', label: 'Over 1,000 units' }
          ]
        }
      ];
      
    default:
      return [];
  }
}

module.exports = {
  initializeDefaultForms,
  createDefaultFormForType,
  getDefaultFieldsForType
};