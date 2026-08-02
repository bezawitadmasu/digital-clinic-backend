/**
 * JWT Authentication Middleware
 * 
 * This middleware protects routes by verifying JWT tokens and attaching
 * authenticated user information to the request object.
 * 
 * Features:
 * - Extracts JWT from Authorization header (Bearer token)
 * - Verifies token signature and expiration
 * - Fetches user from database
 * - Validates user exists and is active
 * - Attaches user to req.user for use in route handlers
 * - Comprehensive error handling with appropriate status codes
 * 
 * Usage:
 *   router.get('/protected', authMiddleware, handler);
 *   router.get('/admin-only', authMiddleware, requireRole('admin'), handler);
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect Route Middleware
 * 
 * Verifies JWT token and attaches authenticated user to request.
 * Use this middleware on any route that requires authentication.
 * 
 * The authenticated user will be available in subsequent middleware/handlers
 * via req.user with the following structure:
 * {
 *   _id, fullName, email, phone, role, profileImage, isActive,
 *   createdAt, updatedAt
 * }
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @example
 * // Protect a single route
 * router.get('/profile', authMiddleware, getProfile);
 * 
 * @example
 * // Protect all routes in a router
 * router.use(authMiddleware);
 * router.get('/appointments', getAppointments);
 */
const authMiddleware = async (req, res, next) => {
  try {
    // ============================================
    // Step 1: Extract Token from Authorization Header
    // ============================================
    
    // Get the Authorization header
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Check if header follows Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format. Use: Bearer <token>'
      });
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7); // 'Bearer '.length === 7

    // Verify token is not empty
    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token is empty.'
      });
    }

    // ============================================
    // Step 2: Verify JWT Token
    // ============================================

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('SECURITY ERROR: JWT_SECRET is not defined in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error. Please contact support.'
      });
    }

    let decoded;
    try {
      // Verify token signature and expiration
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Token has expired. Please login again.'
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Invalid token.'
        });
      } else if (error.name === 'NotBeforeError') {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Token not yet valid.'
        });
      } else {
        // Unknown JWT error
        return res.status(401).json({
          success: false,
          message: 'Access denied. Token verification failed.'
        });
      }
    }

    // Validate decoded payload has required fields
    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token payload.'
      });
    }

    // ============================================
    // Step 3: Find User in Database
    // ============================================

    // Fetch user from database (excluding password)
    const user = await User.findById(decoded.id).select('-password');

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. The account may have been deleted.'
      });
    }

    // ============================================
    // Step 4: Validate User Account Status
    // ============================================

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Your account has been deactivated. Please contact support.'
      });
    }

    // ============================================
    // Step 5: Attach User to Request Object
    // ============================================

    // Attach user to request for use in subsequent middleware/handlers
    req.user = user;

    // Also attach the decoded token for additional context if needed
    req.token = decoded;

    // Continue to next middleware/handler
    next();

  } catch (error) {
    // Log unexpected errors for debugging
    console.error('Authentication Middleware Error:', error);

    // Return generic error to client (don't leak sensitive information)
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

/**
 * Optional Middleware - Soft Authentication
 * 
 * Similar to authMiddleware but doesn't fail if no token is provided.
 * Useful for routes that have different behavior for authenticated vs unauthenticated users.
 * 
 * If token exists and is valid: req.user is set
 * If no token or invalid token: req.user is undefined, but request continues
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @example
 * // Route accessible to all, but shows different data if authenticated
 * router.get('/doctors', optionalAuth, getDoctors);
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // If no token, just continue without setting req.user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    if (!token || token.trim() === '') {
      return next();
    }

    if (!process.env.JWT_SECRET) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.id) {
        const user = await User.findById(decoded.id).select('-password');
        
        // Only attach user if found and active
        if (user && user.isActive) {
          req.user = user;
          req.token = decoded;
        }
      }
    } catch (error) {
      // Silently fail - invalid tokens don't prevent access
      // Just don't set req.user
    }

    next();
  } catch (error) {
    console.error('Optional Auth Middleware Error:', error);
    next(); // Continue even if error occurs
  }
};

/**
 * Role-Based Access Control Middleware
 * 
 * Restricts access to routes based on user role.
 * Must be used AFTER authMiddleware.
 * 
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Only admin can access
 * router.delete('/users/:id', authMiddleware, authorizeRoles('admin'), deleteUser);
 * 
 * @example
 * // Admin or doctor can access
 * router.get('/patients', authMiddleware, authorizeRoles('admin', 'doctor'), getPatients);
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be set by authMiddleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This resource requires ${allowedRoles.join(' or ')} role.`
      });
    }

    // User has required role, continue
    next();
  };
};

/**
 * Alias for authorizeRoles
 * Kept for backward compatibility
 */
const requireRole = authorizeRoles;

/**
 * Check if User is Account Owner
 * 
 * Verifies that the authenticated user is accessing their own resource.
 * Useful for endpoints where users should only access their own data.
 * Admins bypass this check.
 * 
 * @param {string} userIdParam - Name of the route parameter containing user ID (default: 'userId')
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Only the user themselves (or admin) can update their profile
 * router.put('/users/:userId', authMiddleware, requireOwnership('userId'), updateProfile);
 */
const requireOwnership = (userIdParam = 'userId') => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    // Admins can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Get the user ID from route parameters
    const resourceUserId = req.params[userIdParam];

    // Check if the authenticated user matches the resource owner
    if (req.user._id.toString() !== resourceUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

// Export middleware functions
module.exports = {
  authMiddleware,
  optionalAuth,
  authorizeRoles,
  requireRole, // Alias for backward compatibility
  requireOwnership
};
