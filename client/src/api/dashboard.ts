import api from './api';

// Description: Get dashboard statistics
// Endpoint: GET /api/dashboard/stats
// Request: {}
// Response: { success: boolean, data: { totalLeads: number, qualifiedLeads: number, conversionRate: number, revenue: number, activeDeals: number, scheduledCalls: number, responseRate: number, avgDealSize: number } }
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/api/dashboard/stats');
    
    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      console.error('Dashboard stats API response indicates failure:', response.data);
      throw new Error('API response indicates failure');
    }
  } catch (error: any) {
    console.error('Dashboard stats API error:', error);
    
    // Handle specific error cases
    if (error?.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    
    if (error?.response?.status === 404) {
      throw new Error('Dashboard stats endpoint not found. Please check server configuration.');
    }
    
    if (error?.response?.status === 500) {
      throw new Error('Server error while fetching dashboard stats. Please try again later.');
    }
    
    throw new Error(error?.response?.data?.message || error?.message || 'Failed to load dashboard statistics');
  }
};

// Description: Get recent activity
// Endpoint: GET /api/dashboard/activity
// Request: {}
// Response: { success: boolean, data: Array<{ id: string, type: string, description: string, timestamp: string, status: string }> }
export const getRecentActivity = async () => {
  try {
    const response = await api.get('/api/dashboard/activity');
    
    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      console.error('Recent activity API response indicates failure:', response.data);
      throw new Error('API response indicates failure');
    }
  } catch (error: any) {
    console.error('Recent activity API error:', error);
    
    // Handle specific error cases
    if (error?.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    
    if (error?.response?.status === 404) {
      throw new Error('Recent activity endpoint not found. Please check server configuration.');
    }
    
    if (error?.response?.status === 500) {
      throw new Error('Server error while fetching recent activity. Please try again later.');
    }
    
    throw new Error(error?.response?.data?.message || error?.message || 'Failed to load recent activity');
  }
};