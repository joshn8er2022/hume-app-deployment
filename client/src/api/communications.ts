import api from './api';

// Description: Get communications data with filtering
// Endpoint: GET /api/communications
// Request: { type?: string, rep?: string, contactId?: string }
// Response: { communications: Array, campaigns: Array, contacts: Array }
export const getCommunications = async (filters = {}) => {
  try {
    const response = await api.get('/api/communications', { params: filters });
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Send a new message
// Endpoint: POST /api/communications/message
// Request: { type: string, recipient: string, subject: string, content: string }
// Response: { success: boolean, message: string, messageId: string }
export const sendMessage = async (data: any) => {
  try {
    const response = await api.post('/api/communications/message', data);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Create a new campaign
// Endpoint: POST /api/communications/campaign
// Request: { name: string, type: string, subject: string, content: string, recipients: Array }
// Response: { success: boolean, message: string, campaignId: string }
export const createCampaign = async (data: any) => {
  try {
    const response = await api.post('/api/communications/campaign', data);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Get all campaigns
// Endpoint: GET /api/communications/campaigns
// Request: { type?: string, status?: string, search?: string }
// Response: { success: boolean, campaigns: Array }
export const getCampaigns = async (filters = {}) => {
  try {
    const response = await api.get('/api/communications/campaigns', { params: filters });
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Get campaign statistics
// Endpoint: GET /api/communications/campaigns/:id/statistics
// Request: {}
// Response: { success: boolean, campaign: Object, statistics: Object }
export const getCampaignStatistics = async (campaignId: string) => {
  try {
    const response = await api.get(`/api/communications/campaigns/${campaignId}/statistics`);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Delete a campaign
// Endpoint: DELETE /api/communications/campaigns/:id
// Request: {}
// Response: { success: boolean, message: string }
export const deleteCampaign = async (campaignId: string) => {
  try {
    const response = await api.delete(`/api/communications/campaigns/${campaignId}`);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}