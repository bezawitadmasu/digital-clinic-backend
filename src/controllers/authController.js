/**
 * Authentication Controller
 * 
 * This controller handles HTTP requests for authentication endpoints.
 * It acts as the interface between the routes and the business logic
 * in the authentication service.
 * 
 * Features:
 * - User registration endpoint
 * - User login endpoint
 * - Consistent JSON response formatting
 * - Error handling with appropriate status codes
 * - Input validation
 */

const authService = require('../services/authService');

/**
 * Authentication Controller Class
 */
class AuthController {
  /**
   * Register a new user
   * 
   * POST /api/auth/register
   * 
   * Request Body:
   * {
   *   "fullName": "John Doe",
   *   "email": "john@example.com",
   *   "password": "SecurePass123",
   *   "phone": "+1234567890",
   *   "role": "patient", // Optional: defaults to "patient"
   *   "profileImage": "https://..." // Optional
   * }
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async register(req, res, next) {
    try {
      // Extract user data from request body
      const { fullName, email, password, phone, role, profileImage } = req.body;

      // Validate required fields
      if (!fullName || !email || !password || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all required fields: fullName, email, password, and phone'
        });
      }

      // Validate password strength (basic validation)
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long'
        });
      }

      // Validate role if provided
      if (role && !['admin', 'doctor', 'patient'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be admin, doctor, or patient'
        });
      }

      // Call service to register user
      const result = await authService.register({
        fullName,
        email,
        password,
        phone,
        role,
        profileImage
      });

      // Send success response
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          token: result.token
        }
      });

    } catch (error) {
      // Handle duplicate email error
      if (error.statusCode === 409) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      // Handle validation errors from Mongoose
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: messages
        });
      }

      // Pass other errors to global error handler
      next(error);
    }
  }

  /**
   * Login user
   * 
   * POST /api/auth/login
   * 
   * Request Body:
   * {
   *   "email": "john@example.com",
   *   "password": "SecurePass123"
   * }
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async login(req, res, next) {
    try {
      // Extract credentials from request body
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email and password'
        });
      }

      // Call service to authenticate user
      const result = await authService.login(email, password);

      // Send success response
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          token: result.token
        }
      });

    } catch (error) {
      // Handle authentication errors (401, 403)
      if (error.statusCode === 401 || error.statusCode === 403) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      // Pass other errors to global error handler
      next(error);
    }
  }

  /**
   * Get current user profile
   * 
   * GET /api/auth/me
   * 
   * Requires: Authorization: Bearer <token>
   * 
   * Returns the profile of the currently authenticated user.
   * The user is already attached to req.user by authMiddleware.
   * 
   * @param {Object} req - Express request object (with req.user from authMiddleware)
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getCurrentUser(req, res, next) {
    try {
      // User is already attached by authMiddleware and validated
      // No need to fetch from database again
      
      res.status(200).json({
        success: true,
        message: 'Current user retrieved successfully',
        data: {
          user: req.user
        }
      });

    } catch (error) {
      // Handle any unexpected errors
      next(error);
    }
  }
}

// Export a singleton instance
module.exports = new AuthController();
