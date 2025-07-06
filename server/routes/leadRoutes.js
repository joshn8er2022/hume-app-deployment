const express = require('express');
const router = express.Router();
const leadService = require('../services/leadService');
const auth = require('./middleware/auth');

// Create a new lead
router.post('/', auth, async (req, res) => {
  try {
    console.log('POST /api/leads - Creating new lead');
    console.log('Request body:', req.body);
    
    const leadData = {
      ...req.body,
      assignedTo: req.user.id // Assign to current user by default
    };
    
    const lead = await leadService.createLead(leadData);
    
    console.log('Lead created successfully:', lead._id);
    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get all leads with filtering and pagination
router.get('/', auth, async (req, res) => {
  try {
    console.log('GET /api/leads - Fetching leads');
    console.log('Query parameters:', req.query);
    
    const {
      businessType,
      status,
      search,
      page = 1,
      limit = 50
    } = req.query;
    
    const filters = {
      businessType,
      status,
      search
    };
    
    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });
    
    const result = await leadService.getLeads(filters, parseInt(page), parseInt(limit));
    
    console.log('Leads fetched successfully:', result.leads.length, 'leads');
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get lead by ID
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('GET /api/leads/:id - Fetching lead by ID:', req.params.id);
    
    const lead = await leadService.getLeadById(req.params.id);
    
    console.log('Lead fetched successfully:', lead._id);
    res.json({
      success: true,
      lead
    });
  } catch (error) {
    console.error('Error fetching lead by ID:', error);
    const statusCode = error.message === 'Lead not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Update lead
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('PUT /api/leads/:id - Updating lead:', req.params.id);
    console.log('Update data:', req.body);
    
    const lead = await leadService.updateLead(req.params.id, req.body);
    
    console.log('Lead updated successfully:', lead._id);
    res.json({
      success: true,
      message: 'Lead updated successfully',
      lead
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    const statusCode = error.message === 'Lead not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Update lead status
router.put('/:id/status', auth, async (req, res) => {
  try {
    console.log('PUT /api/leads/:id/status - Updating lead status:', req.params.id);
    console.log('New status:', req.body.status);
    
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const lead = await leadService.updateLeadStatus(req.params.id, status);
    
    console.log('Lead status updated successfully:', lead._id);
    res.json({
      success: true,
      message: 'Lead status updated successfully',
      lead
    });
  } catch (error) {
    console.error('Error updating lead status:', error);
    const statusCode = error.message === 'Lead not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Add note to lead
router.post('/:id/notes', auth, async (req, res) => {
  try {
    console.log('POST /api/leads/:id/notes - Adding note to lead:', req.params.id);
    console.log('Note content:', req.body.note);
    
    const { note } = req.body;
    
    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Note content is required'
      });
    }
    
    const lead = await leadService.addNoteToLead(req.params.id, note, req.user.id);
    
    console.log('Note added successfully to lead:', lead._id);
    res.json({
      success: true,
      message: 'Note added successfully',
      lead
    });
  } catch (error) {
    console.error('Error adding note to lead:', error);
    const statusCode = error.message === 'Lead not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Delete lead
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('DELETE /api/leads/:id - Deleting lead:', req.params.id);
    
    const result = await leadService.deleteLead(req.params.id);
    
    console.log('Lead deleted successfully:', req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting lead:', error);
    const statusCode = error.message === 'Lead not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;