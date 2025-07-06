import api from './api';

// Description: User login
// Endpoint: POST /api/auth/login
// Request: { email: string, password: string }
// Response: { success: boolean, message: string, accessToken: string, refreshToken?: string, user?: object }
export const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/api/auth/login', {
      email,
      password
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Login API error:', error);
    
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: User registration
// Endpoint: POST /api/auth/register
// Request: { firstName: string, lastName: string, email: string, password: string, role?: string, companyName?: string }
// Response: { success: boolean, message: string, accessToken: string, user?: object }
export const register = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
  companyName?: string;
}) => {
  try {
    const response = await api.post('/api/auth/register', userData);
    
    return response.data;
  } catch (error: any) {
    console.error('Register API error:', error);
    
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: User logout
// Endpoint: POST /api/auth/logout
// Request: {}
// Response: { success: boolean, message: string }
export const logout = async () => {
  try {
    const response = await api.post('/api/auth/logout');
    
    return response.data;
  } catch (error: any) {
    console.error('Logout API error:', error);
    
    // Don't throw error for logout - just log it
  }
};