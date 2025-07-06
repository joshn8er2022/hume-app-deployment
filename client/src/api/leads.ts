import api from './api';

// Description: Get all leads with filtering options
// Endpoint: GET /api/leads
// Request: { businessType?: string, status?: string, search?: string, page?: number, limit?: number }
// Response: { success: boolean, leads: Array<Lead>, total: number, page: number, totalPages: number, hasNext: boolean, hasPrev: boolean }
export const getLeads = async (filters = {}) => {
  try {
    const response = await api.get('/api/leads', { params: filters });
    return response.data.leads;
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Create a new lead
// Endpoint: POST /api/leads
// Request: { firstName: string, lastName: string, email: string, phone?: string, companyName?: string, businessType: string, source?: string, score?: number }
// Response: { success: boolean, message: string, lead: Lead }
export const createLead = async (leadData: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  businessType: string;
  source?: string;
  score?: number;
}) => {
  try {
    const response = await api.post('/api/leads', leadData);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Get lead by ID
// Endpoint: GET /api/leads/:id
// Request: {}
// Response: { success: boolean, lead: Lead }
export const getLeadById = async (leadId: string) => {
  try {
    const response = await api.get(`/api/leads/${leadId}`);
    return response.data.lead;
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Update lead information
// Endpoint: PUT /api/leads/:id
// Request: { firstName?: string, lastName?: string, email?: string, phone?: string, companyName?: string, businessType?: string, score?: number, source?: string }
// Response: { success: boolean, message: string, lead: Lead }
export const updateLead = async (leadId: string, updateData: any) => {
  try {
    const response = await api.put(`/api/leads/${leadId}`, updateData);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Update lead status
// Endpoint: PUT /api/leads/:id/status
// Request: { status: string }
// Response: { success: boolean, message: string, lead: Lead }
export const updateLeadStatus = async (leadId: string, status: string) => {
  try {
    const response = await api.put(`/api/leads/${leadId}/status`, { status });
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Add note to lead
// Endpoint: POST /api/leads/:id/notes
// Request: { note: string }
// Response: { success: boolean, message: string, lead: Lead }
export const addLeadNote = async (leadId: string, note: string) => {
  try {
    const response = await api.post(`/api/leads/${leadId}/notes`, { note });
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Delete lead
// Endpoint: DELETE /api/leads/:id
// Request: {}
// Response: { success: boolean, message: string }
export const deleteLead = async (leadId: string) => {
  try {
    const response = await api.delete(`/api/leads/${leadId}`);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}