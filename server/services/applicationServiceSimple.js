const Application = require('../models/Application');

console.log('=== SIMPLE APPLICATION SERVICE: Loading ===');

/**
 * Create a new application
 */
const createApplication = async (applicationData) => {
  try {
    console.log('=== SIMPLE SERVICE: Creating application ===');
    console.log('Application data:', JSON.stringify(applicationData, null, 2));

    // Check if application with same email already exists
    const existingApplication = await Application.findOne({
      email: applicationData.email,
      applicationType: applicationData.applicationType
    });

    if (existingApplication) {
      console.log('Duplicate application found for email:', applicationData.email);
      throw new Error('An application with this email already exists for this application type');
    }

    // Create new application
    const application = new Application(applicationData);
    await application.save();

    console.log('=== APPLICATION CREATED SUCCESSFULLY ===');
    console.log('Application ID:', application._id);
    
    return application;
  } catch (error) {
    console.error('=== SIMPLE SERVICE ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
};

/**
 * Get application by ID
 */
const getApplicationById = async (applicationId) => {
  try {
    console.log('=== SIMPLE SERVICE: Getting application by ID ===');
    console.log('Application ID:', applicationId);

    const application = await Application.findById(applicationId).populate('reviewedBy');
    
    if (!application) {
      throw new Error('Application not found');
    }

    return application;
  } catch (error) {
    console.error('=== SIMPLE SERVICE ERROR: Get by ID ===');
    console.error('Error:', error.message);
    throw error;
  }
};

/**
 * Update application
 */
const updateApplication = async (applicationId, updateData) => {
  try {
    console.log('=== SIMPLE SERVICE: Updating application ===');
    console.log('Application ID:', applicationId);
    console.log('Update data:', JSON.stringify(updateData, null, 2));

    const application = await Application.findByIdAndUpdate(
      applicationId,
      {
        ...updateData,
        reviewedAt: updateData.status ? new Date() : undefined
      },
      { new: true, runValidators: true }
    );

    if (!application) {
      throw new Error('Application not found');
    }

    return application;
  } catch (error) {
    console.error('=== SIMPLE SERVICE ERROR: Update ===');
    console.error('Error:', error.message);
    throw error;
  }
};

console.log('=== SIMPLE APPLICATION SERVICE: Exporting functions ===');

module.exports = {
  createApplication,
  getApplicationById,
  updateApplication
};