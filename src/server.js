/**
 * Server Entry Point
 * 
 * This file is responsible for starting the HTTP server.
 * It loads environment variables, imports the Express app,
 * connects to MongoDB, and starts listening on the specified port.
 * 
 * Separation of app.js and server.js allows:
 * - Testing the Express app without starting the server
 * - Better separation of concerns
 * - Easier integration testing
 * 
 * Server Startup Flow:
 * 1. Load environment variables
 * 2. Connect to MongoDB
 * 3. Start Express server (only after successful DB connection)
 */

// Load environment variables from .env file
require('dotenv').config();

// Import the configured Express application
const app = require('./app');

// Import database connection function
const connectDB = require('./config/db');

// ======================
// Server Configuration
// ======================

// Get port from environment variables or use default
const PORT = process.env.PORT || 5000;

// Get environment
const NODE_ENV = process.env.NODE_ENV || 'development';

// ======================
// Initialize Application
// ======================

/**
 * Start the application
 * This function connects to MongoDB first, then starts the Express server
 * The server will only start if the database connection is successful
 */
const startServer = async () => {
  try {
    // Step 1: Connect to MongoDB
    await connectDB();

    // Step 2: Start Express server (only after successful DB connection)
    const server = app.listen(PORT, () => {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🏥 Digital Clinic Management System - API Server');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`📡 Server Status: RUNNING`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`🚀 Server URL: http://localhost:${PORT}`);
      console.log(`📋 API Version: ${process.env.API_VERSION || 'v1'}`);
      console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
      console.log('═══════════════════════════════════════════════════════');
      console.log('✅ Server is ready to accept requests');
      console.log('═══════════════════════════════════════════════════════\n');
    });

    // Setup graceful shutdown handlers
    setupGracefulShutdown(server);

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

/**
 * Setup graceful shutdown handlers
 * @param {Object} server - Express server instance
 */
const setupGracefulShutdown = (server) => {

  // ======================
  // Graceful Shutdown Handlers
  // ======================

  /**
   * Handle graceful shutdown on SIGTERM signal
   * This is important for proper cleanup when the server is stopped
   */
  process.on('SIGTERM', () => {
    console.log('\n⚠️  SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  });

  /**
   * Handle graceful shutdown on SIGINT signal (Ctrl+C)
   */
  process.on('SIGINT', () => {
    console.log('\n⚠️  SIGINT signal received: closing HTTP server');
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  });

  /**
   * Handle unhandled promise rejections
   * This prevents the app from crashing on unhandled async errors
   */
  process.on('unhandledRejection', (err) => {
    console.error('❌ UNHANDLED REJECTION! Shutting down...');
    console.error('Error:', err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });

  /**
   * Handle uncaught exceptions
   * This catches synchronous errors that weren't handled
   */
  process.on('uncaughtException', (err) => {
    console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
    console.error('Error:', err.name, err.message);
    process.exit(1);
  });
};

// ======================
// Start the Application
// ======================

// Start the server (connects to DB first, then starts Express)
startServer();

// Export for testing purposes
module.exports = { startServer };
