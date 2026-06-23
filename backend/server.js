/**
 * BSCRI Backend Server
 * Botswana Supply Chain Readiness Index
 * 
 * Copyright © 2026 Supply Chain Circle (SCC)
 * All rights reserved.
 * 
 * This file is the main entry point for the BSCRI backend API.
 * It initializes the Express server, establishes database connectivity,
 * registers API routes, and manages application lifecycle.
 * 
 * @version 1.0.0
 * @author Supply Chain Circle (SCC)
 */

// ============================================================
// Dependencies
// ============================================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// ============================================================
// Application Configuration
// ============================================================

const app = express();
const PORT = process.env.PORT || 5000;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

// ============================================================
// Database Connection
// ============================================================

const { initializeDatabase } = require('./config/database');

// ============================================================
// CORS Configuration
// ============================================================

const allowedOrigins = [
  'https://bscri1.netlify.app',
  'https://bscri1.vercel.app',
  'https://bscri1-production.up.railway.app',
  process.env.FRONTEND_URL
].filter(Boolean);

const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

console.log('Allowed CORS origins:', uniqueAllowedOrigins);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      console.log('Allowed CORS request with no origin header');
      return callback(null, true);
    }

    if (uniqueAllowedOrigins.includes(origin)) {
      console.log('Allowed CORS request:', { origin });
      return callback(null, true);
    }

    console.warn('Blocked CORS request:', {
      origin,
      allowedOrigins: uniqueAllowedOrigins
    });

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true
};

if (!process.env.FRONTEND_URL) {
  console.warn('FRONTEND_URL environment variable is not set. Using explicit production CORS defaults.');
}

app.use(cors(corsOptions));

// ============================================================
// Request Parsing Middleware
// ============================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Invalid JSON request body:', {
      message: err.message,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });

    return res.status(400).json({
      success: false,
      error: 'Invalid JSON request body',
      timestamp: new Date().toISOString()
    });
  }

  return next(err);
});

// ============================================================
// Static File Serving
// ============================================================

app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================================
// Request Logging (Development Only)
// ============================================================

if (ENVIRONMENT === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url} - ${req.ip}`);
    next();
  });
}

// ============================================================
// API Routes
// ============================================================

// Public assessment routes
app.use('/api/assessment', require('./routes/assessment'));

// Protected admin routes
app.use('/api/admin', require('./routes/admin'));

// ============================================================
// Health Check Endpoint
// ============================================================

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.status(200).json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: ENVIRONMENT,
    version: '1.0.0',
    database: {
      state: dbStatus[dbState] || 'unknown',
      connected: dbState === 1
    }
  });
});

// ============================================================
// Frontend Routes
// ============================================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// ============================================================
// 404 Handler
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Resource not found',
    message: `The requested endpoint ${req.method} ${req.url} does not exist`,
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// Global Error Handler
// ============================================================

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  const response = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  if (ENVIRONMENT === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

// ============================================================
// Graceful Shutdown Handlers
// ============================================================

const { closeDatabase } = require('./config/database');

const shutdown = () => {
  console.log('Received shutdown signal. Closing connections gracefully...');

  closeDatabase()
    .then(() => {
      console.log('Database connection closed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error(`Error during shutdown: ${error.message}`);
      process.exit(1);
    });

  // Force shutdown after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ============================================================
// Unhandled Exception Handlers
// ============================================================

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// ============================================================
// Server Initialization
// ============================================================

const startServer = async () => {
  try {
    // Establish database connection
    await initializeDatabase();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
      console.log(`Environment: ${ENVIRONMENT}`);
      console.log(`API base URL: http://localhost:${PORT}/api`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

// ============================================================
// Start Application
// ============================================================

startServer();
