const express = require('express');
const router = express.Router();

console.log('=== APPLICATION ROUTES: Starting to load (Railway Fix v2) ===');

let applicationService;
let auth;
let validateApplication;
let metricsTracker;

try {
  console.log('=== APPLICATION ROUTES: Loading simple applicationService ===');
  applicationService = require('../services/applicationServiceSimple');
  console.log('=== APPLICATION ROUTES: simple applicationService loaded successfully ===');
  console.log('applicationService type:', typeof applicationService);
  console.log('applicationService methods:', Object.getOwnPropertyNames(applicationService));
  console.log('createApplication exists:', typeof applicationService.createApplication === 'function');
} catch (error) {
  console.error('=== APPLICATION ROUTES: ERROR loading simple applicationService ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}

try {
  console.log('=== APPLICATION ROUTES: Loading auth middleware ===');
  auth = require('./middleware/auth');
  console.log('=== APPLICATION ROUTES: auth middleware loaded successfully ===');
  console.log('Auth middleware type:', typeof auth);
} catch (error) {
  console.error('=== APPLICATION ROUTES: ERROR loading auth middleware ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}

try {
  console.log('=== APPLICATION ROUTES: Loading dynamic validation middleware ===');
  const { validateDynamicApplication } = require('../middleware/dynamicValidation');
  validateApplication = {
    validateApplicationData: validateDynamicApplication,
    validateApplicationUpdate: (req, res, next) => next() // Keep legacy update validation for now
  };
  console.log('=== APPLICATION ROUTES: dynamic validation middleware loaded successfully ===');
} catch (error) {
  console.error('=== APPLICATION ROUTES: ERROR loading dynamic validation middleware ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  // Fallback to legacy validation if dynamic validation fails
  try {
    validateApplication = require('../middleware/validateApplication');
    console.log('=== FALLBACK: Using legacy validation middleware ===');
  } catch (legacyError) {
    console.log('=== VALIDATION MIDDLEWARE DISABLED - CONTINUING WITHOUT VALIDATION ===');
    validateApplication = {
      validateApplicationData: (req, res, next) => next(),
      validateApplicationUpdate: (req, res, next) => next()
    };
  }
}

try {
  console.log('=== APPLICATION ROUTES: Loading metrics tracker ===');
  metricsTracker = require('../utils/metrics');
  console.log('=== APPLICATION ROUTES: metrics tracker loaded successfully ===');
} catch (error) {
  console.error('=== APPLICATION ROUTES: ERROR loading metrics tracker ===');
  console.error('Error:', error.message);
  // Don't throw error - metrics are optional
  metricsTracker = { 
    incrementApplicationSubmission: () => {}, 
    incrementApplicationError: () => {} 
  };
}

/**
 * @route POST /api/clinic-applications
 * @desc Submit a new clinic application
 * @access Public
 */
// Simple test endpoint without middleware
router.post('/test', async (req, res) => {
  try {
    console.log('=== TEST ENDPOINT HIT ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    res.status(200).json({
      success: true,
      message: 'Test endpoint working',
      timestamp: new Date().toISOString(),
      data: req.body
    });
  } catch (error) {
    console.error('=== TEST ENDPOINT ERROR ===', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple test endpoint without middleware
router.post('/test-simple', async (req, res) => {
  try {
    console.log('🔍 SIMPLE TEST: Endpoint hit');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    res.status(200).json({
      success: true,
      message: 'Simple test endpoint working',
      timestamp: new Date().toISOString(),
      data: req.body
    });
  } catch (error) {
    console.error('🔍 SIMPLE TEST ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/test-validation', validateApplication.validateApplicationData, async (req, res) => {
  try {
    console.log('🔍 VALIDATION TEST: Endpoint hit after middleware');
    console.log('Validated data:', !!req.validatedData);
    res.status(200).json({
      success: true,
      message: 'Validation test endpoint working',
      hasValidatedData: !!req.validatedData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🔍 VALIDATION TEST ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check form configuration
router.get('/debug/form-config/:applicationType?', async (req, res) => {
  try {
    const applicationType = req.params.applicationType || 'clinical';
    console.log('=== DEBUG FORM CONFIG ENDPOINT ===');
    console.log('Application type:', applicationType);
    
    const FormConfiguration = require('../models/FormConfiguration');
    const formConfig = await FormConfiguration.getActiveFormByType(applicationType);
    
    if (!formConfig) {
      return res.status(404).json({
        success: false,
        message: `No active form configuration found for ${applicationType}`,
        availableTypes: ['clinical', 'affiliate', 'wholesale']
      });
    }
    
    res.status(200).json({
      success: true,
      formConfiguration: {
        id: formConfig._id,
        name: formConfig.name,
        version: formConfig.version,
        applicationType: formConfig.applicationType,
        isActive: formConfig.isActive,
        isDefault: formConfig.isDefault,
        totalFields: formConfig.fields.length,
        requiredFields: formConfig.fields.filter(f => f.required).map(f => ({
          fieldId: f.fieldId,
          label: f.label,
          type: f.type,
          section: f.section
        })),
        optionalFields: formConfig.fields.filter(f => !f.required).map(f => ({
          fieldId: f.fieldId,
          label: f.label,
          type: f.type,
          section: f.section
        }))
      }
    });
  } catch (error) {
    console.error('=== DEBUG FORM CONFIG ERROR ===', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.post('/submit-as-lead', async (req, res) => {
  try {
    console.log('=== SIMPLIFIED APPLICATION SUBMISSION ===');
    console.log('Converting application to lead:', req.body);
    
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      companyName, 
      businessType,
      applicationType = 'clinical'
    } = req.body;
    
    // Create lead data from application
    const leadData = {
      firstName,
      lastName,
      email,
      phone,
      companyName,
      businessType,
      source: `Application Form (${applicationType})`,
      score: 50,
      status: 'new'
    };
    
    const Lead = require('../models/Lead');
    const newLead = new Lead(leadData);
    const savedLead = await newLead.save();
    
    console.log('Lead created successfully:', savedLead._id);
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully and converted to lead',
      leadId: savedLead._id
    });
    
  } catch (error) {
    console.error('Error creating lead from application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit application'
    });
  }
});

const requestTimeout = (req, res, next) => {
  const timeout = setTimeout(() => {
    console.error('🔍 REQUEST TIMEOUT: Request took longer than 30 seconds');
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: 'Request timeout - server took too long to process',
        timestamp: new Date().toISOString()
      });
    }
  }, 30000); // 30 second timeout

  res.on('finish', () => clearTimeout(timeout));
  next();
};

router.post('/', requestTimeout, validateApplication.validateApplicationData, async (req, res) => {
  try {
    console.log('🔍 STEP 1: Route handler started');
    console.log('=== APPLICATION ROUTE: POST /api/applications (Dynamic Validation) ===');
    console.log('Request received at:', new Date().toISOString());
    console.log('Request body structure:', JSON.stringify(req.body, null, 2));
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Validated data available:', !!req.validatedData);
    
    console.log('🔍 STEP 2: Checking request structure...');
    
    // Debug the request structure
    if (req.body.personalInfo) {
      console.log('personalInfo keys:', Object.keys(req.body.personalInfo));
    }
    if (req.body.businessInfo) {
      console.log('businessInfo keys:', Object.keys(req.body.businessInfo));
    }
    if (req.body.requirements) {
      console.log('requirements keys:', Object.keys(req.body.requirements));
    }
    
    console.log('🔍 STEP 3: Checking validation middleware results...');
    // Check if we have validated data from dynamic validation middleware
    if (req.validatedData) {
      console.log('🔍 STEP 4: USING DYNAMIC VALIDATION DATA ===');
      console.log('Form configuration:', req.validatedData.formConfiguration);
      console.log('Form version:', req.validatedData.formVersion);
      console.log('Application type:', req.validatedData.applicationType);
      
      const {
        responseData,
        formConfiguration,
        formVersion,
        applicationType,
        validationMetadata
      } = req.validatedData;
      
      // Create application with dynamic data structure
      const applicationData = {
        applicationType,
        formConfiguration,
        formVersion,
        responseData,
        validationMetadata,
        
        // Backwards compatibility - populate legacy fields
        email: responseData.email,
        firstName: responseData.firstName,
        lastName: responseData.lastName,
        phone: responseData.phone,
        companyName: responseData.companyName,
        businessType: responseData.businessType,
        yearsInBusiness: responseData.yearsInBusiness,
        mainChallenges: responseData.mainChallenges || responseData.currentChallenges,
        goals: responseData.goals || responseData.primaryGoals,
        timeline: responseData.timeline,
        
        // Additional analytics and metadata
        submissionMetadata: {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          referrer: req.headers.referer,
          sessionId: req.headers['x-session-id'] || req.body.sessionId
        },
        analytics: {
          startTime: new Date(),
          submitTime: new Date(),
          deviceInfo: {
            userAgent: req.headers['user-agent'],
            isMobile: /Mobile|Android|iPhone|iPad/.test(req.headers['user-agent'] || '')
          }
        }
      };
      
      console.log('🔍 STEP 4: CALLING APPLICATION SERVICE (Dynamic) ===');
      console.log('Creating application with dynamic data structure');
      console.log('Application data to be created:', JSON.stringify(applicationData, null, 2));
      
      console.log('🔍 STEP 5: About to call applicationService.createApplication...');
      // Create application
      const application = await applicationService.createApplication(applicationData);
      console.log('🔍 STEP 6: applicationService.createApplication completed successfully');
      
      console.log('=== APPLICATION CREATED SUCCESSFULLY (Dynamic) ===');
      console.log('Application ID:', application._id);
      console.log('Form configuration used:', formConfiguration);
      console.log('Quality score:', application.qualityScores?.completeness || 'Not calculated');
      
      // Track successful submission
      if (metricsTracker && metricsTracker.incrementApplicationSubmission) {
        metricsTracker.incrementApplicationSubmission();
      }
      
      res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: {
          applicationId: application._id,
          status: application.status,
          submittedAt: application.createdAt,
          formConfiguration: {
            id: formConfiguration,
            version: formVersion
          },
          qualityScore: application.qualityScores?.completeness,
          validationWarnings: validationMetadata?.validationWarnings
        }
      });
      
    } else {
      console.log('🔍 STEP 3: FALLBACK: Using legacy validation approach ===');
      console.log('Dynamic validation did not run or failed');
      // Fallback to legacy approach if dynamic validation didn't run
      const { personalInfo = {}, businessInfo = {}, requirements = {}, applicationType = 'clinical' } = req.body;
      
      // Extract legacy data structure
      const email = personalInfo.email || req.body.email;
      const firstName = personalInfo.firstName || req.body.firstName;
      const lastName = personalInfo.lastName || req.body.lastName;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required for application submission.'
        });
      }
      
      console.log('🔍 STEP 4: CALLING APPLICATION SERVICE (Legacy Mode) ===');
      
      console.log('🔍 STEP 5: About to find form configuration...');
      // Try to get default form configuration for the application type
      let defaultFormConfig = null;
      let formVersion = '1.0.0';
      
      try {
        const FormConfiguration = require('../models/FormConfiguration');
        defaultFormConfig = await FormConfiguration.findOne({
          applicationType,
          isDefault: true,
          isActive: true
        });
        
        if (defaultFormConfig) {
          formVersion = defaultFormConfig.version;
          console.log(`✓ Found default form configuration for ${applicationType}: ${defaultFormConfig._id}`);
        } else {
          console.log(`⚠ No default form configuration found for ${applicationType}, will use fallback`);
        }
      } catch (formConfigError) {
        console.log(`⚠ Error finding form configuration: ${formConfigError.message}`);
      }
      
      // Create application with legacy data structure including required fields
      const applicationData = {
        applicationType,
        email,
        firstName,
        lastName,
        formConfiguration: defaultFormConfig ? defaultFormConfig._id : null,
        formVersion,
        responseData: {
          ...personalInfo,
          ...businessInfo,
          ...requirements,
          email,
          firstName,
          lastName
        }
      };
      
      // Create application
      const application = await applicationService.createApplication(applicationData);
      
      // Track successful submission
      if (metricsTracker && metricsTracker.incrementApplicationSubmission) {
        metricsTracker.incrementApplicationSubmission();
      }
      
      console.log('=== APPLICATION CREATED SUCCESSFULLY (Legacy Mode) ===');
      console.log('Application ID:', application._id);
      
      res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: {
          applicationId: application._id,
          status: application.status,
          submittedAt: application.createdAt
        }
      });
    }

  } catch (error) {
    // Track error
    if (metricsTracker && metricsTracker.incrementApplicationError) {
      metricsTracker.incrementApplicationError();
    }

    console.error('=== APPLICATION ROUTE ERROR: POST /api/applications (Dynamic/Legacy) ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body received:', JSON.stringify(req.body, null, 2));
    console.error('Validation mode:', req.validatedData ? 'Dynamic' : 'Legacy');
    if (req.validatedData) {
      console.error('Validated data:', JSON.stringify(req.validatedData, null, 2));
    }
    
    // Specific error types with structured responses
    if (error.message && error.message.includes('already exists')) {
      const email = req.validatedData?.responseData?.email || req.body.email || req.body.personalInfo?.email;
      const applicationType = req.validatedData?.applicationType || req.body.applicationType || 'clinical';
      
      return res.status(409).json({
        success: false,
        error: error.message,
        errorType: 'DUPLICATE_APPLICATION',
        details: { email, applicationType }
      });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => {
        // Handle complex error objects that might stringify to [object Object]
        if (typeof err === 'object' && err.message) {
          return err.message;
        } else if (typeof err === 'string') {
          return err;
        } else {
          return 'Invalid field value';
        }
      });
      
      return res.status(400).json({
        success: false,
        error: `Validation failed: ${validationErrors.join(', ')}`,
        errorType: 'VALIDATION_ERROR',
        fields: validationErrors
      });
    }
    
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection failed. Please try again.',
        errorType: 'DATABASE_ERROR'
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format provided.',
        errorType: 'DATA_FORMAT_ERROR'
      });
    }
    
    // Handle any remaining errors that might contain [object Object]
    let errorMessage = error.message || 'Failed to submit application. Please try again.';
    
    // Fix [object Object] errors by extracting meaningful information
    if (errorMessage.includes('[object Object]')) {
      console.error('=== DETECTED [object Object] ERROR - EXTRACTING DETAILS ===');
      console.error('Original error message:', errorMessage);
      console.error('Error object:', error);
      console.error('Error properties:', Object.keys(error));
      console.error('Error name:', error.name);
      console.error('Error code:', error.code);
      
      // Try to extract meaningful error information
      if (error.errors) {
        console.error('Processing error.errors:', error.errors);
        const extractedErrors = Object.values(error.errors).map(err => {
          console.error('Processing individual error:', err);
          if (typeof err === 'string') {
            return err;
          } else if (typeof err === 'object' && err !== null) {
            if (err.message) {
              return err.message;
            } else if (err.path && err.kind) {
              return `${err.path}: ${err.kind} validation failed`;
            } else if (err.toString && typeof err.toString === 'function') {
              const stringified = err.toString();
              return stringified !== '[object Object]' ? stringified : 'Validation error';
            }
          }
          return 'Unknown validation error';
        });
        errorMessage = `Validation failed: ${extractedErrors.join(', ')}`;
        console.error('Extracted error message:', errorMessage);
      } else if (error.code === 11000) {
        // Handle MongoDB duplicate key error
        const duplicateField = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'unknown field';
        errorMessage = `Duplicate entry detected for ${duplicateField}. This application may already exist.`;
        console.error('MongoDB duplicate key error:', errorMessage);
      } else if (error.name === 'ValidationError') {
        errorMessage = 'Application data validation failed. Please check your information and try again.';
        console.error('Generic validation error:', errorMessage);
      } else {
        errorMessage = 'Application submission failed due to server error.';
        console.error('Generic server error:', errorMessage);
      }
    }

    // Generic server error with development details
    res.status(500).json({
      success: false,
      error: errorMessage,
      errorType: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/clinic-applications/list
 * @desc Get all applications (admin only)
 * @access Private
 */
router.get('/list', auth, async (req, res) => {
  try {
    console.log('=== APPLICATION ROUTE: GET /api/clinic-applications/list ===');
    console.log('Query params:', req.query);

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      status: req.query.status,
      applicationType: req.query.applicationType,
      businessType: req.query.businessType
    };

    const result = await applicationService.getApplications(options);

    console.log(`Retrieved ${result.applications.length} applications`);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('=== APPLICATION ROUTE ERROR: GET /api/clinic-applications/list ===');
    console.error('Error details:', error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve applications. Please try again.'
    });
  }
});

/**
 * @route GET /api/clinic-applications/:applicationId
 * @desc Get application status by ID
 * @access Public
 */
router.get('/:applicationId', async (req, res) => {
  try {
    console.log('=== APPLICATION ROUTE: GET /api/clinic-applications/:applicationId ===');
    console.log('Application ID:', req.params.applicationId);

    const { applicationId } = req.params;

    // Validate applicationId format (MongoDB ObjectId)
    if (!applicationId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid application ID format:', applicationId);
      return res.status(400).json({
        success: false,
        error: 'Invalid application ID format'
      });
    }

    const application = await applicationService.getApplicationById(applicationId);

    console.log('Application retrieved successfully:', application._id);

    // Return limited information for public access
    res.status(200).json({
      success: true,
      data: {
        application: {
          id: application._id,
          status: application.status,
          submittedAt: application.createdAt,
          reviewedAt: application.reviewedAt,
          notes: application.notes,
          applicationType: application.applicationType,
          companyName: application.companyName,
          email: application.email
        }
      }
    });

  } catch (error) {
    console.error('=== APPLICATION ROUTE ERROR: GET /api/clinic-applications/:applicationId ===');
    console.error('Error details:', error.message);

    if (error.message === 'Application not found') {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve application status. Please try again.'
    });
  }
});

/**
 * @route PUT /api/clinic-applications/:applicationId
 * @desc Update application status (admin only)
 * @access Private
 */
router.put('/:applicationId', auth, validateApplication.validateApplicationUpdate, async (req, res) => {
  try {
    console.log('=== APPLICATION ROUTE: PUT /api/clinic-applications/:applicationId ===');
    console.log('Application ID:', req.params.applicationId);
    console.log('Update data:', req.body);

    const { applicationId } = req.params;

    // Validate applicationId format
    if (!applicationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid application ID format'
      });
    }

    // Add reviewer information
    const updateData = {
      ...req.body,
      reviewedBy: req.user._id
    };

    const application = await applicationService.updateApplication(applicationId, updateData);

    console.log('Application updated successfully:', application._id);

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: {
        application
      }
    });

  } catch (error) {
    console.error('=== APPLICATION ROUTE ERROR: PUT /api/clinic-applications/:applicationId ===');
    console.error('Error details:', error.message);

    if (error.message === 'Application not found') {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: `Validation error: ${validationErrors.join(', ')}`
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update application. Please try again.'
    });
  }
});

console.log('=== APPLICATION ROUTES LOADED SUCCESSFULLY ===');

module.exports = router;
