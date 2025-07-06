import api from './api';

// Description: Get current user profile with extended information
// Endpoint: GET /api/users/me
// Request: {}
// Response: { success: boolean, data: { _id: string, email: string, role: string, companyName: string, subscriptionStatus: string, firstName: string, lastName: string, phone: string, createdAt: string, lastLoginAt: string, isActive: boolean } }
export const getUserProfile = async () => {
  try {
    const response = await api.get('/api/users/me');
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Update current user profile information
// Endpoint: PUT /api/users/me
// Request: { email?: string, role?: string, companyName?: string, subscriptionStatus?: string, firstName?: string, lastName?: string, phone?: string }
// Response: { success: boolean, data: { _id: string, email: string, role: string, companyName: string, subscriptionStatus: string, firstName: string, lastName: string, phone: string, createdAt: string, lastLoginAt: string, isActive: boolean }, message: string }
export const updateUserProfile = async (profileData: {
  email?: string;
  role?: string;
  companyName?: string;
  subscriptionStatus?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}) => {
  try {
    const response = await api.put('/api/users/me', profileData);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};