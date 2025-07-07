import api from './api';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
  code?: string;
}

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
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Dashboard stats API error:', apiError);
    
    // Handle specific error cases
    if (apiError?.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    
    if (apiError?.response?.status === 404) {
      throw new Error('Dashboard stats endpoint not found. Please check server configuration.');
    }
    
    if (apiError?.response?.status === 500) {
      throw new Error('Server error while fetching dashboard stats. Please try again later.');
    }
    
    throw new Error(apiError?.response?.data?.message || apiError?.message || 'Failed to load dashboard statistics');
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
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Recent activity API error:', apiError);
    
    // Handle specific error cases
    if (apiError?.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    
    if (apiError?.response?.status === 404) {
      throw new Error('Recent activity endpoint not found. Please check server configuration.');
    }
    
    if (apiError?.response?.status === 500) {
      throw new Error('Server error while fetching recent activity. Please try again later.');
    }
    
    throw new Error(apiError?.response?.data?.message || apiError?.message || 'Failed to load recent activity');
  }
};
