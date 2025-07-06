const express = require('express');
const router = express.Router();
const auth = require('./middleware/auth');

console.log('=== USER ROUTES: Starting to load ===');

let userService;

try {
  console.log('=== USER ROUTES: Loading userService ===');
  userService = require('../services/userService');
  console.log('=== USER ROUTES: userService loaded successfully ===');
  console.log('userService type:', typeof userService);
  console.log('userService methods:', Object.getOwnPropertyNames(userService));
} catch (error) {
  console.error('=== USER ROUTES: ERROR loading userService ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}

/**
 * @route GET /api/users/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', auth, async (req, res) => {
  try {
    console.log('=== USER ROUTE: GET /api/users/me ===');
    console.log('Getting profile for user:', req.user.email);

    const user = await userService.get(req.user._id);

    if (!user) {
      console.log('User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User profile retrieved successfully');

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        subscriptionStatus: user.subscriptionStatus,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('=== USER ROUTE ERROR: GET /api/users/me ===');
    console.error('Error details:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to get user profile. Please try again.'
    });
  }
});

/**
 * @route PUT /api/users/me
 * @desc Update current user profile
 * @access Private
 */
router.put('/me', auth, async (req, res) => {
  try {
    console.log('=== USER ROUTE: PUT /api/users/me ===');
    console.log('Updating profile for user:', req.user.email);
    console.log('Update data:', req.body);

    const updatedUser = await userService.update(req.user._id, req.body);

    if (!updatedUser) {
      console.log('User not found for update');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User profile updated successfully');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: updatedUser._id,
        email: updatedUser.email,
        role: updatedUser.role,
        companyName: updatedUser.companyName,
        subscriptionStatus: updatedUser.subscriptionStatus,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        createdAt: updatedUser.createdAt,
        lastLoginAt: updatedUser.lastLoginAt,
        isActive: updatedUser.isActive
      }
    });

  } catch (error) {
    console.error('=== USER ROUTE ERROR: PUT /api/users/me ===');
    console.error('Error details:', error.message);

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: `Validation error: ${validationErrors.join(', ')}`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update user profile. Please try again.'
    });
  }
});

/**
 * @route GET /api/users/profile
 * @desc Get current user profile (deprecated - use /me instead)
 * @access Private
 */
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('=== USER ROUTE: GET /api/users/profile (DEPRECATED) ===');
    console.log('Getting profile for user:', req.user.email);

    const user = await userService.get(req.user._id);

    console.log('User profile retrieved successfully');

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        subscriptionStatus: user.subscriptionStatus
      }
    });

  } catch (error) {
    console.error('=== USER ROUTE ERROR: GET /api/users/profile ===');
    console.error('Error details:', error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to get user profile. Please try again.'
    });
  }
});

/**
 * @route PUT /api/users/profile
 * @desc Update current user profile (deprecated - use /me instead)
 * @access Private
 */
router.put('/profile', auth, async (req, res) => {
  try {
    console.log('=== USER ROUTE: PUT /api/users/profile (DEPRECATED) ===');
    console.log('Updating profile for user:', req.user.email);
    console.log('Update data:', req.body);

    const updatedUser = await userService.update(req.user._id, req.body);

    console.log('User profile updated successfully');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        companyName: updatedUser.companyName,
        subscriptionStatus: updatedUser.subscriptionStatus
      }
    });

  } catch (error) {
    console.error('=== USER ROUTE ERROR: PUT /api/users/profile ===');
    console.error('Error details:', error.message);

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
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
      error: 'Failed to update user profile. Please try again.'
    });
  }
});

console.log('=== USER ROUTES LOADED SUCCESSFULLY ===');

module.exports = router;