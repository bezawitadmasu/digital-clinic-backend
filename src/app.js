/**
 * Express Application Configuration
 * 
 * This file configures the Express application with all necessary middleware
 * and routes. It is separated from server.js to allow for easier testing
 * and better separation of concerns.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Initialize Express app
const app = express();

// ======================
// Security Middleware
// ======================

/**
 * Helmet - Sets various HTTP headers for security
 * - Prevents clickjacking attacks
 * - Prevents MIME type sniffing
 * - Adds XSS protection
 * - And many more security enhancements
 */
app.use(helmet());

// ======================
// CORS Configuration
// ======================

/**
 * CORS - Cross-Origin Resource Sharing
 * Allows the React frontend to make requests to this API
 * In production, you should restrict this to your specific frontend domain
 */
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// ======================
// Logging Middleware
// ======================

/**
 * Morgan - HTTP request logger
 * - 'dev' format gives colored console output for development
 * - In production, you might want 'combined' or 'common' format
 */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ======================
// Body Parsing Middleware
// ======================

/**
 * express.json() - Parses incoming JSON payloads
 * Allows us to access req.body in our routes
 */
app.use(express.json());

/**
 * express.urlencoded() - Parses URL-encoded data
 * Useful for form submissions
 */
app.use(express.urlencoded({ extended: true }));

// ======================
// API Routes
// ======================

/**
 * Health Check Route
 * Returns basic API information to verify the server is running
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Digital Clinic API is running',
    version: process.env.API_VERSION || 'v1',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * API Version Route
 * Provides more detailed information about the API
 */
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Digital Clinic Management System API',
    version: process.env.API_VERSION || 'v1',
    endpoints: {
      health: '/',
      api: '/api',
      // Future endpoints will be added here
      // auth: '/api/v1/auth',
      // patients: '/api/v1/patients',
      // doctors: '/api/v1/doctors',
      // appointments: '/api/v1/appointments'
    }
  });
});

// ======================
// 404 Handler
// ======================

/**
 * Catch-all route for undefined endpoints
 * This should be placed after all other routes
 * Note: In Express 5, use explicit wildcard patterns instead of '*'
 */
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'Not Found'
  });
});

// ======================
// Global Error Handler
// ======================

/**
 * Global error handling middleware
 * Catches any errors thrown in the application
 * Must have 4 parameters (err, req, res, next) to be recognized as error handler
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Default error values
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Export the configured Express app
module.exports = app;
