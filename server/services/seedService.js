const User = require('../models/User');
const Lead = require('../models/Lead');
const Application = require('../models/Application');
const Communication = require('../models/Communication');
const { generatePasswordHash } = require('../utils/password');

/**
 * Create initial admin user
 */
const createAdminUser = async () => {
  try {
    console.log('=== CREATE ADMIN USER START ===');
    console.log('Checking for existing admin user...');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('=== ADMIN USER ALREADY EXISTS ===');
      console.log('Admin user found:', existingAdmin.email);
      return { success: true, message: 'Admin user already exists', user: existingAdmin };
    }

    console.log('Admin user not found, creating new admin user...');
    console.log('Generating password hash...');
    
    // Create admin user
    const hashedPassword = await generatePasswordHash('admin123');
    console.log('Password hash generated successfully');
    
    const adminUserData = {
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      companyName: 'Hume Connect',
      subscriptionStatus: 'active',
      phone: '+1-555-0100',
      isActive: true,
    };
    
    console.log('Creating admin user with data:', { ...adminUserData, password: '[HIDDEN]' });
    
    const adminUser = new User(adminUserData);
    await adminUser.save();
    
    console.log('=== ADMIN USER CREATED SUCCESSFULLY ===');
    console.log('Admin user created:', adminUser.email);
    console.log('Admin user ID:', adminUser._id);

    return {
      success: true,
      message: 'Admin user created successfully',
      user: adminUser
    };
  } catch (error) {
    console.error('=== CREATE ADMIN USER ERROR ===');
    console.error('Error creating admin user:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to create admin user: ${error.message}`);
  }
};

/**
 * Create sample test data
 */
const createTestData = async () => {
  try {
    console.log('=== CREATE TEST DATA START ===');
    console.log('Starting test data creation...');

    // Get admin user for references
    console.log('Looking for admin user...');
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    if (!adminUser) {
      console.error('=== ADMIN USER NOT FOUND ===');
      throw new Error('Admin user not found. Please seed admin user first.');
    }
    console.log('Admin user found:', adminUser.email, 'ID:', adminUser._id);

    // Create sample users
    console.log('Creating sample users...');
    const sampleUsers = await createSampleUsers();
    console.log(`=== SAMPLE USERS CREATED: ${sampleUsers.length} ===`);

    // Create sample leads
    console.log('Creating sample leads...');
    const sampleLeads = await createSampleLeads(adminUser._id);
    console.log(`=== SAMPLE LEADS CREATED: ${sampleLeads.length} ===`);

    // Create sample applications
    console.log('Creating sample applications...');
    const sampleApplications = await createSampleApplications(adminUser._id);
    console.log(`=== SAMPLE APPLICATIONS CREATED: ${sampleApplications.length} ===`);

    // Create sample communications
    console.log('Creating sample communications...');
    const sampleCommunications = await createSampleCommunications(adminUser._id);
    console.log(`=== SAMPLE COMMUNICATIONS CREATED: ${sampleCommunications.length} ===`);

    console.log('=== TEST DATA CREATION COMPLETE ===');
    
    return {
      success: true,
      message: 'Test data created successfully',
      data: {
        users: sampleUsers.length,
        leads: sampleLeads.length,
        applications: sampleApplications.length,
        communications: sampleCommunications.length,
      }
    };
  } catch (error) {
    console.error('=== CREATE TEST DATA ERROR ===');
    console.error('Error creating test data:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to create test data: ${error.message}`);
  }
};

/**
 * Create sample users
 */
const createSampleUsers = async () => {
  console.log('=== CREATE SAMPLE USERS START ===');
  const users = [];
  const sampleUserData = [
    {
      email: 'clinic1@example.com',
      password: 'password123',
      role: 'clinic',
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      companyName: 'Johnson Wellness Clinic',
      subscriptionStatus: 'active',
      phone: '+1-555-0101',
    },
    {
      email: 'clinic2@example.com',
      password: 'password123',
      role: 'clinic',
      firstName: 'Dr. Michael',
      lastName: 'Chen',
      companyName: 'Chen Diabetes Center',
      subscriptionStatus: 'trial',
      phone: '+1-555-0102',
    },
    {
      email: 'affiliate1@example.com',
      password: 'password123',
      role: 'affiliate',
      firstName: 'Jessica',
      lastName: 'Williams',
      companyName: 'Williams Health Partners',
      subscriptionStatus: 'active',
      phone: '+1-555-0103',
    },
    {
      email: 'wholesale1@example.com',
      password: 'password123',
      role: 'wholesale',
      firstName: 'Robert',
      lastName: 'Davis',
      companyName: 'Davis Medical Supply',
      subscriptionStatus: 'active',
      phone: '+1-555-0104',
    },
  ];

  for (const userData of sampleUserData) {
    console.log(`Checking for existing user: ${userData.email}`);
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (!existingUser) {
      console.log(`Creating user: ${userData.email}`);
      const hashedPassword = await generatePasswordHash(userData.password);
      const user = new User({
        ...userData,
        password: hashedPassword,
      });
      await user.save();
      users.push(user);
      console.log(`User created successfully: ${userData.email}`);
    } else {
      console.log(`User already exists: ${userData.email}`);
    }
  }

  console.log(`=== SAMPLE USERS COMPLETE: ${users.length} new users ===`);
  return users;
};

/**
 * Create sample leads
 */
const createSampleLeads = async (adminUserId) => {
  console.log('=== CREATE SAMPLE LEADS START ===');
  console.log('Admin User ID for leads:', adminUserId);
  
  const leads = [];
  const sampleLeadData = [
    {
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.rodriguez@healthclinic.com',
      phone: '+1-555-0201',
      companyName: 'Rodriguez Health Clinic',
      businessType: 'wellness',
      status: 'new',
      score: 85,
      source: 'website',
      assignedTo: adminUserId,
    },
    {
      firstName: 'David',
      lastName: 'Thompson',
      email: 'david.thompson@diabetescare.com',
      phone: '+1-555-0202',
      companyName: 'Thompson Diabetes Care',
      businessType: 'diabetic',
      status: 'contacted',
      score: 92,
      source: 'referral',
      assignedTo: adminUserId,
    },
    {
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.anderson@longevitymed.com',
      phone: '+1-555-0203',
      companyName: 'Anderson Longevity Medicine',
      businessType: 'longevity',
      status: 'qualified',
      score: 78,
      source: 'social',
      assignedTo: adminUserId,
    },
    {
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.wilson@telehealth.com',
      phone: '+1-555-0204',
      companyName: 'Wilson Telehealth Solutions',
      businessType: 'telehealth',
      status: 'proposal',
      score: 88,
      source: 'email',
      assignedTo: adminUserId,
    },
    {
      firstName: 'Maria',
      lastName: 'Garcia',
      email: 'maria.garcia@glp1clinic.com',
      phone: '+1-555-0205',
      companyName: 'Garcia GLP-1 Clinic',
      businessType: 'glp1',
      status: 'closed-won',
      score: 95,
      source: 'website',
      assignedTo: adminUserId,
    },
  ];

  for (const leadData of sampleLeadData) {
    console.log(`Checking for existing lead: ${leadData.email}`);
    // Check if lead already exists
    const existingLead = await Lead.findOne({ email: leadData.email });
    if (!existingLead) {
      console.log(`Creating lead: ${leadData.email}`);
      const lead = new Lead({
        ...leadData,
        notes: [
          {
            content: 'Initial contact made via website form submission.',
            createdBy: adminUserId,
          }
        ]
      });
      await lead.save();
      leads.push(lead);
      console.log(`Lead created successfully: ${leadData.email}`);
    } else {
      console.log(`Lead already exists: ${leadData.email}`);
    }
  }

  console.log(`=== SAMPLE LEADS COMPLETE: ${leads.length} new leads ===`);
  return leads;
};

/**
 * Create sample applications
 */
const createSampleApplications = async (adminUserId) => {
  console.log('=== CREATE SAMPLE APPLICATIONS START ===');
  console.log('Admin User ID for applications:', adminUserId);
  
  const applications = [];
  const sampleApplicationData = [
    {
      firstName: 'Dr. Amanda',
      lastName: 'Brown',
      email: 'amanda.brown@brownwellness.com',
      phone: '+1-555-0301',
      companyName: 'Brown Wellness Center',
      businessType: 'wellness',
      yearsInBusiness: '6-10',
      applicationType: 'clinical',
      currentSolutions: 'Basic EMR system, manual patient tracking',
      mainChallenges: 'Need better patient engagement and monitoring tools',
      goals: 'Improve patient outcomes and increase retention',
      timeline: '1-3months',
      budget: '15k-50k',
      status: 'pending',
    },
    {
      firstName: 'Dr. Kevin',
      lastName: 'Lee',
      email: 'kevin.lee@leediabetes.com',
      phone: '+1-555-0302',
      companyName: 'Lee Diabetes Specialists',
      businessType: 'diabetic',
      yearsInBusiness: '11-20',
      applicationType: 'clinical',
      currentSolutions: 'CGM monitoring, basic analytics',
      mainChallenges: 'Data integration and real-time monitoring',
      goals: 'Reduce HbA1c levels across patient population',
      timeline: 'immediate',
      budget: '50k+',
      status: 'approved',
      reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      reviewedBy: adminUserId,
    },
    {
      firstName: 'Dr. Rachel',
      lastName: 'Taylor',
      email: 'rachel.taylor@taylorlongevity.com',
      phone: '+1-555-0303',
      companyName: 'Taylor Longevity Institute',
      businessType: 'longevity',
      yearsInBusiness: '2-5',
      applicationType: 'clinical',
      currentSolutions: 'Custom lab tracking, lifestyle coaching',
      mainChallenges: 'Comprehensive biomarker analysis and trends',
      goals: 'Optimize healthspan for high-net-worth clients',
      timeline: '3-6months',
      budget: '15k-50k',
      status: 'scheduled',
      scheduledCallDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      reviewedBy: adminUserId,
    },
  ];

  for (const appData of sampleApplicationData) {
    console.log(`Checking for existing application: ${appData.email}`);
    // Check if application already exists
    const existingApp = await Application.findOne({ email: appData.email });
    if (!existingApp) {
      console.log(`Creating application: ${appData.email}`);
      const application = new Application(appData);
      await application.save();
      applications.push(application);
      console.log(`Application created successfully: ${appData.email}`);
    } else {
      console.log(`Application already exists: ${appData.email}`);
    }
  }

  console.log(`=== SAMPLE APPLICATIONS COMPLETE: ${applications.length} new applications ===`);
  return applications;
};

/**
 * Create sample communications
 */
const createSampleCommunications = async (adminUserId) => {
  console.log('=== CREATE SAMPLE COMMUNICATIONS START ===');
  console.log('Admin User ID for communications:', adminUserId);
  
  const communications = [];
  const sampleCommData = [
    {
      type: 'email',
      subject: 'Welcome to Hume Connect - Next Steps',
      content: 'Thank you for your interest in Hume Connect. We\'re excited to help you transform your patient care experience.',
      recipient: {
        email: 'emily.rodriguez@healthclinic.com',
        name: 'Emily Rodriguez',
        phone: '+1-555-0201',
      },
      sender: adminUserId,
      status: 'sent',
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      campaign: 'Welcome Series',
      tags: ['welcome', 'onboarding'],
    },
    {
      type: 'email',
      subject: 'Your Hume Connect Application Status',
      content: 'Great news! Your application has been approved. Let\'s schedule a call to discuss implementation.',
      recipient: {
        email: 'kevin.lee@leediabetes.com',
        name: 'Dr. Kevin Lee',
        phone: '+1-555-0302',
      },
      sender: adminUserId,
      status: 'opened',
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      openedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000), // 1.5 days ago
      campaign: 'Application Follow-up',
      tags: ['approved', 'follow-up'],
    },
    {
      type: 'sms',
      content: 'Hi Dr. Taylor, this is a reminder about your scheduled call tomorrow at 2 PM EST. Looking forward to speaking with you!',
      recipient: {
        email: 'rachel.taylor@taylorlongevity.com',
        name: 'Dr. Rachel Taylor',
        phone: '+1-555-0303',
      },
      sender: adminUserId,
      status: 'delivered',
      sentAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000), // 12 hours ago
      campaign: 'Call Reminders',
      tags: ['reminder', 'scheduled-call'],
    },
    {
      type: 'email',
      subject: 'Case Study: How Similar Clinics Increased Revenue by 40%',
      content: 'Based on your interest in our platform, I thought you\'d find this case study relevant to your practice.',
      recipient: {
        email: 'david.thompson@diabetescare.com',
        name: 'David Thompson',
        phone: '+1-555-0202',
      },
      sender: adminUserId,
      status: 'clicked',
      sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      openedAt: new Date(Date.now() - 2.8 * 24 * 60 * 60 * 1000),
      clickedAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000),
      campaign: 'Nurture Sequence',
      tags: ['case-study', 'nurture'],
    },
  ];

  for (const commData of sampleCommData) {
    console.log(`Checking for existing communication: ${commData.recipient.email}`);
    // Check if communication already exists
    const existingComm = await Communication.findOne({
      'recipient.email': commData.recipient.email,
      subject: commData.subject || commData.content.substring(0, 50)
    });
    if (!existingComm) {
      console.log(`Creating communication for: ${commData.recipient.email}`);
      const communication = new Communication(commData);
      await communication.save();
      communications.push(communication);
      console.log(`Communication created successfully for: ${commData.recipient.email}`);
    } else {
      console.log(`Communication already exists for: ${commData.recipient.email}`);
    }
  }

  console.log(`=== SAMPLE COMMUNICATIONS COMPLETE: ${communications.length} new communications ===`);
  return communications;
};

module.exports = {
  createAdminUser,
  createTestData,
};