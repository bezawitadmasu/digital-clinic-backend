/**
 * Authentication Service
 * 
 * This service contains the business logic for authentication operations.
 * It separates business logic from the controller layer for better
 * maintainability and testability.
 * 
 * Features:
 * - User registration with validation
 * - User login with credential verification
 * - JWT token generation
 * - Password hashing (handled by User model)
 * - Duplicate email checking
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Service Class
 */
class AuthService {
  /**
   * Register a new user
   * 
   * Creates a new user account after validating that the email
   * is not already registered.
   * 
   * @param {Object} userData - User registration data
   * @param {string} userData.fullName - User's full name
   * @param {string} userData.email - User's email address
   * @param {string} userData.password - User's password (will be hashed)
   * @param {string} userData.phone - User's phone number
   * @param {string} userData.role - User's role (admin, doctor, patient)
   * @param {string} [userData.profileImage] - Optional profile image URL
   * @returns {Promise<Object>} Created user object and JWT token
   * @throws {Error} If email already exists or validation fails
   */
  async register(userData) {
    // Check if email already exists
    const emailExists = await User.emailExists(userData.email);
    
    if (emailExists) {
      const error = new Error('Email address is already registered');
      error.statusCode = 409; // Conflict
      throw error;
    }

    // Create new user (password will be hashed automatically by pre-save hook)
    const user = await User.create({
      fullName: userData.fullName,
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      role: userData.role || 'patient',
      profileImage: userData.profileImage || null
    });

    // Generate JWT token for immediate login
    const token = this.generateToken(user._id, user.role);

    // Return user data without password
    return {
      user: user.toSafeObject(),
      token
    };
  }

  /**
   * Login user
   * 
   * Authenticates a user by verifying email and password,
   * then generates a JWT token for subsequent requests.
   * 
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<Object>} User object and JWT token
   * @throws {Error} If credentials are invalid or user is inactive
   */
  async login(email, password) {
    // Validate input
    if (!email || !password) {
      const error = new Error('Email and password are required');
      error.statusCode = 400;
      throw error;
    }

    // Find user by email and include password field
    const user = await User.findByCredentials(email);

    // Check if user exists
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401; // Unauthorized
      throw error;
    }

    // Check if user account is active
    if (!user.isActive) {
      const error = new Error('Your account has been deactivated. Please contact support.');
      error.statusCode = 403; // Forbidden
      throw error;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401; // Unauthorized
      throw error;
    }

    // Generate JWT token
    const token = this.generateToken(user._id, user.role);

    // Return user data without password
    return {
      user: user.toSafeObject(),
      token
    };
  }

  /**
   * Generate JWT token
   * 
   * Creates a signed JWT token containing user ID and role.
   * The token is used for authentication in subsequent requests.
   * 
   * @param {string} userId - User's MongoDB ObjectId
   * @param {string} role - User's role (admin, doctor, patient)
   * @returns {string} Signed JWT token
   * @throws {Error} If JWT_SECRET is not configured
   */
  generateToken(userId, role) {
    // Ensure JWT secret is configured
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Token payload (data to be encoded in the token)
    const payload = {
      id: userId,
      role: role
    };

    // Token options
    const options = {
      expiresIn: process.env.JWT_EXPIRE || '7d' // Default to 7 days if not specified
    };

    // Sign and return the token
    return jwt.sign(payload, process.env.JWT_SECRET, options);
  }

  /**
   * Verify JWT token
   * 
   * Validates and decodes a JWT token.
   * This method can be used in authentication middleware.
   * 
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        const err = new Error('Token has expired. Please login again.');
        err.statusCode = 401;
        throw err;
      } else if (error.name === 'JsonWebTokenError') {
        const err = new Error('Invalid token. Please login again.');
        err.statusCode = 401;
        throw err;
      }
      throw error;
    }
  }

  /**
   * Get user by ID
   * 
   * Retrieves a user by their ID without the password field.
   * Useful for getting user details after token verification.
   * 
   * @param {string} userId - User's MongoDB ObjectId
   * @returns {Promise<Object>} User object without password
   * @throws {Error} If user is not found
   */
  async getUserById(userId) {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return user.toSafeObject();
  }

  /**
   * Update User Profile
   * 
   * Updates user's profile information (fullName and phone only).
   * Email, password, and role cannot be updated through this method.
   * 
   * @param {string} userId - User's MongoDB ObjectId
   * @param {Object} updateData - Data to update
   * @param {string} [updateData.fullName] - Updated full name
   * @param {string} [updateData.phone] - Updated phone number
   * @returns {Promise<Object>} Updated user object without password
   * @throws {Error} If user is not found or validation fails
   */
  async updateProfile(userId, updateData) {
    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if user account is active
    if (!user.isActive) {
      const error = new Error('Cannot update profile. Account is deactivated.');
      error.statusCode = 403;
      throw error;
    }

    // Only allow updating fullName and phone
    // Explicitly prevent updating email, password, role, isActive
    const allowedFields = ['fullName', 'phone'];
    const updates = {};

    // Filter and validate allowed fields
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });

    // Check if there are any valid fields to update
    if (Object.keys(updates).length === 0) {
      const error = new Error('No valid fields to update. Only fullName and phone can be updated.');
      error.statusCode = 400;
      throw error;
    }

    // Update user fields
    Object.keys(updates).forEach(key => {
      user[key] = updates[key];
    });

    // Save updated user (triggers Mongoose validation)
    await user.save();

    // Return updated user without password
    return user.toSafeObject();
  }
}

// Export a singleton instance
module.exports = new AuthService();
