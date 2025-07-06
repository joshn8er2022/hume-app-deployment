import axios from 'axios';

// Determine the base URL based on environment
const getBaseURL = () => {
  // NUCLEAR OPTION: Always use Railway URL when in production
  if (typeof window !== 'undefined') {
    console.log('🔍 NUCLEAR DEBUG v3 - Window hostname:', window.location.hostname);
    console.log('🔍 NUCLEAR DEBUG v3 - Window origin:', window.location.origin);
    console.log('🔍 NUCLEAR DEBUG v3 - Timestamp:', new Date().toISOString());
    
    // If we're anywhere other than localhost, force Railway URL
    if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
      console.log('🔍 NUCLEAR DEBUG v3 - FORCING Railway URL for ANY non-localhost');
      console.log('🔍 NUCLEAR DEBUG v3 - Will call: https://hume-app-deployment-production.up.railway.app');
      return 'https://hume-app-deployment-production.up.railway.app';
    }
  }
  
  // Default to localhost for development
  console.log('🔍 NUCLEAR DEBUG v3 - Using localhost fallback');
  return 'http://localhost:4000';
};

const baseURL = getBaseURL();
console.log('🚀 CLIENT DEBUG - API base URL set to:', baseURL);

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('📡 NUCLEAR DEBUG v3 - Making API request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      timestamp: new Date().toISOString()
    });
    
    // Get token from localStorage
    const accessToken = localStorage.getItem('accessToken');
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    console.error('🚨 CLIENT DEBUG - API request failed:', {
      message: error.message,
      code: error.code,
      config: error.config
    });
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