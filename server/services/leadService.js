const Lead = require('../models/Lead');

class LeadService {
  // Create a new lead
  async createLead(leadData) {
    try {
      console.log('LeadService: Creating new lead with data:', leadData);
      
      const lead = new Lead(leadData);
      const savedLead = await lead.save();
      
      console.log('LeadService: Lead created successfully with ID:', savedLead._id);
      return savedLead;
    } catch (error) {
      console.error('LeadService: Error creating lead:', error);
      throw error;
    }
  }

  // Get all leads with filtering and pagination
  async getLeads(filters = {}, page = 1, limit = 50) {
    try {
      console.log('LeadService: Fetching leads with filters:', filters, 'page:', page, 'limit:', limit);
      
      const query = {};
      
      // Apply filters
      if (filters.businessType && filters.businessType !== 'all') {
        query.businessType = filters.businessType;
      }
      
      if (filters.status && filters.status !== 'all') {
        query.status = filters.status;
      }
      
      if (filters.search) {
        query.$or = [
          { firstName: { $regex: filters.search, $options: 'i' } },
          { lastName: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
          { companyName: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      
      const [leads, total] = await Promise.all([
        Lead.find(query)
          .populate('assignedTo', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Lead.countDocuments(query)
      ]);

      console.log('LeadService: Found', leads.length, 'leads out of', total, 'total');
      
      return {
        leads,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      };
    } catch (error) {
      console.error('LeadService: Error fetching leads:', error);
      throw error;
    }
  }

  // Get lead by ID
  async getLeadById(leadId) {
    try {
      console.log('LeadService: Fetching lead by ID:', leadId);
      
      const lead = await Lead.findById(leadId)
        .populate('assignedTo', 'firstName lastName email')
        .populate('notes.createdBy', 'firstName lastName email');
      
      if (!lead) {
        console.log('LeadService: Lead not found with ID:', leadId);
        throw new Error('Lead not found');
      }
      
      console.log('LeadService: Lead found:', lead._id);
      return lead;
    } catch (error) {
      console.error('LeadService: Error fetching lead by ID:', error);
      throw error;
    }
  }

  // Update lead
  async updateLead(leadId, updateData) {
    try {
      console.log('LeadService: Updating lead:', leadId, 'with data:', updateData);
      
      const lead = await Lead.findByIdAndUpdate(
        leadId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('assignedTo', 'firstName lastName email');
      
      if (!lead) {
        console.log('LeadService: Lead not found for update:', leadId);
        throw new Error('Lead not found');
      }
      
      console.log('LeadService: Lead updated successfully:', lead._id);
      return lead;
    } catch (error) {
      console.error('LeadService: Error updating lead:', error);
      throw error;
    }
  }

  // Update lead status
  async updateLeadStatus(leadId, status) {
    try {
      console.log('LeadService: Updating lead status:', leadId, 'to:', status);
      
      const lead = await Lead.findByIdAndUpdate(
        leadId,
        { status, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      if (!lead) {
        console.log('LeadService: Lead not found for status update:', leadId);
        throw new Error('Lead not found');
      }
      
      console.log('LeadService: Lead status updated successfully:', lead._id);
      return lead;
    } catch (error) {
      console.error('LeadService: Error updating lead status:', error);
      throw error;
    }
  }

  // Add note to lead
  async addNoteToLead(leadId, noteContent, createdBy) {
    try {
      console.log('LeadService: Adding note to lead:', leadId);
      
      const lead = await Lead.findById(leadId);
      
      if (!lead) {
        console.log('LeadService: Lead not found for adding note:', leadId);
        throw new Error('Lead not found');
      }
      
      const note = {
        content: noteContent,
        createdBy,
        createdAt: new Date()
      };
      
      lead.notes.push(note);
      await lead.save();
      
      console.log('LeadService: Note added successfully to lead:', lead._id);
      return lead;
    } catch (error) {
      console.error('LeadService: Error adding note to lead:', error);
      throw error;
    }
  }

  // Delete lead
  async deleteLead(leadId) {
    try {
      console.log('LeadService: Deleting lead:', leadId);
      
      const lead = await Lead.findByIdAndDelete(leadId);
      
      if (!lead) {
        console.log('LeadService: Lead not found for deletion:', leadId);
        throw new Error('Lead not found');
      }
      
      console.log('LeadService: Lead deleted successfully:', leadId);
      return { success: true, message: 'Lead deleted successfully' };
    } catch (error) {
      console.error('LeadService: Error deleting lead:', error);
      throw error;
    }
  }
}

module.exports = new LeadService();