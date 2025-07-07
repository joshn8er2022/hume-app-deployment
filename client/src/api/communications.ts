import api from './api';

interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
  message?: string;
}

interface MessageData {
  type: string;
  recipient: string;
  subject: string;
  content: string;
  [key: string]: unknown;
}

interface CampaignData {
  name: string;
  type: string;
  subject: string;
  content: string;
  recipients: unknown[];
  [key: string]: unknown;
}

// Description: Get communications data with filtering
// Endpoint: GET /api/communications
// Request: { type?: string, rep?: string, contactId?: string }
// Response: { communications: Array, campaigns: Array, contacts: Array }
export const getCommunications = async (filters = {}) => {
  try {
    const response = await api.get('/api/communications', { params: filters });
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError?.response?.data?.error || apiError?.message || 'Failed to get communications');
  }
}

// Description: Send a new message
// Endpoint: POST /api/communications/message
// Request: { type: string, recipient: string, subject: string, content: string }
// Response: { success: boolean, message: string, messageId: string }
export const sendMessage = async (data: MessageData) => {
  try {
    const response = await api.post('/api/communications/message', data);
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError?.response?.data?.error || apiError?.message || 'Failed to send message');
  }
}

// Description: Create a new campaign
// Endpoint: POST /api/communications/campaign
// Request: { name: string, type: string, subject: string, content: string, recipients: Array }
// Response: { success: boolean, message: string, campaignId: string }
export const createCampaign = async (data: CampaignData) => {
  try {
    const response = await api.post('/api/communications/campaign', data);
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError?.response?.data?.error || apiError?.message || 'Failed to create campaign');
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
    const apiError = error as ApiError;
    throw new Error(apiError?.response?.data?.error || apiError?.message || 'Failed to get campaigns');
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
    const apiError = error as ApiError;
    throw new Error(apiError?.response?.data?.error || apiError?.message || 'Failed to get campaign statistics');
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
    const apiError = error as ApiError;
    throw new Error(apiError?.response?.data?.error || apiError?.message || 'Failed to delete campaign');
  }
}
