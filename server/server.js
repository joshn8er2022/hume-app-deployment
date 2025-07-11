const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

console.log('=== SERVER INITIALIZATION START ===');

// Startup timeout protection for Railway's 60-second limit
const startupTimer = setTimeout(() => {
  console.error('=== STARTUP TIMEOUT WARNING ===');
  console.error('Server has not started within 45 seconds');
  console.error('This may cause Railway to terminate the deployment');
}, 45000);

// Connect to database (async, but don't delay server startup)
console.log('=== CONNECTING TO DATABASE ===');
connectDB().then(async () => {
  console.log('=== DATABASE CONNECTION SUCCESS ===');
  
  // Fix database indexes first
  try {
    const { fixDatabaseIndexes } = require('./utils/fixIndexes');
    await fixDatabaseIndexes();
  } catch (indexError) {
    console.error('=== INDEX FIX ERROR ===');
    console.error('Error:', indexError.message);
    console.error('=== CONTINUING WITH EXISTING INDEXES ===');
  }
  
  // Initialize default form configurations - CRITICAL FOR APPLICATION SUBMISSION
  try {
    console.log('=== INITIALIZING DEFAULT FORMS (REQUIRED FOR APP SUBMISSION) ===');
    const { initializeDefaultForms } = require('./utils/initializeDefaultForms');
    await initializeDefaultForms();
    console.log('=== DEFAULT FORMS INITIALIZATION COMPLETED ===');
    
    // Verify forms were created successfully
    const FormConfiguration = require('./models/FormConfiguration');
    const clinicalForm = await FormConfiguration.getActiveFormByType('clinical');
    const affiliateForm = await FormConfiguration.getActiveFormByType('affiliate');
    const wholesaleForm = await FormConfiguration.getActiveFormByType('wholesale');
    
    console.log('=== FORM INITIALIZATION VERIFICATION ===');
    console.log(`Clinical form: ${clinicalForm ? '✓ Available' : '❌ Missing'}`);
    console.log(`Affiliate form: ${affiliateForm ? '✓ Available' : '❌ Missing'}`);
    console.log(`Wholesale form: ${wholesaleForm ? '✓ Available' : '❌ Missing'}`);
    
    if (clinicalForm) {
      console.log(`Clinical form fields: ${clinicalForm.fields.length} total, ${clinicalForm.fields.filter(f => f.required).length} required`);
    }
    
  } catch (initError) {
    console.error('=== CRITICAL: DEFAULT FORMS INITIALIZATION FAILED ===');
    console.error('Error:', initError.message);
    console.error('Stack:', initError.stack);
    console.error('=== APPLICATION SUBMISSION WILL FAIL WITHOUT FORMS ===');
    
    // Try to continue but warn that app submission won't work
    console.error('=== SERVER WILL START BUT APPLICATION FORMS WILL NOT WORK ===');
  }
}).catch(error => {
  console.error('=== DATABASE CONNECTION FAILED ===');
  console.error('Error:', error.message);
  console.error('=== SERVER WILL CONTINUE BUT DATABASE OPERATIONS WILL FAIL ===');
});

// Middleware
console.log('=== SETTING UP MIDDLEWARE ===');

// Configure CORS
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4000',
    process.env.CORS_ORIGIN,
    /\.vercel\.app$/,
    /\.railway\.app$/,
    /\.use\.devtunnels\.ms$/
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files with cache control
const path = require('path');
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    // Cache HTML files for minimal time to ensure updates are picked up quickly
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    // Cache JS and CSS files but allow updates
    else if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
    }
  }
}));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`=== ${req.method} ${req.path} ===`);
  if (req.path.startsWith('/assets/')) {
    console.log('Asset request for:', req.path);
  }
  if (req.path.startsWith('/api/')) {
    console.log('API request:', req.method, req.path);
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check endpoint (no database required)
app.get('/health', async (req, res) => {
  try {
    // Basic health check
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 4000,
      environment: process.env.NODE_ENV || 'development',
      version: 'v1.2-validation-fix'
    };
    
    // Check form configurations if database is available
    try {
      const FormConfiguration = require('./models/FormConfiguration');
      const formCounts = await FormConfiguration.countDocuments({ isActive: true });
      healthData.formConfigurations = {
        totalActive: formCounts,
        status: formCounts > 0 ? 'available' : 'missing'
      };
      
      // Check specific application types
      const clinicalForm = await FormConfiguration.getActiveFormByType('clinical');
      const affiliateForm = await FormConfiguration.getActiveFormByType('affiliate');
      const wholesaleForm = await FormConfiguration.getActiveFormByType('wholesale');
      
      healthData.applicationTypes = {
        clinical: clinicalForm ? 'available' : 'missing',
        affiliate: affiliateForm ? 'available' : 'missing',
        wholesale: wholesaleForm ? 'available' : 'missing'
      };
    } catch (dbError) {
      healthData.formConfigurations = {
        status: 'database_error',
        error: dbError.message
      };
    }
    
    res.json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Debug endpoint to check client build version
app.get('/debug/client-version', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  try {
    const publicDir = path.join(__dirname, 'public');
    const files = fs.readdirSync(path.join(publicDir, 'assets'));
    const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
    res.json({
      timestamp: new Date().toISOString(),
      assetsFiles: files,
      htmlContent: html,
      publicDirExists: fs.existsSync(publicDir)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes with error handling
console.log('=== LOADING ROUTES ===');
try {
  console.log('=== LOADING: index routes ===');
  app.use('/', require('./routes/index'));
  console.log('✓ Index routes loaded');
  
  console.log('=== LOADING: auth routes ===');
  app.use('/api/auth', require('./routes/authRoutes'));
  console.log('✓ Auth routes loaded');
  
  console.log('=== LOADING: user routes ===');
  app.use('/api/users', require('./routes/userRoutes'));
  console.log('✓ User routes loaded');
  
  app.use('/api/seed', require('./routes/seedRoutes'));
  console.log('✓ Seed routes loaded');
  
  console.log('=== LOADING: analytics routes ===');
  app.use('/api/analytics', require('./routes/analyticsRoutes'));
  console.log('✓ Analytics routes loaded');
  
  console.log('=== LOADING: form configuration routes ===');
  app.use('/api/admin/forms', require('./routes/formConfigurationRoutes'));
  console.log('✓ Form configuration routes loaded');
  
  app.use('/api/applications', require('./routes/applicationRoutes'));
  console.log('✓ Application routes loaded');
  
  app.use('/api/leads', require('./routes/leadRoutes'));
  console.log('✓ Lead routes loaded');
  
  app.use('/api/communications', require('./routes/communicationRoutes'));
  console.log('✓ Communication routes loaded');
  
  app.use('/api/dashboard', require('./routes/dashboardRoutes'));
  console.log('✓ Dashboard routes loaded');
} catch (error) {
  console.error('=== ROUTE LOADING ERROR ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  console.error('=== CONTINUING WITH BASIC ROUTES ONLY ===');
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('=== GLOBAL ERROR HANDLER ===');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request Method:', req.method);
  console.error('Request Body:', req.body);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Serve React app for any non-API routes
app.get('*', (req, res) => {
  // Don't serve React app for API routes
  if (req.path.startsWith('/api/')) {
    console.log('=== 404 API NOT FOUND ===');
    console.log('Path:', req.originalUrl);
    console.log('Method:', req.method);

    return res.status(404).json({
      success: false,
      message: 'API route not found'
    });
  }

  // Serve React app for all other routes
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Process error handlers
process.on('uncaughtException', (error) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  console.error('=== CONTINUING AFTER UNCAUGHT EXCEPTION ===');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('=== UNHANDLED REJECTION ===');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  console.error('=== CONTINUING AFTER UNHANDLED REJECTION ===');
});

// Railway sets PORT automatically, fallback to 4000 for local development
const PORT = process.env.PORT || process.env.RAILWAY_PORT || 4000;
console.log(`=== PORT CONFIGURATION ===`);
console.log(`Environment PORT: ${process.env.PORT}`);
console.log(`Railway PORT: ${process.env.RAILWAY_PORT}`);
console.log(`Using PORT: ${PORT}`);

app.listen(PORT, () => {
  // Clear startup timeout timer - server started successfully
  clearTimeout(startupTimer);
  
  console.log('=== SERVER STARTED SUCCESSFULLY ===');
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=== ROUTES REGISTERED ===');
  console.log('- GET  / (Home)');
  console.log('- POST /api/auth/register');
  console.log('- POST /api/auth/login');
  console.log('- POST /api/auth/refresh');
  console.log('- POST /api/auth/logout');
  console.log('- GET  /api/auth/me');
  console.log('- GET  /api/users/me');
  console.log('- PUT  /api/users/me');
  console.log('- GET  /api/users/profile (deprecated)');
  console.log('- PUT  /api/users/profile (deprecated)');
  console.log('- POST /api/seed/admin');
  console.log('- POST /api/seed/data');
  console.log('- GET  /api/seed/status');
  console.log('- POST /api/analytics/page-views');
  console.log('- POST /api/analytics/conversions');
  console.log('- GET  /api/analytics/landing-pages/:id');
  console.log('- GET  /api/analytics');
  console.log('- GET  /api/analytics/active-users');
  console.log('- GET  /api/analytics/funnel');
  console.log('- GET  /api/analytics/performance');
  console.log('- POST /api/applications');
  console.log('- GET  /api/applications/:id');
  console.log('- GET  /api/leads');
  console.log('- POST /api/leads');
  console.log('- GET  /api/leads/:id');
  console.log('- PUT  /api/leads/:id');
  console.log('- DELETE /api/leads/:id');
  console.log('- POST /api/leads/:id/notes');
  console.log('- GET  /api/communications');
  console.log('- POST /api/communications/send');
  console.log('- POST /api/communications/campaigns');
  console.log('- GET  /api/communications/campaigns');
  console.log('- GET  /api/communications/campaigns/:id/stats');
  console.log('- DELETE /api/communications/campaigns/:id');
  console.log('- GET  /api/dashboard/stats');
  console.log('- GET  /api/dashboard/activity');
  console.log('=== SERVER READY ===');
}).on('error', (error) => {
  console.error('=== SERVER START ERROR ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  console.error('=== SERVER WILL RETRY ON DIFFERENT PORT ===');
});

module.exports = app;