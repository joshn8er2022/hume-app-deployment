import api from './api';

interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string | object;
      errorType?: string;
      details?: unknown[];
      fields?: unknown[];
      rawDetails?: unknown[];
    };
    status?: number;
  };
  message?: string;
  code?: string;
}

interface ApplicationData {
  personalInfo?: object;
  businessInfo?: object;
  requirements?: object;
  applicationType: string;
  [key: string]: unknown;
}

// Description: Submit a new application
// Endpoint: POST /api/applications
// Request: { personalInfo: object, businessInfo: object, requirements: object, applicationType: string }
// Response: { success: boolean, message: string, data: object }
export const submitApplication = async (applicationData: ApplicationData) => {
  try {
    console.log('Submitting application data:', applicationData);
    const response = await api.post('/api/applications', applicationData);
    console.log('Application submitted successfully:', response.data);
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Submit application error:', apiError);
    console.error('Error response:', apiError?.response?.data);
    
    // Handle specific error types from backend
    if (apiError?.response?.data?.errorType) {
      const { errorType, error: errorMessage, details, fields } = apiError.response.data;
      
      switch (errorType) {
        case 'VALIDATION_ERROR': {
          // Extract meaningful error messages from validation objects
          const validationDetails = Array.isArray(details) ? details : (Array.isArray(fields) ? fields : []);
          const errorMessages = validationDetails.map((detail: unknown) => {
            // Handle different error object formats
            if (typeof detail === 'string') {
              return detail;
            } else if (typeof detail === 'object' && detail !== null) {
              // Extract message from validation error objects
              const detailObj = detail as Record<string, unknown>;
              return detailObj.message || detailObj.label || detailObj.field || 'Validation error';
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
          
          throw new Error(String(finalMessage));
        }
        
        case 'DUPLICATE_APPLICATION':
          throw new Error('An application with this email already exists for this application type. Please use a different email or contact support if you need to update your existing application.');
        
        case 'DATABASE_ERROR':
          throw new Error('Database connection failed. Please check your internet connection and try again in a few moments.');
        
        case 'DATA_FORMAT_ERROR':
          throw new Error('Invalid data format provided. Please check your information and try again.');
        
        case 'INTERNAL_ERROR': {
          const internalMessage = details ? `Internal error: ${details}` : 'An unexpected server error occurred.';
          throw new Error(`${internalMessage} Please try again or contact support if the problem persists.`);
        }
        
        default:
          throw new Error(String(errorMessage) || 'An unexpected error occurred while submitting your application.');
      }
    }
    
    // Handle network and connection errors
    if (apiError?.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
    }
    
    if (apiError?.response?.status === 404) {
      throw new Error('Service temporarily unavailable. Please try again later.');
    }
    
    if (apiError?.response?.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    
    if (apiError?.response?.status && apiError.response.status >= 500) {
      throw new Error('Server error occurred. Please try again in a few moments.');
    }
    
    // Fallback error handling - fix [object Object] issue
    if (apiError?.response?.data?.error) {
      const errorMsg = typeof apiError.response.data.error === 'string' 
        ? apiError.response.data.error 
        : JSON.stringify(apiError.response.data.error);
      throw new Error(errorMsg);
    }
    
    if (apiError?.response?.data?.message) {
      const errorMsg = typeof apiError.response.data.message === 'string' 
        ? apiError.response.data.message 
        : JSON.stringify(apiError.response.data.message);
      throw new Error(errorMsg);
    }
    
    if (apiError?.message) {
      throw new Error(apiError.message);
    }
    
    // Handle the case where error.response.data is an object but doesn't have error/message
    if (apiError?.response?.data && typeof apiError.response.data === 'object') {
      const errorData = apiError.response.data;
      
      console.error('=== PROCESSING COMPLEX ERROR RESPONSE ===');
      console.error('Error data:', errorData);
      
      // Try to extract details array first
      if (errorData.details && Array.isArray(errorData.details)) {
        const detailMessages = errorData.details.map((detail: unknown) => {
          if (typeof detail === 'string') {
            return detail;
          } else if (typeof detail === 'object' && detail !== null) {
            const detailObj = detail as Record<string, unknown>;
            return detailObj.message || detailObj.label || detailObj.field || 'Validation error';
          }
          return 'Unknown error';
        });
        console.error('Extracted detail messages:', detailMessages);
        throw new Error(`Validation failed: ${detailMessages.join(', ')}`);
      }
      
      // Try to extract rawDetails if available
      if (errorData.rawDetails && Array.isArray(errorData.rawDetails)) {
        const rawMessages = errorData.rawDetails.map((detail: unknown) => {
          if (typeof detail === 'string') {
            return detail;
          } else if (typeof detail === 'object' && detail !== null) {
            const detailObj = detail as Record<string, unknown>;
            return detailObj.message || detailObj.label || detailObj.field || 'Validation error';
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
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Get application status error:', apiError);
    
    if (apiError?.code === 'ECONNREFUSED') {
      throw new Error('Server is not running. Please check if the backend server is started.');
    }
    
    if (apiError?.response?.data?.message) {
      throw new Error(apiError.response.data.message);
    }
    
    if (apiError?.message) {
      throw new Error(apiError.message);
    }
    
    throw new Error('Failed to get application status. Please try again.');
  }
};
