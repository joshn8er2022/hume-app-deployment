const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/auth');
const auth = require('./middleware/auth');

console.log('=== AUTH ROUTES: Starting to load ===');

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', async (req, res) => {
  try {
    console.log('=== AUTH ROUTE: POST /api/auth/register ===');
    console.log('Registration attempt for:', req.body.email);

    const { firstName, lastName, email, password, role = 'user', companyName } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      companyName
    });

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user);

    console.log('User registered successfully:', user.email);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        companyName: user.companyName
      }
    });

  } catch (error) {
    console.error('=== AUTH ROUTE ERROR: Register ===');
    console.error('Error details:', error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to register user. Please try again.'
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    console.log('=== AUTH ROUTE: POST /api/auth/login ===');
    console.log('Login attempt for:', req.body.email);

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    console.log('User logged in successfully:', user.email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        companyName: user.companyName
      }
    });

  } catch (error) {
    console.error('=== AUTH ROUTE ERROR: Login ===');
    console.error('Error details:', error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to login. Please try again.'
    });
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', async (req, res) => {
  try {
    console.log('=== AUTH ROUTE: POST /api/auth/refresh ===');

    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    console.log('Token refreshed successfully for user:', user.email);

    res.status(200).json({
      success: true,
      accessToken
    });

  } catch (error) {
    console.error('=== AUTH ROUTE ERROR: Refresh ===');
    console.error('Error details:', error.message);

    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', auth, async (req, res) => {
  try {
    console.log('=== AUTH ROUTE: POST /api/auth/logout ===');
    console.log('Logout for user:', req.user.email);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('=== AUTH ROUTE ERROR: Logout ===');
    console.error('Error details:', error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to logout. Please try again.'
    });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Private
 */
router.get('/me', auth, async (req, res) => {
  try {
    console.log('=== AUTH ROUTE: GET /api/auth/me ===');
    console.log('Getting user info for:', req.user.email);

    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role,
        companyName: req.user.companyName,
        subscriptionStatus: req.user.subscriptionStatus
      }
    });

  } catch (error) {
    console.error('=== AUTH ROUTE ERROR: Get user ===');
    console.error('Error details:', error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to get user information. Please try again.'
    });
  }
});

console.log('=== AUTH ROUTES LOADED SUCCESSFULLY ===');

module.exports = router;