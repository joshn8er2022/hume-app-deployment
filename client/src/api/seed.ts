import api from './api';

// Description: Create initial admin user in the database
// Endpoint: POST /api/seed/admin
// Request: {}
// Response: { success: boolean, message: string, data: { email: string, role: string, firstName: string, lastName: string } }
export const seedAdminUser = async () => {
  try {
    const response = await api.post('/api/seed/admin');
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Create sample test data for the application
// Endpoint: POST /api/seed/test-data
// Request: {}
// Response: { success: boolean, message: string, data: { users: number, leads: number, applications: number, communications: number } }
export const seedTestData = async () => {
  try {
    const response = await api.post('/api/seed/test-data');
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Check the current seeding status and data counts
// Endpoint: GET /api/seed/status
// Request: {}
// Response: { success: boolean, data: { adminUserExists: boolean, counts: { users: number, leads: number, applications: number, communications: number } } }
export const getSeedStatus = async () => {
  try {
    const response = await api.get('/api/seed/status');
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};