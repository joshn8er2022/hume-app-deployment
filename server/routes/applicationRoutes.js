const express = require('express');
const router = express.Router();

console.log('=== APPLICATION ROUTES: Starting to load ===');

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
  console.log('=== APPLICATION ROUTES: Loading validation middleware ===');
  validateApplication = require('../middleware/validateApplication');
  console.log('=== APPLICATION ROUTES: validation middleware loaded successfully ===');
  console.log('Validation middleware type:', typeof validateApplication);
} catch (error) {
  console.error('=== APPLICATION ROUTES: ERROR loading validation middleware ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  // Don't throw error - make validation optional for now
  console.log('=== VALIDATION MIDDLEWARE DISABLED - CONTINUING WITHOUT VALIDATION ===');
  validateApplication = {
    validateApplicationData: (req, res, next) => next(),
    validateApplicationUpdate: (req, res, next) => next()
  };
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

router.post('/', async (req, res) => {
  // Define variables at function scope for error logging
  let firstName, lastName, email, phone, companyName, businessType, yearsInBusiness, mainChallenges, goals, timeline;
  
  try {
    console.log('=== APPLICATION ROUTE: POST /api/clinic-applications ===');
    console.log('Request received at:', new Date().toISOString());
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Application type:', req.body.applicationType);
    console.log('Email:', req.body.email);

    // Extract data from nested structure
    const { personalInfo = {}, businessInfo = {}, requirements = {}, applicationType = 'clinical' } = req.body;
    
    // Validate required fields - assign to function-scoped variables
    ({
      firstName,
      lastName,
      email,
      phone
    } = personalInfo);

    ({
      companyName,
      businessType,
      yearsInBusiness = '2-5' // Default if not provided
    } = businessInfo);

    ({
      currentChallenges: mainChallenges,
      primaryGoals,
      timeline
    } = requirements);

    // Convert primaryGoals array to goals string
    goals = Array.isArray(primaryGoals) ? primaryGoals.join(', ') : primaryGoals || '';

    console.log('=== VALIDATION CHECK ===');
    console.log('firstName:', firstName);
    console.log('lastName:', lastName);
    console.log('email:', email);
    console.log('phone:', phone);
    console.log('companyName:', companyName);
    console.log('businessType:', businessType);
    console.log('mainChallenges:', mainChallenges);
    console.log('goals:', goals);
    console.log('timeline:', timeline);

    if (!firstName || !lastName || !email || !phone || !companyName || !businessType || !mainChallenges || !goals || !timeline || !yearsInBusiness) {
      console.log('Missing required fields in application submission');
      console.log('Missing field details:', { firstName: !!firstName, lastName: !!lastName, email: !!email, phone: !!phone, companyName: !!companyName, businessType: !!businessType, mainChallenges: !!mainChallenges, goals: !!goals, timeline: !!timeline, yearsInBusiness: !!yearsInBusiness });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields. Please fill in all required information.'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.'
      });
    }

    console.log('=== CALLING APPLICATION SERVICE ===');
    console.log('About to call applicationService.createApplication');
    console.log('applicationService exists:', !!applicationService);
    console.log('createApplication method exists:', !!applicationService.createApplication);

    // Create application with flattened data
    const applicationData = {
      applicationType,
      firstName,
      lastName,
      email,
      phone,
      companyName,
      businessType,
      yearsInBusiness,
      mainChallenges,
      goals,
      timeline,
      // Include additional fields from nested structure
      ...businessInfo,
      ...requirements,
      personalInfo,
      businessInfo,
      requirements
    };

    // Create application
    const application = await applicationService.createApplication(applicationData);

    // Track successful submission
    if (metricsTracker && metricsTracker.incrementApplicationSubmission) {
      metricsTracker.incrementApplicationSubmission();
    }

    console.log('=== APPLICATION CREATED SUCCESSFULLY ===');
    console.log('Application created successfully with ID:', application._id);
    console.log('Application status:', application.status);
    console.log('Application createdAt:', application.createdAt);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: application._id,
        status: application.status,
        submittedAt: application.createdAt
      }
    });

  } catch (error) {
    // Track error
    if (metricsTracker && metricsTracker.incrementApplicationError) {
      metricsTracker.incrementApplicationError();
    }

    console.error('=== APPLICATION ROUTE ERROR: POST /api/applications ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body received:', JSON.stringify(req.body, null, 2));
    console.error('Processed application data:', JSON.stringify({ firstName, lastName, email, phone, companyName, businessType, yearsInBusiness, mainChallenges, goals, timeline }, null, 2));
    
    // Specific error types with structured responses
    if (error.message && error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message,
        errorType: 'DUPLICATE_APPLICATION',
        details: { email, applicationType }
      });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: `Validation error: ${validationErrors.join(', ')}`,
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
    
    // Generic server error with development details
    res.status(500).json({
      success: false,
      error: 'Failed to submit application. Please try again.',
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