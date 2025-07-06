const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const metrics = require('../utils/metrics');
const router = express.Router();

// Server metrics tracking
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
    applications: metrics.getMetrics(),
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      name: mongoose.connection.db ? mongoose.connection.db.databaseName : 'unknown'
    }
  });
});

// Catch-all handler: send back React's index.html file for client-side routing
router.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = router;
