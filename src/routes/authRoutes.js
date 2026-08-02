/**
 * Authentication Routes
 * 
 * This file defines all routes related to authentication.
 * It maps HTTP endpoints to controller methods.
 * 
 * Routes:
 * - POST /api/auth/register - Register a new user
 * - POST /api/auth/login - Login existing user
 * - GET /api/auth/me - Get current user profile (protected)
 */

const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Create Express router
const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { fullName, email, password, phone, role?, profileImage? }
 */
router.post('/register', authController.register.bind(authController));

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', authController.login.bind(authController));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 * @header  Authorization: Bearer <token>
 */
router.get('/me', authMiddleware, authController.getCurrentUser.bind(authController));

// Export the router
module.exports = router;
