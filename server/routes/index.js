const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const router = express.Router();

// Application metrics tracking
let applicationSubmissionCount = 0;
let applicationErrors = 0;
let lastApplicationSubmission = null;
let serverStartTime = new Date();

// Root path response - serve React app
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

router.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : 'unknown';
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    
    // Calculate uptime
    const uptime = Date.now() - serverStartTime.getTime();
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: {
        milliseconds: uptime,
        human: `${Math.floor(uptime / 1000 / 60)} minutes`
      },
      database: {
        status: dbStatus,
        name: dbName,
        host: mongoose.connection.host || 'unknown'
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
      },
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    };
    
    res.status(200).json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// Metrics endpoint
router.get('/metrics', (req, res) => {
  const uptime = Date.now() - serverStartTime.getTime();
  
  res.json({
    server: {
      uptime: {
        milliseconds: uptime,
        human: `${Math.floor(uptime / 1000 / 60)} minutes`
      },
      startTime: serverStartTime.toISOString()
    },
    applications: {
      totalSubmissions: applicationSubmissionCount,
      totalErrors: applicationErrors,
      errorRate: applicationSubmissionCount > 0 ? 
        Math.round((applicationErrors / applicationSubmissionCount) * 100 * 100) / 100 : 0,
      lastSubmission: lastApplicationSubmission
    },
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      name: mongoose.connection.db ? mongoose.connection.db.databaseName : 'unknown'
    }
  });
});

// Function to increment application metrics (to be called from application routes)
const incrementApplicationSubmission = () => {
  applicationSubmissionCount++;
  lastApplicationSubmission = new Date().toISOString();
};

const incrementApplicationError = () => {
  applicationErrors++;
};

// Catch-all handler: send back React's index.html file for client-side routing
router.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = { 
  router, 
  incrementApplicationSubmission, 
  incrementApplicationError 
};
