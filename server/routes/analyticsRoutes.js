const express = require('express');
const router = express.Router();
const AnalyticsService = require('../services/analyticsService');

// Record a page view
router.post('/page-views', async (req, res) => {
  try {
    console.log('=== POST /api/analytics/page-views ===');
    console.log('Request body:', req.body);

    const {
      landingPageId,
      landingPageName,
      landingPageUrl,
      referrer,
      sessionId
    } = req.body;

    // Validate required fields
    if (!landingPageId || !landingPageName || !landingPageUrl) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: landingPageId, landingPageName, landingPageUrl'
      });
    }

    // Extract additional data from request
    const pageViewData = {
      landingPageId,
      landingPageName,
      landingPageUrl,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
      referrer,
      sessionId
    };

    const pageView = await AnalyticsService.recordPageView(pageViewData);

    console.log('Page view recorded successfully');
    res.status(201).json({
      success: true,
      message: 'Page view recorded successfully',
      data: pageView
    });
  } catch (error) {
    console.error('=== ERROR: POST /api/analytics/page-views ===');
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Record a conversion
router.post('/conversions', async (req, res) => {
  try {
    console.log('=== POST /api/analytics/conversions ===');
    console.log('Request body:', req.body);

    const {
      landingPageId,
      landingPageName,
      landingPageUrl,
      leadType,
      leadData,
      sessionId
    } = req.body;

    // Validate required fields
    if (!landingPageId || !landingPageName || !landingPageUrl || !leadType) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: landingPageId, landingPageName, landingPageUrl, leadType'
      });
    }

    // Validate lead type
    if (!['clinical', 'affiliate', 'wholesale'].includes(leadType)) {
      console.log('Invalid lead type:', leadType);
      return res.status(400).json({
        success: false,
        message: 'Invalid lead type. Must be one of: clinical, affiliate, wholesale'
      });
    }

    // Extract additional data from request
    const conversionData = {
      landingPageId,
      landingPageName,
      landingPageUrl,
      leadType,
      leadData,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
      sessionId
    };

    const conversion = await AnalyticsService.recordConversion(conversionData);

    console.log('Conversion recorded successfully');
    res.status(201).json({
      success: true,
      message: 'Conversion recorded successfully',
      data: conversion
    });
  } catch (error) {
    console.error('=== ERROR: POST /api/analytics/conversions ===');
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get analytics for a specific landing page
router.get('/landing-pages/:landingPageId', async (req, res) => {
  try {
    console.log('=== GET /api/analytics/landing-pages/:landingPageId ===');
    console.log('Landing page ID:', req.params.landingPageId);
    console.log('Query params:', req.query);

    const { landingPageId } = req.params;
    const { timeRange = '30d' } = req.query;

    const analytics = await AnalyticsService.getLandingPageAnalytics(landingPageId, timeRange);

    console.log('Analytics retrieved successfully');
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('=== ERROR: GET /api/analytics/landing-pages/:landingPageId ===');
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get overall analytics (for dashboard)
router.get('/', async (req, res) => {
  try {
    console.log('=== GET /api/analytics ===');
    console.log('Query params:', req.query);

    const { timeRange = '30d' } = req.query;

    const analytics = await AnalyticsService.getOverallAnalytics(timeRange);

    console.log('Overall analytics retrieved successfully');
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('=== ERROR: GET /api/analytics ===');
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get active users statistics
router.get('/active-users', async (req, res) => {
  try {
    console.log('=== GET /api/analytics/active-users ===');
    console.log('Query params:', req.query);

    const { timeRange = '30d' } = req.query;

    const stats = await AnalyticsService.getActiveUsersStats(timeRange);

    console.log('Active users stats retrieved successfully');
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('=== ERROR: GET /api/analytics/active-users ===');
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user acquisition funnel
router.get('/funnel', async (req, res) => {
  try {
    console.log('=== GET /api/analytics/funnel ===');
    console.log('Query params:', req.query);

    const { timeRange = '30d' } = req.query;

    const funnel = await AnalyticsService.getUserAcquisitionFunnel(timeRange);

    console.log('User acquisition funnel retrieved successfully');
    res.status(200).json({
      success: true,
      data: funnel
    });
  } catch (error) {
    console.error('=== ERROR: GET /api/analytics/funnel ===');
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get app performance metrics
router.get('/performance', async (req, res) => {
  try {
    console.log('=== GET /api/analytics/performance ===');

    const metrics = await AnalyticsService.getAppPerformanceMetrics();

    console.log('App performance metrics retrieved successfully');
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('=== ERROR: GET /api/analytics/performance ===');
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;