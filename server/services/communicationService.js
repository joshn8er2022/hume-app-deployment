const Campaign = require('../models/Campaign');
const Communication = require('../models/Communication');

class CommunicationService {
  // Create a new campaign
  async createCampaign(campaignData, userId) {
    try {
      console.log('CommunicationService: Creating new campaign with data:', campaignData);

      const campaign = new Campaign({
        ...campaignData,
        createdBy: userId
      });

      const savedCampaign = await campaign.save();
      console.log('CommunicationService: Campaign created successfully with ID:', savedCampaign._id);

      return savedCampaign;
    } catch (error) {
      console.error('CommunicationService: Error creating campaign:', error);
      throw error;
    }
  }

  // Get all campaigns for a user
  async getCampaigns(userId, filters = {}) {
    try {
      console.log('CommunicationService: Fetching campaigns for user:', userId, 'with filters:', filters);

      const query = { createdBy: userId };

      // Apply filters
      if (filters.type && filters.type !== 'all') {
        query.type = filters.type;
      }

      if (filters.status && filters.status !== 'all') {
        query.status = filters.status;
      }

      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { subject: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const campaigns = await Campaign.find(query)
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 });

      console.log('CommunicationService: Found', campaigns.length, 'campaigns');
      return campaigns;
    } catch (error) {
      console.error('CommunicationService: Error fetching campaigns:', error);
      throw error;
    }
  }

  // Get campaign by ID
  async getCampaignById(campaignId, userId) {
    try {
      console.log('CommunicationService: Fetching campaign by ID:', campaignId);

      const campaign = await Campaign.findOne({ _id: campaignId, createdBy: userId })
        .populate('createdBy', 'firstName lastName email');

      if (!campaign) {
        console.log('CommunicationService: Campaign not found with ID:', campaignId);
        throw new Error('Campaign not found');
      }

      console.log('CommunicationService: Campaign found:', campaign._id);
      return campaign;
    } catch (error) {
      console.error('CommunicationService: Error fetching campaign by ID:', error);
      throw error;
    }
  }

  // Get campaign statistics
  async getCampaignStatistics(campaignId, userId) {
    try {
      console.log('CommunicationService: Fetching statistics for campaign:', campaignId);

      const campaign = await this.getCampaignById(campaignId, userId);

      // Get communications for this campaign
      const communications = await Communication.find({ campaign: campaignId });

      // Calculate statistics
      const stats = {
        totalSent: communications.filter(c => ['sent', 'delivered', 'opened', 'clicked', 'replied'].includes(c.status)).length,
        totalDelivered: communications.filter(c => ['delivered', 'opened', 'clicked', 'replied'].includes(c.status)).length,
        totalOpened: communications.filter(c => ['opened', 'clicked', 'replied'].includes(c.status)).length,
        totalClicked: communications.filter(c => ['clicked', 'replied'].includes(c.status)).length,
        totalReplied: communications.filter(c => c.status === 'replied').length,
        totalRecipients: campaign.recipients.length
      };

      // Calculate rates
      stats.openRate = stats.totalSent > 0 ? Math.round((stats.totalOpened / stats.totalSent) * 100) : 0;
      stats.responseRate = stats.totalSent > 0 ? Math.round((stats.totalReplied / stats.totalSent) * 100) : 0;
      stats.deliveryRate = stats.totalSent > 0 ? Math.round((stats.totalDelivered / stats.totalSent) * 100) : 0;

      // Update campaign statistics
      await Campaign.findByIdAndUpdate(campaignId, {
        'statistics.totalSent': stats.totalSent,
        'statistics.totalDelivered': stats.totalDelivered,
        'statistics.totalOpened': stats.totalOpened,
        'statistics.totalClicked': stats.totalClicked,
        'statistics.totalReplied': stats.totalReplied,
        'statistics.openRate': stats.openRate,
        'statistics.responseRate': stats.responseRate
      });

      console.log('CommunicationService: Statistics calculated for campaign:', campaignId, stats);
      return {
        campaign,
        statistics: stats
      };
    } catch (error) {
      console.error('CommunicationService: Error fetching campaign statistics:', error);
      throw error;
    }
  }

  // Delete campaign
  async deleteCampaign(campaignId, userId) {
    try {
      console.log('CommunicationService: Deleting campaign:', campaignId);

      const campaign = await Campaign.findOne({ _id: campaignId, createdBy: userId });

      if (!campaign) {
        console.log('CommunicationService: Campaign not found for deletion:', campaignId);
        throw new Error('Campaign not found');
      }

      // Delete associated communications
      await Communication.deleteMany({ campaign: campaignId });

      // Delete campaign
      await Campaign.findByIdAndDelete(campaignId);

      console.log('CommunicationService: Campaign deleted successfully:', campaignId);
      return { success: true, message: 'Campaign deleted successfully' };
    } catch (error) {
      console.error('CommunicationService: Error deleting campaign:', error);
      throw error;
    }
  }

  // Get communications with filtering
  async getCommunications(userId, filters = {}) {
    try {
      console.log('CommunicationService: Fetching communications for user:', userId, 'with filters:', filters);

      const query = { sender: userId };

      // Apply filters
      if (filters.type && filters.type !== 'all') {
        query.type = filters.type;
      }

      if (filters.contactId) {
        query['recipient.email'] = filters.contactId;
      }

      const communications = await Communication.find(query)
        .populate('campaign', 'name')
        .populate('sender', 'firstName lastName')
        .sort({ createdAt: -1 });

      // Get unique contacts
      const contactsMap = new Map();
      communications.forEach(comm => {
        const key = comm.recipient.email;
        if (!contactsMap.has(key)) {
          contactsMap.set(key, {
            _id: key,
            name: comm.recipient.name,
            email: comm.recipient.email,
            company: comm.recipient.company || 'Unknown Company',
            lastMessage: comm.subject || comm.content.substring(0, 50),
            lastMessageTime: this.getTimeAgo(comm.createdAt),
            unreadCount: Math.floor(Math.random() * 3) // Mock unread count
          });
        }
      });

      const contacts = Array.from(contactsMap.values());

      // Format communications for frontend
      const formattedCommunications = communications.map(comm => ({
        _id: comm._id,
        type: comm.type,
        subject: comm.subject || 'No Subject',
        content: comm.content,
        recipient: {
          _id: comm.recipient.email,
          name: comm.recipient.name,
          email: comm.recipient.email,
          company: comm.recipient.company || 'Unknown Company'
        },
        rep: comm.sender ? `${comm.sender.firstName} ${comm.sender.lastName}` : 'Unknown',
        status: comm.status,
        timestamp: this.getTimeAgo(comm.createdAt),
        campaign: comm.campaign ? comm.campaign.name : null,
        recordingUrl: comm.recordingUrl,
        duration: comm.duration
      }));

      console.log('CommunicationService: Found', communications.length, 'communications and', contacts.length, 'contacts');

      return {
        communications: formattedCommunications,
        contacts
      };
    } catch (error) {
      console.error('CommunicationService: Error fetching communications:', error);
      throw error;
    }
  }

  // Send individual message
  async sendMessage(messageData, userId) {
    try {
      console.log('CommunicationService: Sending message:', messageData);

      const communication = new Communication({
        type: messageData.type,
        subject: messageData.subject,
        content: messageData.content,
        recipient: {
          email: messageData.recipient,
          name: messageData.recipientName || 'Unknown',
          phone: messageData.recipientPhone
        },
        sender: userId,
        status: 'sent',
        sentAt: new Date()
      });

      const savedCommunication = await communication.save();
      console.log('CommunicationService: Message sent successfully with ID:', savedCommunication._id);

      return {
        success: true,
        message: 'Message sent successfully',
        messageId: savedCommunication._id
      };
    } catch (error) {
      console.error('CommunicationService: Error sending message:', error);
      throw error;
    }
  }

  // Helper method to format time
  getTimeAgo(date) {
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

module.exports = new CommunicationService();