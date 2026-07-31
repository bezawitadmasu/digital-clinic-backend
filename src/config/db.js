/**
 * MongoDB Database Connection Configuration
 * 
 * This module handles the connection to MongoDB Atlas using Mongoose.
 * It provides a reusable function to establish and manage the database connection.
 * 
 * Features:
 * - Async connection handling
 * - Connection error handling
 * - Connection event listeners
 * - Graceful disconnection
 * - Production-ready configuration
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 * 
 * This function establishes a connection to MongoDB using the connection string
 * from environment variables. It handles connection errors and provides detailed
 * logging for debugging purposes.
 * 
 * @returns {Promise<void>} Resolves when connection is successful
 * @throws {Error} Throws an error if connection fails
 */
const connectDB = async () => {
  try {
    // Get MongoDB connection string from environment variables
    const mongoURI = process.env.MONGODB_URI;

    // Validate that connection string exists
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Mongoose connection options
    // Note: useNewUrlParser and useUnifiedTopology are not needed in Mongoose 8+
    // These options ensure optimal connection handling
    const options = {
      // Server selection timeout (30 seconds)
      serverSelectionTimeoutMS: 30000,
      
      // Socket timeout (45 seconds)
      socketTimeoutMS: 45000,
    };

    // Attempt to connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    // Log successful connection
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ MongoDB Connected');
    console.log(`📦 Database Host: ${conn.connection.host}`);
    console.log(`🗄️  Database Name: ${conn.connection.name}`);
    console.log(`⚡ Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Unknown'}`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    // Log detailed error information
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ MongoDB Connection Failed');
    console.error('═══════════════════════════════════════════════════════');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    
    // Provide helpful debugging information
    if (error.message.includes('MONGODB_URI')) {
      console.error('\n💡 Tip: Make sure MONGODB_URI is set in your .env file');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Tip: Check your MongoDB username and password');
    } else if (error.message.includes('network')) {
      console.error('\n💡 Tip: Check your internet connection and MongoDB Atlas whitelist');
    }
    
    console.error('═══════════════════════════════════════════════════════\n');

    // Exit process with failure code
    process.exit(1);
  }
};

// ======================
// Connection Event Listeners
// ======================

/**
 * Monitor connection events for better debugging and logging
 * These listeners help track the connection state throughout the app lifecycle
 */

// Connection successful
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connection established');
});

// Connection error
mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

// Connection disconnected
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose connection disconnected');
});

// Connection reconnected
mongoose.connection.on('reconnected', () => {
  console.log('🔄 Mongoose connection reconnected');
});

/**
 * Graceful shutdown handler
 * Ensures the database connection is properly closed when the app terminates
 */
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ Mongoose connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error closing mongoose connection:', err);
    process.exit(1);
  }
});

// Export the connection function
module.exports = connectDB;
