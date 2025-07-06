// Vercel serverless function for applications
const mongoose = require('mongoose');

// MongoDB connection
let cachedConnection = null;

const connectToDatabase = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  const connection = await mongoose.connect('mongodb+srv://buildoutinc:Salvation44@cluster0.n38cuxk.mongodb.net/HumeJourney');
  cachedConnection = connection;
  return connection;
};

// Application model
const applicationSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  companyName: { type: String, required: true, trim: true },
  businessType: { 
    type: String, 
    required: true, 
    enum: ['diabetic', 'wellness', 'longevity', 'glp1', 'telehealth', 'affiliate', 'wholesale', 'other'] 
  },
  yearsInBusiness: { 
    type: String, 
    required: true, 
    enum: ['0-1', '2-5', '6-10', '11-20', '20+'] 
  },
  mainChallenges: { type: String, required: true, trim: true },
  goals: { type: String, required: true, trim: true },
  timeline: { 
    type: String, 
    required: true, 
    enum: ['immediate', '1-3months', '3-6months', '6months+', 'exploring'] 
  },
  applicationType: { 
    type: String, 
    default: 'clinical', 
    enum: ['clinical', 'affiliate', 'wholesale'] 
  },
  status: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'under_review', 'approved', 'rejected', 'scheduled'] 
  }
}, { 
  timestamps: true 
});

// Get or create model (handle recompilation in serverless)
const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

module.exports = async function handler(req, res) {
  console.log('=== VERCEL FUNCTION: Applications handler ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Body:', JSON.stringify(req.body, null, 2));

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Connect to database
    await connectToDatabase();
    console.log('Database connected successfully');

    if (req.method === 'POST') {
      console.log('=== PROCESSING APPLICATION SUBMISSION ===');
      
      // Extract data from nested structure
      const { personalInfo = {}, businessInfo = {}, requirements = {}, applicationType = 'clinical' } = req.body;
      
      const {
        firstName,
        lastName,
        email,
        phone
      } = personalInfo;

      const {
        companyName,
        businessType,
        yearsInBusiness = '2-5'
      } = businessInfo;

      const {
        currentChallenges: mainChallenges,
        primaryGoals,
        timeline
      } = requirements;

      // Convert primaryGoals array to goals string
      const goals = Array.isArray(primaryGoals) ? primaryGoals.join(', ') : primaryGoals || '';

      console.log('=== VALIDATION ===');
      console.log('Data extracted:', { firstName, lastName, email, phone, companyName, businessType, mainChallenges, goals, timeline });

      // Validate required fields
      if (!firstName || !lastName || !email || !phone || !companyName || !businessType || !mainChallenges || !goals || !timeline) {
        console.log('Missing required fields');
        return res.status(400).json({
          success: false,
          error: 'Missing required fields. Please fill in all required information.',
          errorType: 'VALIDATION_ERROR'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('Invalid email format:', email);
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid email address.',
          errorType: 'VALIDATION_ERROR'
        });
      }

      // Check for duplicate
      const existingApplication = await Application.findOne({
        email,
        applicationType
      });

      if (existingApplication) {
        console.log('Duplicate application found for email:', email);
        return res.status(409).json({
          success: false,
          error: 'An application with this email already exists for this application type',
          errorType: 'DUPLICATE_APPLICATION'
        });
      }

      // Create application
      const applicationData = {
        applicationType,
        firstName,
        lastName,
        email,
        phone,
        companyName,
        businessType,
        yearsInBusiness,
        mainChallenges,
        goals,
        timeline
      };

      console.log('Creating application with data:', applicationData);
      const application = new Application(applicationData);
      await application.save();

      console.log('=== APPLICATION CREATED SUCCESSFULLY ===');
      console.log('Application ID:', application._id);

      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: {
          applicationId: application._id,
          status: application.status,
          submittedAt: application.createdAt
        }
      });

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        errorType: 'METHOD_NOT_ALLOWED'
      });
    }

  } catch (error) {
    console.error('=== VERCEL FUNCTION ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: `Validation error: ${validationErrors.join(', ')}`,
        errorType: 'VALIDATION_ERROR',
        fields: validationErrors
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to submit application. Please try again.',
      errorType: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
}