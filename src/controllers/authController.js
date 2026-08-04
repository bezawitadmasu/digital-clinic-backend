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

  /**
   * Update User Profile
   * 
   * PUT /api/auth/profile
   * 
   * Requires: Authorization: Bearer <token>
   * 
   * Request Body:
   * {
   *   "fullName": "Updated Name",    // Optional
   *   "phone": "+1234567890"         // Optional
   * }
   * 
   * Updates the authenticated user's profile information.
   * Only fullName and phone can be updated.
   * Email, password, and role cannot be changed through this endpoint.
   * 
   * @param {Object} req - Express request object (with req.user from authMiddleware)
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateProfile(req, res, next) {
    try {
      // ============================================
      // Step 1: Check for Restricted Field Updates
      // ============================================
      
      // Check if user is trying to update restricted fields
      // This validation must come FIRST to prevent security issues
      const restrictedFields = ['email', 'password', 'role', 'isActive', '_id'];
      const attemptedRestrictedUpdate = restrictedFields.some(field => req.body[field] !== undefined);

      if (attemptedRestrictedUpdate) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update email, password, role, or account status through this endpoint'
        });
      }

      // ============================================
      // Step 2: Extract Allowed Fields
      // ============================================
      
      // Extract only the allowed fields from request body
      const { fullName, phone } = req.body;

      // ============================================
      // Step 3: Validate At Least One Field Provided
      // ============================================
      
      // Validate that at least one allowed field is provided
      if (!fullName && !phone) {
        return res.status(400).json({
          success: false,
          message: 'Please provide at least one field to update (fullName or phone)'
        });
      }

      // ============================================
      // Step 4: Prepare Update Data
      // ============================================
      
      // Prepare update data object with only the provided fields
      const updateData = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (phone !== undefined) updateData.phone = phone;

      // ============================================
      // Step 5: Update Profile
      // ============================================
      
      // Get user ID from authenticated user (set by authMiddleware)
      const userId = req.user._id;

      // Call service to update profile
      const updatedUser = await authService.updateProfile(userId, updateData);

      // Send success response
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser
        }
      });

    } catch (error) {
      // Handle not found error (404)
      if (error.statusCode === 404) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      // Handle forbidden error (403)
      if (error.statusCode === 403) {
        return res.status(403).json({
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

      // Handle bad request errors (400)
      if (error.statusCode === 400) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      // Pass other errors to global error handler
      next(error);
    }
  }

  /**
   * Change User Password
   * 
   * PUT /api/auth/change-password
   * 
   * Requires: Authorization: Bearer <token>
   * 
   * Request Body:
   * {
   *   "currentPassword": "OldPassword123",
   *   "newPassword": "NewPassword123"
   * }
   * 
   * Allows authenticated users to change their password.
   * Requires current password verification for security.
   * 
   * @param {Object} req - Express request object (with req.user from authMiddleware)
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async changePassword(req, res, next) {
    try {
      // ============================================
      // Step 1: Extract and Validate Input
      // ============================================
      
      // Extract passwords from request body
      const { currentPassword, newPassword } = req.body;

      // Validate that both passwords are provided
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both current password and new password'
        });
      }

      // Validate new password length (basic validation)
      // More detailed validation will be done by Mongoose schema
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long'
        });
      }

      // ============================================
      // Step 2: Change Password
      // ============================================
      
      // Get user ID from authenticated user (set by authMiddleware)
      const userId = req.user._id;

      // Call service to change password
      // Service will verify current password and update to new password
      const result = await authService.changePassword(userId, currentPassword, newPassword);

      // Send success response
      // Note: We don't return user data to avoid exposing sensitive information
      res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      // Handle unauthorized error (401) - incorrect current password
      if (error.statusCode === 401) {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }

      // Handle bad request error (400) - validation errors
      if (error.statusCode === 400) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      // Handle forbidden error (403) - account inactive
      if (error.statusCode === 403) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      // Handle not found error (404)
      if (error.statusCode === 404) {
        return res.status(404).json({
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
}

// Export a singleton instance
module.exports = new AuthController();
