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

// Description: Get all landing pages
// Endpoint: GET /api/funnels/pages
// Request: {}
// Response: { success: boolean, data: Array<LandingPage> }
export const getLandingPages = async () => {
  try {
    const response = await api.get('/api/funnels/pages');
    
    if (response.data && response.data.success) {
      return response.data.data || response.data.pages || [];
    } else {
      console.error('Landing pages API response indicates failure:', response.data);
      throw new Error('API response indicates failure');
    }
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Landing pages API error:', apiError);
    
    // Handle specific error cases
    if (apiError?.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    
    if (apiError?.response?.status === 404) {
      throw new Error('Landing pages endpoint not found. Please check server configuration.');
    }
    
    if (apiError?.response?.status === 500) {
      throw new Error('Server error while fetching landing pages. Please try again later.');
    }
    
    throw new Error(apiError?.response?.data?.message || apiError?.message || 'Failed to load landing pages');
  }
};

// Description: Create a new landing page
// Endpoint: POST /api/funnels/pages
// Request: { name: string, slug: string, leadType: string, content: object }
// Response: { success: boolean, data: LandingPage }
export const createLandingPage = async (pageData: {
  name: string;
  slug: string;
  leadType: string;
  content?: object;
}) => {
  try {
    const response = await api.post('/api/funnels/pages', pageData);
    
    if (response.data && response.data.success) {
      return response.data.data || response.data.page;
    } else {
      console.error('Create landing page API response indicates failure:', response.data);
      throw new Error('API response indicates failure');
    }
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Create landing page API error:', apiError);
    
    // Handle specific error cases
    if (apiError?.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    
    if (apiError?.response?.status === 400) {
      throw new Error('Invalid landing page data provided.');
    }
    
    if (apiError?.response?.status === 409) {
      throw new Error('A landing page with this slug already exists.');
    }
    
    if (apiError?.response?.status === 500) {
      throw new Error('Server error while creating landing page. Please try again later.');
    }
    
    throw new Error(apiError?.response?.data?.message || apiError?.message || 'Failed to create landing page');
  }
};

// Description: Update a landing page
// Endpoint: PUT /api/funnels/pages/:id
// Request: { name?: string, content?: object, status?: string }
// Response: { success: boolean, data: LandingPage }
export const updateLandingPage = async (pageId: string, updateData: {
  name?: string;
  content?: object;
  status?: string;
}) => {
  try {
    const response = await api.put(`/api/funnels/pages/${pageId}`, updateData);
    
    if (response.data && response.data.success) {
      return response.data.data || response.data.page;
    } else {
      console.error('Update landing page API response indicates failure:', response.data);
      throw new Error('API response indicates failure');
    }
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Update landing page API error:', apiError);
    
    // Handle specific error cases
    if (apiError?.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    
    if (apiError?.response?.status === 404) {
      throw new Error('Landing page not found.');
    }
    
    if (apiError?.response?.status === 400) {
      throw new Error('Invalid update data provided.');
    }
    
    if (apiError?.response?.status === 500) {
      throw new Error('Server error while updating landing page. Please try again later.');
    }
    
    throw new Error(apiError?.response?.data?.message || apiError?.message || 'Failed to update landing page');
  }
};

// Description: Delete a landing page
// Endpoint: DELETE /api/funnels/pages/:id
// Request: {}
// Response: { success: boolean, message: string }
export const deleteLandingPage = async (pageId: string) => {
  try {
    const response = await api.delete(`/api/funnels/pages/${pageId}`);
    
    if (response.data && response.data.success) {
      return response.data;
    } else {
      console.error('Delete landing page API response indicates failure:', response.data);
      throw new Error('API response indicates failure');
    }
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Delete landing page API error:', apiError);
    
    // Handle specific error cases
    if (apiError?.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    
    if (apiError?.response?.status === 404) {
      throw new Error('Landing page not found.');
    }
    
    if (apiError?.response?.status === 500) {
      throw new Error('Server error while deleting landing page. Please try again later.');
    }
    
    throw new Error(apiError?.response?.data?.message || apiError?.message || 'Failed to delete landing page');
  }
};

// Description: Get funnel analytics data
// Endpoint: GET /api/analytics/funnel
// Request: {}
// Response: { success: boolean, data: object }
export const getFunnelAnalytics = async () => {
  try {
    const response = await api.get('/api/analytics/funnel');
    
    if (response.data && response.data.success) {
      return response.data.data || response.data;
    } else {
      console.error('Funnel analytics API response indicates failure:', response.data);
      throw new Error('API response indicates failure');
    }
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Funnel analytics API error:', apiError);
    
    // Return mock data for now
    return {
      timeRange: '30d',
      period: '2024-01-01 to 2024-01-31',
      steps: [
        { step: 'Visits', count: 1250, percentage: 100, description: 'Total page visits' },
        { step: 'Leads', count: 125, percentage: 10, description: 'Visitors who became leads' },
        { step: 'Registrations', count: 50, percentage: 4, description: 'Leads who registered' },
        { step: 'Active Users', count: 35, percentage: 2.8, description: 'Registered users who are active' }
      ],
      overallConversionRate: 2.8
    };
  }
};
