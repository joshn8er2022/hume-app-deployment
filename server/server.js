const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

console.log('=== SERVER INITIALIZATION START ===');

// Connect to database
console.log('=== CONNECTING TO DATABASE ===');
connectDB().catch(error => {
  console.error('=== DATABASE CONNECTION FAILED ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

// Middleware
console.log('=== SETTING UP MIDDLEWARE ===');

// Configure CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`=== ${req.method} ${req.path} ===`);
  console.log('Query params:', req.query);
  console.log('Body:', req.body);
  next();
});

// Routes with error handling
console.log('=== LOADING ROUTES ===');
try {
  app.use('/', require('./routes/index'));
  console.log('✓ Index routes loaded');
  
  app.use('/api/auth', require('./routes/authRoutes'));
  console.log('✓ Auth routes loaded');
  
  app.use('/api/users', require('./routes/userRoutes'));
  console.log('✓ User routes loaded');
  
  app.use('/api/seed', require('./routes/seedRoutes'));
  console.log('✓ Seed routes loaded');
  
  app.use('/api/analytics', require('./routes/analyticsRoutes'));
  console.log('✓ Analytics routes loaded');
  
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
  process.exit(1);
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

// 404 handler
app.use('*', (req, res) => {
  console.log('=== 404 NOT FOUND ===');
  console.log('Path:', req.originalUrl);
  console.log('Method:', req.method);

  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Process error handlers
process.on('uncaughtException', (error) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('=== UNHANDLED REJECTION ===');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
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
  process.exit(1);
});

module.exports = app;