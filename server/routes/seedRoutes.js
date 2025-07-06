const express = require('express');
const router = express.Router();
const { createAdminUser, createTestData } = require('../services/seedService');

/**
 * POST /api/seed/admin
 * Create initial admin user
 */
router.post('/admin', async (req, res) => {
  try {
    console.log('=== SEED ADMIN ENDPOINT CALLED ===');
    console.log('Request received at /api/seed/admin');
    
    const result = await createAdminUser();
    
    console.log('=== SEED ADMIN ENDPOINT SUCCESS ===');
    console.log('Sending response:', {
      success: true,
      message: result.message,
      data: {
        email: result.user.email,
        role: result.user.role,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      }
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        email: result.user.email,
        role: result.user.role,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      }
    });
  } catch (error) {
    console.error('=== SEED ADMIN ENDPOINT ERROR ===');
    console.error('Error seeding admin user:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/seed/test-data
 * Create sample test data
 */
router.post('/test-data', async (req, res) => {
  try {
    console.log('=== SEED TEST DATA ENDPOINT CALLED ===');
    console.log('Request received at /api/seed/test-data');
    
    const result = await createTestData();
    
    console.log('=== SEED TEST DATA ENDPOINT SUCCESS ===');
    console.log('Sending response:', {
      success: true,
      message: result.message,
      data: result.data,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error('=== SEED TEST DATA ENDPOINT ERROR ===');
    console.error('Error seeding test data:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/seed/status
 * Check seeding status
 */
router.get('/status', async (req, res) => {
  try {
    console.log('=== SEED STATUS ENDPOINT CALLED ===');
    console.log('Request received at /api/seed/status');
    
    const User = require('../models/User');
    const Lead = require('../models/Lead');
    const Application = require('../models/Application');
    const Communication = require('../models/Communication');

    console.log('Checking admin user existence...');
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    console.log('Admin exists:', !!adminExists);
    
    console.log('Counting documents...');
    const userCount = await User.countDocuments();
    const leadCount = await Lead.countDocuments();
    const applicationCount = await Application.countDocuments();
    const communicationCount = await Communication.countDocuments();
    
    console.log('Document counts:', {
      users: userCount,
      leads: leadCount,
      applications: applicationCount,
      communications: communicationCount,
    });

    const responseData = {
      success: true,
      data: {
        adminUserExists: !!adminExists,
        counts: {
          users: userCount,
          leads: leadCount,
          applications: applicationCount,
          communications: communicationCount,
        }
      }
    };
    
    console.log('=== SEED STATUS ENDPOINT SUCCESS ===');
    console.log('Sending response:', responseData);

    res.status(200).json(responseData);
  } catch (error) {
    console.error('=== SEED STATUS ENDPOINT ERROR ===');
    console.error('Error checking seed status:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;