import api from './api';

// Description: Submit a new application
// Endpoint: POST /api/applications
// Request: { personalInfo: object, businessInfo: object, requirements: object, applicationType: string }
// Response: { success: boolean, message: string, data: object }
export const submitApplication = async (applicationData: any) => {
  try {
    const response = await api.post('/api/applications', applicationData);
    return response.data;
  } catch (error) {
    console.error('Submit application error:', error);
    
    // Handle specific error cases
    if (error?.code === 'ECONNREFUSED') {
      throw new Error('Server is not running. Please check if the backend server is started.');
    }
    
    if (error?.response?.status === 404) {
      throw new Error('API endpoint not found. Please check the server configuration.');
    }
    
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    if (error?.message) {
      throw new Error(error.message);
    }
    
    throw new Error('Failed to submit application. Please try again.');
  }
};

// Description: Get application status by ID
// Endpoint: GET /api/applications/:id
// Request: {}
// Response: { success: boolean, data: object }
export const getApplicationStatus = async (applicationId: string) => {
  try {
    const response = await api.get(`/api/applications/${applicationId}`);
    return response.data;
  } catch (error) {
    console.error('Get application status error:', error);
    
    if (error?.code === 'ECONNREFUSED') {
      throw new Error('Server is not running. Please check if the backend server is started.');
    }
    
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    if (error?.message) {
      throw new Error(error.message);
    }
    
    throw new Error('Failed to get application status. Please try again.');
  }
};