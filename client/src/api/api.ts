import axios from 'axios';

// Determine the base URL based on environment
const getBaseURL = () => {
  // TEMPORARY FIX: Force Railway URL to solve immediate issue
  if (typeof window !== 'undefined') {
    console.log('🔍 CLIENT DEBUG - Window hostname:', window.location.hostname);
    console.log('🔍 CLIENT DEBUG - Window origin:', window.location.origin);
    
    // Force Railway URL if we're on Railway domain
    if (window.location.hostname.includes('railway.app')) {
      console.log('🔍 CLIENT DEBUG - FORCED Railway URL');
      return 'https://hume-app-deployment-production.up.railway.app';
    }
    
    if (window.location.hostname.includes('vercel.app') || 
        window.location.hostname.includes('devtunnels.ms')) {
      console.log('🔍 CLIENT DEBUG - Using production URL:', window.location.origin);
      return window.location.origin;
    }
  }
  
  // Default to localhost for development
  console.log('🔍 CLIENT DEBUG - Using localhost fallback');
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
    console.log('📡 CLIENT DEBUG - Making API request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
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