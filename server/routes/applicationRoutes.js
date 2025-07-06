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

router.post('/', validateApplication.validateApplicationData, async (req, res) => {
  try {
    console.log('=== APPLICATION ROUTE: POST /api/clinic-applications (Dynamic Validation) ===');
    console.log('Request received at:', new Date().toISOString());
    console.log('Validated data available:', !!req.validatedData);
    
    // Check if we have validated data from dynamic validation middleware
    if (req.validatedData) {
      console.log('=== USING DYNAMIC VALIDATION DATA ===');
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
      
      console.log('=== CALLING APPLICATION SERVICE (Dynamic) ===');
      console.log('Creating application with dynamic data structure');
      
      // Create application
      const application = await applicationService.createApplication(applicationData);
      
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
      console.log('=== FALLBACK: Using legacy validation approach ===');
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
      
      console.log('=== CALLING APPLICATION SERVICE (Legacy Mode) ===');
      
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
      console.error('Detected [object Object] in error message, attempting to extract details');
      console.error('Error object:', error);
      console.error('Error properties:', Object.keys(error));
      
      // Try to extract meaningful error information
      if (error.errors) {
        const extractedErrors = Object.values(error.errors).map(err => {
          if (typeof err === 'object' && err.message) {
            return err.message;
          }
          return 'Unknown validation error';
        });
        errorMessage = `Validation failed: ${extractedErrors.join(', ')}`;
      } else if (error.code === 11000) {
        errorMessage = 'Duplicate entry detected. This application may already exist.';
      } else {
        errorMessage = 'Application submission failed due to invalid data format.';
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