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

// Description: Get all contacts with detailed information
// Endpoint: GET /api/contacts
// Request: {}
// Response: { success: boolean, data: Array<Contact> }
export const getContacts = async () => {
  try {
    const response = await api.get('/api/contacts');
    
    if (response.data && response.data.success) {
      return response.data.data || response.data.contacts || [];
    } else {
      console.error('Contacts API response indicates failure:', response.data);
      throw new Error('API response indicates failure');
    }
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Contacts API error:', apiError);
    
    // Handle specific error cases
    if (apiError?.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    
    if (apiError?.response?.status === 404) {
      throw new Error('Contacts endpoint not found. Please check server configuration.');
    }
    
    if (apiError?.response?.status === 500) {
      throw new Error('Server error while fetching contacts. Please try again later.');
    }
    
    throw new Error(apiError?.response?.data?.message || apiError?.message || 'Failed to load contacts');
  }
};

// Description: Get contact details by ID
// Endpoint: GET /api/contacts/:id
// Request: { contactId: string }
// Response: { success: boolean, data: Contact }
export const getContactById = async (contactId: string) => {
  try {
    const response = await api.get(`/api/contacts/${contactId}`);
    
    if (response.data && response.data.success) {
      return response.data.data || response.data.contact;
    } else {
      console.error('Contact details API response indicates failure:', response.data);
      throw new Error('API response indicates failure');
    }
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Contact details API error:', apiError);
    
    // Handle specific error cases
    if (apiError?.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    
    if (apiError?.response?.status === 404) {
      throw new Error('Contact not found or endpoint not available.');
    }
    
    if (apiError?.response?.status === 500) {
      throw new Error('Server error while fetching contact details. Please try again later.');
    }
    
    throw new Error(apiError?.response?.data?.message || apiError?.message || 'Failed to load contact details');
  }
};

// Description: Update contact tags
// Endpoint: PUT /api/contacts/:id/tags
// Request: { tags: string[] }
// Response: { success: boolean, message: string }
export const updateContactTags = async (contactId: string, tags: string[]) => {
  try {
    const response = await api.put(`/api/contacts/${contactId}/tags`, { tags });
    
    if (response.data && response.data.success) {
      return response.data;
    } else {
      console.error('Update contact tags API response indicates failure:', response.data);
      throw new Error('API response indicates failure');
    }
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Update contact tags API error:', apiError);
    
    // Handle specific error cases
    if (apiError?.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    
    if (apiError?.response?.status === 404) {
      throw new Error('Contact not found or endpoint not available.');
    }
    
    if (apiError?.response?.status === 400) {
      throw new Error('Invalid tags data provided.');
    }
    
    if (apiError?.response?.status === 500) {
      throw new Error('Server error while updating contact tags. Please try again later.');
    }
    
    throw new Error(apiError?.response?.data?.message || apiError?.message || 'Failed to update contact tags');
  }
};

// Description: Get funnel analytics data
// Endpoint: GET /api/analytics/funnel
// Request: { timeRange: string }
// Response: { success: boolean, data: { funnelData: Object, landingPages: Array, formSubmissions: Array } }
export const getFunnelAnalytics = async (timeRange: string) => {
  try {
    const response = await api.get(`/api/analytics/funnel?timeRange=${timeRange}`);
    
    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      console.error('Funnel analytics API response indicates failure:', response.data);
      throw new Error('API response indicates failure');
    }
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Funnel analytics API error:', apiError);
    
    // Handle specific error cases
    if (apiError?.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    
    if (apiError?.response?.status === 404) {
      throw new Error('Funnel analytics endpoint not found. Please check server configuration.');
    }
    
    if (apiError?.response?.status === 400) {
      throw new Error('Invalid time range parameter provided.');
    }
    
    if (apiError?.response?.status === 500) {
      throw new Error('Server error while fetching funnel analytics. Please try again later.');
    }
    
    throw new Error(apiError?.response?.data?.message || apiError?.message || 'Failed to load funnel analytics');
  }
};
