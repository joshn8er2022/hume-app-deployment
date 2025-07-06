const express = require('express');
const router = express.Router();

console.log('=== APPLICATION ROUTES: Starting to load ===');

let applicationService;
let auth;

try {
  console.log('=== APPLICATION ROUTES: Loading applicationService ===');
  applicationService = require('../services/applicationService');
  console.log('=== APPLICATION ROUTES: applicationService loaded successfully ===');
  console.log('applicationService type:', typeof applicationService);
  console.log('applicationService methods:', Object.getOwnPropertyNames(applicationService));
} catch (error) {
  console.error('=== APPLICATION ROUTES: ERROR loading applicationService ===');
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

/**
 * @route POST /api/clinic-applications
 * @desc Submit a new clinic application
 * @access Public
 */
router.post('/', async (req, res) => {
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
    
    // Validate required fields
    const {
      firstName,
      lastName,
      email,
      phone
    } = personalInfo;

    const {
      companyName,
      businessType
    } = businessInfo;

    const {
      currentChallenges: mainChallenges,
      primaryGoals: goals,
      timeline
    } = requirements;

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

    if (!firstName || !lastName || !email || !phone || !companyName || !businessType || !mainChallenges || !goals || !timeline) {
      console.log('Missing required fields in application submission');
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
    console.error('=== APPLICATION ROUTE ERROR: POST /api/clinic-applications ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error);

    if (error.message && error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
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
      error: 'Failed to submit application. Please try again.'
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
router.put('/:applicationId', auth, async (req, res) => {
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