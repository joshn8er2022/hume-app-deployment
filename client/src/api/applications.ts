import api from './api';

// Description: Submit a new application
// Endpoint: POST /api/applications
// Request: { personalInfo: object, businessInfo: object, requirements: object, applicationType: string }
// Response: { success: boolean, message: string, data: object }
export const submitApplication = async (applicationData: any) => {
  try {
    console.log('Submitting application data:', applicationData);
    const response = await api.post('/api/applications', applicationData);
    console.log('Application submitted successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Submit application error:', error);
    console.error('Error response:', error?.response?.data);
    
    // Handle specific error types from backend
    if (error?.response?.data?.errorType) {
      const { errorType, error: errorMessage, details, fields } = error.response.data;
      
      switch (errorType) {
        case 'VALIDATION_ERROR':
          // Extract meaningful error messages from validation objects
          const validationDetails = Array.isArray(details) ? details : (Array.isArray(fields) ? fields : []);
          const errorMessages = validationDetails.map(detail => {
            // Handle different error object formats
            if (typeof detail === 'string') {
              return detail;
            } else if (typeof detail === 'object' && detail !== null) {
              // Extract message from validation error objects
              return detail.message || detail.label || detail.field || 'Validation error';
            }
            return 'Unknown validation error';
          });
          
          const finalMessage = errorMessages.length > 0 
            ? `Validation failed: ${errorMessages.join(', ')}` 
            : (errorMessage || 'Form validation failed');
          
          console.error('=== VALIDATION ERROR DETAILS ===');
          console.error('Raw details:', details);
          console.error('Raw fields:', fields);
          console.error('Extracted messages:', errorMessages);
          console.error('Final error message:', finalMessage);
          
          throw new Error(finalMessage);
        
        case 'DUPLICATE_APPLICATION':
          throw new Error('An application with this email already exists for this application type. Please use a different email or contact support if you need to update your existing application.');
        
        case 'DATABASE_ERROR':
          throw new Error('Database connection failed. Please check your internet connection and try again in a few moments.');
        
        case 'DATA_FORMAT_ERROR':
          throw new Error('Invalid data format provided. Please check your information and try again.');
        
        case 'INTERNAL_ERROR':
          const internalMessage = details ? `Internal error: ${details}` : 'An unexpected server error occurred.';
          throw new Error(`${internalMessage} Please try again or contact support if the problem persists.`);
        
        default:
          throw new Error(errorMessage || 'An unexpected error occurred while submitting your application.');
      }
    }
    
    // Handle network and connection errors
    if (error?.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
    }
    
    if (error?.response?.status === 404) {
      throw new Error('Service temporarily unavailable. Please try again later.');
    }
    
    if (error?.response?.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    
    if (error?.response?.status >= 500) {
      throw new Error('Server error occurred. Please try again in a few moments.');
    }
    
    // Fallback error handling - fix [object Object] issue
    if (error?.response?.data?.error) {
      const errorMsg = typeof error.response.data.error === 'string' 
        ? error.response.data.error 
        : JSON.stringify(error.response.data.error);
      throw new Error(errorMsg);
    }
    
    if (error?.response?.data?.message) {
      const errorMsg = typeof error.response.data.message === 'string' 
        ? error.response.data.message 
        : JSON.stringify(error.response.data.message);
      throw new Error(errorMsg);
    }
    
    if (error?.message) {
      throw new Error(error.message);
    }
    
    // Handle the case where error.response.data is an object but doesn't have error/message
    if (error?.response?.data && typeof error.response.data === 'object') {
      const errorData = error.response.data;
      
      console.error('=== PROCESSING COMPLEX ERROR RESPONSE ===');
      console.error('Error data:', errorData);
      
      // Try to extract details array first
      if (errorData.details && Array.isArray(errorData.details)) {
        const detailMessages = errorData.details.map(detail => {
          if (typeof detail === 'string') {
            return detail;
          } else if (typeof detail === 'object' && detail !== null) {
            return detail.message || detail.label || detail.field || 'Validation error';
          }
          return 'Unknown error';
        });
        console.error('Extracted detail messages:', detailMessages);
        throw new Error(`Validation failed: ${detailMessages.join(', ')}`);
      }
      
      // Try to extract rawDetails if available
      if (errorData.rawDetails && Array.isArray(errorData.rawDetails)) {
        const rawMessages = errorData.rawDetails.map(detail => {
          if (typeof detail === 'string') {
            return detail;
          } else if (typeof detail === 'object' && detail !== null) {
            return detail.message || detail.label || detail.field || 'Validation error';
          }
          return 'Unknown error';
        });
        console.error('Extracted raw detail messages:', rawMessages);
        throw new Error(`Validation failed: ${rawMessages.join(', ')}`);
      }
      
      // Fallback to any error message in the response
      if (errorData.error && typeof errorData.error === 'string') {
        throw new Error(errorData.error);
      }
      
      // Last resort - stringify but avoid [object Object]
      const errorString = JSON.stringify(errorData);
      if (errorString === '{}' || errorString.includes('[object Object]')) {
        throw new Error('Server returned an error but the details could not be parsed. Please try again.');
      }
      
      throw new Error(`Server error: ${errorString}`);
    }
    
    throw new Error('Failed to submit application. Please check your information and try again.');
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
  } catch (error: any) {
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