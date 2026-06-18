/**
 * BSCRI Database Configuration
 * Botswana Supply Chain Readiness Index
 * 
 * Copyright © 2026 Supply Chain Circle (SCC)
 * All rights reserved.
 * 
 * This module handles the MongoDB database connection for the BSCRI platform.
 * It establishes the connection, manages connection events, and provides
 * reconnection logic for production reliability.
 * 
 * @version 1.0.0
 * @author Supply Chain Circle (SCC)
 */

// ============================================================
// Dependencies
// ============================================================

const mongoose = require('mongoose');

// ============================================================
// Connection Configuration
// ============================================================

const MONGODB_URI = process.env.MONGODB_URI;
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const CONNECTION_TIMEOUT = 30000; // 30 seconds
const RECONNECTION_INTERVAL = 5000; // 5 seconds

// ============================================================
// Validation
// ============================================================

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not defined.');
  console.error('Please set MONGODB_URI in your .env file.');
  process.exit(1);
}

// ============================================================
// Connection Options
// ============================================================

const connectionOptions = {
  // Modern Mongoose uses these defaults; no deprecated options needed
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: CONNECTION_TIMEOUT,
  family: 4 // Use IPv4
};

// ============================================================
// Database Connection Function
// ============================================================

const connectDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI, connectionOptions);
    
    const connection = mongoose.connection;
    const host = connection.host;
    const database = connection.name;
    const port = connection.port;
    
    console.log(`MongoDB connected successfully`);
    console.log(`  Host: ${host}`);
    console.log(`  Database: ${database}`);
    console.log(`  Port: ${port}`);
    console.log(`  Environment: ${ENVIRONMENT}`);
    
    return connection;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.error(`URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
    throw error;
  }
};

// ============================================================
// Connection Event Handlers
// ============================================================

const setupConnectionHandlers = () => {
  const connection = mongoose.connection;

  connection.on('connected', () => {
    console.log('MongoDB connection established');
  });

  connection.on('error', (error) => {
    console.error(`MongoDB connection error: ${error.message}`);
  });

  connection.on('disconnected', () => {
    console.warn('MongoDB connection disconnected. Attempting to reconnect...');
  });

  connection.on('reconnected', () => {
    console.log('MongoDB reconnection successful');
  });

  connection.on('close', () => {
    console.log('MongoDB connection closed');
  });
};

// ============================================================
// Graceful Connection Closure
// ============================================================

const closeDatabase = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed gracefully');
  } catch (error) {
    console.error(`Error closing MongoDB connection: ${error.message}`);
    throw error;
  }
};

// ============================================================
// Reconnection Handling
// ============================================================

const enableReconnection = () => {
  const connection = mongoose.connection;

  // Attempt to reconnect on disconnection
  connection.on('disconnected', () => {
    setTimeout(async () => {
      try {
        await connectDatabase();
        console.log('MongoDB reconnection attempt successful');
      } catch (error) {
        console.error(`MongoDB reconnection attempt failed: ${error.message}`);
        // Retry after interval
        setTimeout(enableReconnection, RECONNECTION_INTERVAL);
      }
    }, RECONNECTION_INTERVAL);
  });
};

// ============================================================
// Initial Setup
// ============================================================

const initializeDatabase = async () => {
  // Set up connection event handlers
  setupConnectionHandlers();
  
  // Enable automatic reconnection
  enableReconnection();
  
  // Establish connection
  await connectDatabase();
  
  return mongoose.connection;
};

// ============================================================
// Module Exports
// ============================================================

module.exports = {
  connectDatabase,
  closeDatabase,
  initializeDatabase,
  getConnection: () => mongoose.connection,
  isConnected: () => mongoose.connection.readyState === 1
};

// ============================================================
// Default Export
// ============================================================

module.exports.default = initializeDatabase;
