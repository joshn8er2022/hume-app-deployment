import axios from 'axios';

// Determine the base URL based on environment
const getBaseURL = () => {
  // If we're in the browser and the hostname contains vercel.app, use relative URLs
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('vercel.app') || 
        window.location.hostname.includes('devtunnels.ms')) {
      return window.location.origin;
    }
  }
  
  // Default to localhost for development
  return 'http://localhost:3000';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const accessToken = localStorage.getItem('accessToken');
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    console.error('API request failed:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken: refreshToken
          });

          const { accessToken: newAccessToken } = response.data;
          
          // Update stored token
          localStorage.setItem('accessToken', newAccessToken);
          
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          return api(originalRequest);
        } else {
          // Clear any remaining tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          // Redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('API: Token refresh failed:', refreshError);
        
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;