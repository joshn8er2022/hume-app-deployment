console.log('=== APPLICATION SERVICE: Starting to load ===');

let Application;

try {
  console.log('=== APPLICATION SERVICE: Loading Application model ===');
  Application = require('../models/Application');
  console.log('=== APPLICATION SERVICE: Application model loaded successfully ===');
  console.log('Application model type:', typeof Application);
} catch (error) {
  console.error('=== APPLICATION SERVICE: ERROR loading Application model ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}

class ApplicationService {

  /**
   * Create a new application
   * @param {Object} applicationData - Application data
   * @returns {Promise<Object>} Created application
   */
  async createApplication(applicationData) {
    try {
      console.log('=== APPLICATION SERVICE: Creating new application ===');
      console.log('Application data received:', {
        email: applicationData.email,
        companyName: applicationData.companyName,
        businessType: applicationData.businessType,
        applicationType: applicationData.applicationType
      });
      console.log('Full application data:', JSON.stringify(applicationData, null, 2));

      // Check if application with same email already exists
      console.log('=== CHECKING FOR EXISTING APPLICATION ===');
      const existingApplication = await Application.findOne({
        email: applicationData.email,
        applicationType: applicationData.applicationType
      });

      if (existingApplication) {
        console.log('Duplicate application found for email:', applicationData.email);
        throw new Error('An application with this email already exists for this application type');
      }
      console.log('No existing application found, proceeding with creation');

      // Create new application
      console.log('=== CREATING NEW APPLICATION DOCUMENT ===');
      const application = new Application(applicationData);
      console.log('Application document created, about to save...');
      
      const savedApplication = await application.save();
      console.log('Application saved successfully to database');

      console.log('Application created successfully:', {
        id: savedApplication._id,
        email: savedApplication.email,
        status: savedApplication.status
      });

      return savedApplication;
    } catch (error) {
      console.error('=== APPLICATION SERVICE ERROR: Create application ===');
      console.error('Error type:', typeof error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      throw error;
    }
  }

  /**
   * Get application by ID
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object>} Application data
   */
  async getApplicationById(applicationId) {
    try {
      console.log('=== APPLICATION SERVICE: Getting application by ID ===');
      console.log('Application ID:', applicationId);

      const application = await Application.findById(applicationId)
        .populate('reviewedBy', 'firstName lastName email')
        .lean();

      if (!application) {
        console.log('Application not found with ID:', applicationId);
        throw new Error('Application not found');
      }

      console.log('Application found:', {
        id: application._id,
        email: application.email,
        status: application.status,
        createdAt: application.createdAt
      });

      return application;
    } catch (error) {
      console.error('=== APPLICATION SERVICE ERROR: Get application by ID ===');
      console.error('Error details:', error.message);
      throw error;
    }
  }

  /**
   * Get all applications with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Applications with pagination info
   */
  async getApplications(options = {}) {
    try {
      console.log('=== APPLICATION SERVICE: Getting applications ===');
      console.log('Query options:', options);

      const {
        page = 1,
        limit = 10,
        status,
        applicationType,
        businessType
      } = options;

      // Build query
      const query = {};
      if (status) query.status = status;
      if (applicationType) query.applicationType = applicationType;
      if (businessType) query.businessType = businessType;

      const skip = (page - 1) * limit;

      const [applications, total] = await Promise.all([
        Application.find(query)
          .populate('reviewedBy', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Application.countDocuments(query)
      ]);

      console.log(`Found ${applications.length} applications out of ${total} total`);

      return {
        applications,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      };
    } catch (error) {
      console.error('=== APPLICATION SERVICE ERROR: Get applications ===');
      console.error('Error details:', error.message);
      throw error;
    }
  }

  /**
   * Update application status
   * @param {string} applicationId - Application ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated application
   */
  async updateApplication(applicationId, updateData) {
    try {
      console.log('=== APPLICATION SERVICE: Updating application ===');
      console.log('Application ID:', applicationId);
      console.log('Update data:', updateData);

      const application = await Application.findByIdAndUpdate(
        applicationId,
        {
          ...updateData,
          ...(updateData.status && updateData.status !== 'pending' ? { reviewedAt: new Date() } : {})
        },
        { new: true, runValidators: true }
      ).populate('reviewedBy', 'firstName lastName email');

      if (!application) {
        throw new Error('Application not found');
      }

      console.log('Application updated successfully:', {
        id: application._id,
        status: application.status,
        reviewedAt: application.reviewedAt
      });

      return application;
    } catch (error) {
      console.error('=== APPLICATION SERVICE ERROR: Update application ===');
      console.error('Error details:', error.message);
      throw error;
    }
  }
}

console.log('=== APPLICATION SERVICE: Creating and exporting service ===');

// Create service instance
const applicationService = new ApplicationService();

// Log available methods
console.log('=== APPLICATION SERVICE: Service instance created successfully ===');
console.log('Service instance type:', typeof applicationService);
console.log('Service instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(applicationService)));
console.log('Available methods:', Object.getOwnPropertyNames(applicationService));

// Test that methods are callable
console.log('createApplication method exists:', typeof applicationService.createApplication === 'function');
console.log('getApplicationById method exists:', typeof applicationService.getApplicationById === 'function');

module.exports = applicationService;