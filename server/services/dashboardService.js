const User = require('../models/User');
const Lead = require('../models/Lead');
const PageView = require('../models/PageView');
const Conversion = require('../models/Conversion');
const Communication = require('../models/Communication');

class DashboardService {
  // Get dashboard statistics
  static async getDashboardStats() {
    try {
      console.log('=== DASHBOARD SERVICE: Getting Dashboard Stats ===');

      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get lead statistics
      const totalLeads = await Lead.countDocuments();
      const qualifiedLeads = await Lead.countDocuments({
        status: { $in: ['qualified', 'proposal', 'closed-won'] }
      });

      // Get conversion rate from page views to conversions
      const totalPageViews = await PageView.countDocuments({
        timestamp: { $gte: oneMonthAgo }
      });
      const totalConversions = await Conversion.countDocuments({
        timestamp: { $gte: oneMonthAgo }
      });
      const conversionRate = totalPageViews > 0 ? 
        parseFloat(((totalConversions / totalPageViews) * 100).toFixed(1)) : 0;

      // Mock revenue calculation (in a real app, this would come from a Revenue/Order model)
      const revenue = Math.floor(totalLeads * 2500 + Math.random() * 50000);

      // Get active deals (leads in proposal stage)
      const activeDeals = await Lead.countDocuments({
        status: { $in: ['qualified', 'proposal'] }
      });

      // Mock scheduled calls (in a real app, this would come from a Calendar/Appointment model)
      const scheduledCalls = Math.floor(activeDeals * 0.6);

      // Calculate response rate from communications
      const totalCommunications = await Communication.countDocuments({
        createdAt: { $gte: oneMonthAgo }
      });
      const respondedCommunications = await Communication.countDocuments({
        createdAt: { $gte: oneMonthAgo },
        status: 'delivered'
      });
      const responseRate = totalCommunications > 0 ? 
        parseFloat(((respondedCommunications / totalCommunications) * 100).toFixed(1)) : 0;

      // Calculate average deal size
      const avgDealSize = revenue > 0 && qualifiedLeads > 0 ? 
        Math.floor(revenue / qualifiedLeads) : 0;

      const stats = {
        totalLeads,
        qualifiedLeads,
        conversionRate,
        revenue,
        activeDeals,
        scheduledCalls,
        responseRate,
        avgDealSize
      };

      console.log('Dashboard stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('=== DASHBOARD SERVICE ERROR: Getting Dashboard Stats ===');
      console.error('Error:', error.message);
      throw error;
    }
  }

  // Get recent activity
  static async getRecentActivity() {
    try {
      console.log('=== DASHBOARD SERVICE: Getting Recent Activity ===');

      const activities = [];

      // Get recent leads
      const recentLeads = await Lead.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('assignedTo', 'firstName lastName');

      recentLeads.forEach(lead => {
        activities.push({
          id: lead._id.toString(),
          type: 'lead',
          description: `New lead from ${lead.companyName || lead.firstName + ' ' + lead.lastName} submitted application`,
          timestamp: this.getRelativeTime(lead.createdAt),
          status: 'success'
        });
      });

      // Get recent communications
      const recentCommunications = await Communication.find()
        .sort({ createdAt: -1 })
        .limit(2);

      recentCommunications.forEach(comm => {
        activities.push({
          id: comm._id.toString(),
          type: 'message',
          description: `${comm.type === 'email' ? 'Email' : 'Message'} sent to ${comm.recipient}`,
          timestamp: this.getRelativeTime(comm.createdAt),
          status: 'info'
        });
      });

      // Get recent conversions
      const recentConversions = await Conversion.find()
        .sort({ timestamp: -1 })
        .limit(2);

      recentConversions.forEach(conversion => {
        activities.push({
          id: conversion._id.toString(),
          type: 'deal',
          description: `New ${conversion.leadType} conversion from ${conversion.landingPageName}`,
          timestamp: this.getRelativeTime(conversion.timestamp),
          status: 'warning'
        });
      });

      // Sort all activities by timestamp (most recent first)
      activities.sort((a, b) => {
        const timeA = this.parseRelativeTime(a.timestamp);
        const timeB = this.parseRelativeTime(b.timestamp);
        return timeA - timeB;
      });

      console.log('Recent activity retrieved:', activities.length, 'items');
      return activities.slice(0, 5); // Return top 5 most recent
    } catch (error) {
      console.error('=== DASHBOARD SERVICE ERROR: Getting Recent Activity ===');
      console.error('Error:', error.message);
      throw error;
    }
  }

  // Helper method to get relative time
  static getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Less than 1 hour ago';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    }
  }

  // Helper method to parse relative time for sorting
  static parseRelativeTime(timeString) {
    if (timeString.includes('hour')) {
      const hours = parseInt(timeString.match(/\d+/)[0]);
      return hours;
    } else if (timeString.includes('day')) {
      const days = parseInt(timeString.match(/\d+/)[0]);
      return days * 24;
    } else if (timeString.includes('week')) {
      const weeks = parseInt(timeString.match(/\d+/)[0]);
      return weeks * 24 * 7;
    }
    return 0;
  }
}

module.exports = DashboardService;