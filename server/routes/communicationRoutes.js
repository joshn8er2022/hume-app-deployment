const express = require('express');
const router = express.Router();
const communicationService = require('../services/communicationService');
const auth = require('./middleware/auth');

// Get communications with filtering
router.get('/', auth, async (req, res) => {
  try {
    console.log('GET /api/communications - Fetching communications');
    console.log('Query parameters:', req.query);

    const filters = {
      type: req.query.type,
      rep: req.query.rep,
      contactId: req.query.contactId
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });

    const result = await communicationService.getCommunications(req.user.id, filters);

    // Get campaigns for the response
    const campaigns = await communicationService.getCampaigns(req.user.id);
    
    // Format campaigns for frontend
    const formattedCampaigns = campaigns.map(campaign => ({
      _id: campaign._id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      recipients: campaign.recipients.length,
      openRate: campaign.statistics.openRate,
      responseRate: campaign.statistics.responseRate,
      createdAt: campaign.createdAt.toISOString().split('T')[0]
    }));

    console.log('Communications fetched successfully');
    res.json({
      success: true,
      ...result,
      campaigns: formattedCampaigns
    });
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send individual message
router.post('/message', auth, async (req, res) => {
  try {
    console.log('POST /api/communications/message - Sending message');
    console.log('Request body:', req.body);

    const result = await communicationService.sendMessage(req.body, req.user.id);

    console.log('Message sent successfully');
    res.json(result);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Create new campaign
router.post('/campaign', auth, async (req, res) => {
  try {
    console.log('POST /api/communications/campaign - Creating campaign');
    console.log('Request body:', req.body);

    const campaignData = {
      name: req.body.name,
      type: req.body.type,
      subject: req.body.subject,
      content: req.body.content,
      recipients: req.body.recipients || [],
      status: 'active'
    };

    const campaign = await communicationService.createCampaign(campaignData, req.user.id);

    console.log('Campaign created successfully:', campaign._id);
    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      campaignId: campaign._id,
      campaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get all campaigns
router.get('/campaigns', auth, async (req, res) => {
  try {
    console.log('GET /api/communications/campaigns - Fetching campaigns');
    console.log('Query parameters:', req.query);

    const filters = {
      type: req.query.type,
      status: req.query.status,
      search: req.query.search
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });

    const campaigns = await communicationService.getCampaigns(req.user.id, filters);

    console.log('Campaigns fetched successfully:', campaigns.length);
    res.json({
      success: true,
      campaigns
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get campaign statistics
router.get('/campaigns/:id/statistics', auth, async (req, res) => {
  try {
    console.log('GET /api/communications/campaigns/:id/statistics - Fetching campaign statistics');
    console.log('Campaign ID:', req.params.id);

    const result = await communicationService.getCampaignStatistics(req.params.id, req.user.id);

    console.log('Campaign statistics fetched successfully');
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching campaign statistics:', error);
    const statusCode = error.message === 'Campaign not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Delete campaign
router.delete('/campaigns/:id', auth, async (req, res) => {
  try {
    console.log('DELETE /api/communications/campaigns/:id - Deleting campaign');
    console.log('Campaign ID:', req.params.id);

    const result = await communicationService.deleteCampaign(req.params.id, req.user.id);

    console.log('Campaign deleted successfully');
    res.json(result);
  } catch (error) {
    console.error('Error deleting campaign:', error);
    const statusCode = error.message === 'Campaign not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;