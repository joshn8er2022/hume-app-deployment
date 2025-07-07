import api from './api';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

interface LeadData {
  [key: string]: unknown;
}

// Description: Record a page view
// Endpoint: POST /api/analytics/page-views
// Request: { landingPageId: string, landingPageName: string, landingPageUrl: string, referrer?: string, sessionId?: string }
// Response: { success: boolean, message: string, data: object }
export const recordPageView = async (data: {
  landingPageId: string;
  landingPageName: string;
  landingPageUrl: string;
  referrer?: string;
  sessionId?: string;
}) => {
  try {
    return await api.post('/api/analytics/page-views', data);
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError?.response?.data?.message || apiError?.message || 'An error occurred');
  }
};

// Description: Record a conversion
// Endpoint: POST /api/analytics/conversions
// Request: { landingPageId: string, landingPageName: string, landingPageUrl: string, leadType: string, leadData: object, sessionId?: string }
// Response: { success: boolean, message: string, data: object }
export const recordConversion = async (data: {
  landingPageId: string;
  landingPageName: string;
  landingPageUrl: string;
  leadType: string;
  leadData: LeadData;
  sessionId?: string;
}) => {
  try {
    return await api.post('/api/analytics/conversions', data);
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError?.response?.data?.message || apiError?.message || 'An error occurred');
  }
};

// Description: Get analytics for a specific landing page
// Endpoint: GET /api/analytics/landing-pages/:landingPageId
// Request: { timeRange?: string }
// Response: { success: boolean, data: object }
export const getLandingPageAnalytics = async (landingPageId: string, timeRange: string = '30d') => {
  try {
    return await api.get(`/api/analytics/landing-pages/${landingPageId}?timeRange=${timeRange}`);
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError?.response?.data?.message || apiError?.message || 'An error occurred');
  }
};

// Description: Get analytics data
// Endpoint: GET /api/analytics
// Request: { timeRange: string }
// Response: { success: boolean, data: { conversionFunnel: Array, revenueData: Array, leadSources: Array, performanceMetrics: Object } }
export const getAnalyticsData = async (timeRange: string) => {
  try {
    const response = await api.get(`/api/analytics?timeRange=${timeRange}`);
    return response.data.data;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError?.response?.data?.message || apiError?.message || 'An error occurred');
  }
};

// Description: Get active users statistics
// Endpoint: GET /api/analytics/active-users
// Request: { timeRange?: string }
// Response: { success: boolean, data: { daily: object, weekly: object, monthly: object, trendData: Array } }
export const getActiveUsersStats = async (timeRange: string = '30d') => {
  try {
    const response = await api.get(`/api/analytics/active-users?timeRange=${timeRange}`);
    return response.data.data;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError?.response?.data?.message || apiError?.message || 'An error occurred');
  }
};

// Description: Get user acquisition funnel
// Endpoint: GET /api/analytics/funnel
// Request: { timeRange?: string }
// Response: { success: boolean, data: { timeRange: string, period: string, steps: Array, overallConversionRate: number } }
export const getUserAcquisitionFunnel = async (timeRange: string = '30d') => {
  try {
    const response = await api.get(`/api/analytics/funnel?timeRange=${timeRange}`);
    return response.data.data;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError?.response?.data?.message || apiError?.message || 'An error occurred');
  }
};

// Description: Get app performance metrics
// Endpoint: GET /api/analytics/performance
// Request: {}
// Response: { success: boolean, data: { requests: object, performance: object, resources: object, uptime: object, users: object, timestamp: string } }
export const getAppPerformanceMetrics = async () => {
  try {
    const response = await api.get('/api/analytics/performance');
    return response.data.data;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError?.response?.data?.message || apiError?.message || 'An error occurred');
  }
};
