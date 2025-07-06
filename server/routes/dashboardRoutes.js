const express = require('express');
const router = express.Router();
const DashboardService = require('../services/dashboardService');
const auth = require('./middleware/auth');

// Get dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    console.log('=== DASHBOARD ROUTE: GET /api/dashboard/stats ===');
    console.log('User:', req.user);
    console.log('Request headers:', req.headers);

    console.log('=== DASHBOARD ROUTE: Calling DashboardService.getStats ===');
    const stats = await DashboardService.getDashboardStats();
    console.log('=== DASHBOARD ROUTE: DashboardService.getStats response ===', stats);
    console.log('=== DASHBOARD ROUTE: Stats data type:', typeof stats);
    console.log('=== DASHBOARD ROUTE: Stats data keys:', Object.keys(stats || {}));

    console.log('=== DASHBOARD ROUTE: Dashboard stats retrieved successfully ===');
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('=== DASHBOARD ROUTE ERROR: GET /api/dashboard/stats ===');
    console.error('=== DASHBOARD ROUTE ERROR: Error type:', typeof error);
    console.error('=== DASHBOARD ROUTE ERROR: Error message:', error?.message);
    console.error('=== DASHBOARD ROUTE ERROR: Error stack:', error?.stack);
    console.error('=== DASHBOARD ROUTE ERROR: Full error object:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to get dashboard stats'
    });
  }
});

// Get recent activity
router.get('/activity', auth, async (req, res) => {
  try {
    console.log('=== DASHBOARD ROUTE: GET /api/dashboard/activity ===');
    console.log('User:', req.user);
    console.log('Request headers:', req.headers);

    console.log('=== DASHBOARD ROUTE: Calling DashboardService.getRecentActivity ===');
    const activities = await DashboardService.getRecentActivity();
    console.log('=== DASHBOARD ROUTE: DashboardService.getRecentActivity response ===', activities);
    console.log('=== DASHBOARD ROUTE: Activities data type:', typeof activities);
    console.log('=== DASHBOARD ROUTE: Activities data length:', activities?.length);

    console.log('=== DASHBOARD ROUTE: Recent activity retrieved successfully ===');
    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('=== DASHBOARD ROUTE ERROR: GET /api/dashboard/activity ===');
    console.error('=== DASHBOARD ROUTE ERROR: Error type:', typeof error);
    console.error('=== DASHBOARD ROUTE ERROR: Error message:', error?.message);
    console.error('=== DASHBOARD ROUTE ERROR: Error stack:', error?.stack);
    console.error('=== DASHBOARD ROUTE ERROR: Full error object:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to get recent activity'
    });
  }
});

module.exports = router;