const express = require('express');
const router = express.Router();
const AnalyticsService = require('../services/analyticsService');
const Application = require('../models/Application');
const FormConfiguration = require('../models/FormConfiguration');

// Middleware for admin authentication (placeholder - implement based on your auth system)
const requireAdmin = (req, res, next) => {
  // TODO: Implement proper admin authentication
  // For now, we'll skip authentication in development
  if (process.env.NODE_ENV !== 'production') {
    req.user = { _id: 'admin-user-id', role: 'admin' };
    return next();
  }
  
  // In production, implement proper authentication
  res.status(401).json({
    success: false,
    error: 'Admin authentication required'
  });
};

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

// ========== APPLICATION ANALYTICS ENDPOINTS ==========

/**
 * @route GET /api/analytics/dashboard/comprehensive
 * @desc Get comprehensive dashboard analytics for applications
 * @access Admin
 */
router.get('/dashboard/comprehensive', requireAdmin, async (req, res) => {
  try {
    console.log('=== GET COMPREHENSIVE DASHBOARD ANALYTICS ===');
    
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    // Run analytics queries in parallel
    const [
      totalApplications,
      recentApplications,
      statusBreakdown,
      submissionTrends,
      qualityMetrics,
      topBusinessTypes
    ] = await Promise.all([
      // Total applications count
      Application.countDocuments({ createdAt: { $gte: startDate } }),
      
      // Recent applications (last 24 hours)
      Application.countDocuments({ 
        createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } 
      }),
      
      // Status breakdown
      Application.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Submission trends over time
      Application.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      
      // Quality metrics
      Application.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalApplications: { $sum: 1 }
          }
        }
      ]),
      
      // Top business types
      Application.aggregate([
        { $match: { createdAt: { $gte: startDate }, businessType: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$businessType',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);
    
    // Calculate percentages for status breakdown
    const totalForPercentage = statusBreakdown.reduce((sum, item) => sum + item.count, 0);
    statusBreakdown.forEach(item => {
      item.percentage = totalForPercentage > 0 ? Math.round((item.count / totalForPercentage) * 100) : 0;
    });
    
    console.log(`Comprehensive dashboard analytics generated for ${timeframe} timeframe`);
    
    res.status(200).json({
      success: true,
      data: {
        timeframe,
        dateRange: {
          start: startDate,
          end: now
        },
        overview: {
          totalApplications,
          recentApplications
        },
        statusBreakdown,
        submissionTrends,
        qualityMetrics: qualityMetrics[0] || {},
        topBusinessTypes
      }
    });
    
  } catch (error) {
    console.error('=== GET COMPREHENSIVE DASHBOARD ANALYTICS ERROR ===');
    console.error('Error details:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate comprehensive dashboard analytics'
    });
  }
});

/**
 * @route GET /api/analytics/applications/detailed
 * @desc Get detailed application analytics with filtering and search
 * @access Admin
 */
router.get('/applications/detailed', requireAdmin, async (req, res) => {
  try {
    console.log('=== GET DETAILED APPLICATION ANALYTICS ===');
    console.log('Query params:', req.query);
    
    const {
      page = 1,
      limit = 20,
      status,
      applicationType,
      businessType,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (applicationType) filter.applicationType = applicationType;
    if (businessType) filter.businessType = businessType;
    
    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Get applications with analytics data
    const [applications, totalCount] = await Promise.all([
      Application.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-responseData -submissionMetadata'), // Exclude large fields for list view
      Application.countDocuments(filter)
    ]);
    
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    console.log(`Retrieved ${applications.length} applications for detailed analytics (${totalCount} total)`);
    
    res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        },
        filters: {
          status,
          applicationType,
          businessType,
          dateFrom,
          dateTo,
          search
        }
      }
    });
    
  } catch (error) {
    console.error('=== GET DETAILED APPLICATION ANALYTICS ERROR ===');
    console.error('Error details:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve detailed application analytics'
    });
  }
});

/**
 * @route GET /api/analytics/export/applications
 * @desc Export application data in various formats
 * @access Admin
 */
router.get('/export/applications', requireAdmin, async (req, res) => {
  try {
    console.log('=== EXPORT APPLICATION DATA ===');
    console.log('Export params:', req.query);
    
    const {
      format = 'json',
      status,
      applicationType,
      dateFrom,
      dateTo,
      includeFields = 'all'
    } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (applicationType) filter.applicationType = applicationType;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    
    // Determine fields to include
    let selectFields = '';
    if (includeFields === 'basic') {
      selectFields = 'email firstName lastName companyName businessType status createdAt';
    } else if (includeFields === 'analytics') {
      selectFields = 'email status createdAt';
    }
    // 'all' means no select filter
    
    const applications = await Application.find(filter)
      .select(selectFields)
      .sort({ createdAt: -1 })
      .limit(10000); // Limit for performance
    
    console.log(`Exporting ${applications.length} applications in ${format} format`);
    
    // Format data based on requested format
    let exportData;
    let contentType;
    let filename;
    
    switch (format.toLowerCase()) {
      case 'csv':
        exportData = convertToCSV(applications);
        contentType = 'text/csv';
        filename = `applications-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'json':
      default:
        exportData = JSON.stringify({
          exportedAt: new Date(),
          totalRecords: applications.length,
          filters: { status, applicationType, dateFrom, dateTo },
          data: applications
        }, null, 2);
        contentType = 'application/json';
        filename = `applications-export-${new Date().toISOString().split('T')[0]}.json`;
        break;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(exportData);
    
  } catch (error) {
    console.error('=== EXPORT APPLICATION DATA ERROR ===');
    console.error('Error details:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to export application data'
    });
  }
});

/**
 * Helper function to convert applications to CSV format
 */
function convertToCSV(applications) {
  if (applications.length === 0) return '';
  
  // Define headers
  const headers = [
    'ID', 'Email', 'First Name', 'Last Name', 'Company Name', 'Business Type',
    'Status', 'Application Type', 'Created At'
  ];
  
  // Convert data to CSV rows
  const rows = applications.map(app => [
    app._id.toString(),
    app.email || '',
    app.firstName || '',
    app.lastName || '',
    app.companyName || '',
    app.businessType || '',
    app.status || '',
    app.applicationType || '',
    app.createdAt?.toISOString() || ''
  ]);
  
  // Escape CSV values
  const escapeCSV = (value) => {
    if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  
  // Build CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');
  
  return csvContent;
}

module.exports = router;