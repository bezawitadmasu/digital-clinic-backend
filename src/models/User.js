/**
 * User Model
 * 
 * This model defines the schema for users in the Digital Clinic Management System.
 * It handles authentication, authorization, and user profile information.
 * 
 * Features:
 * - Password hashing with bcrypt
 * - Email uniqueness validation
 * - Role-based access control (admin, doctor, patient)
 * - Profile image support
 * - Active status management
 * - Automatic timestamps
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * User Schema Definition
 * 
 * Defines the structure and validation rules for user documents
 */
const userSchema = new mongoose.Schema(
  {
    // Full name of the user
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters long'],
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },

    // Email address (used for authentication)
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address'
      ]
    },

    // Hashed password (never store plain text passwords)
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false // Don't include password in queries by default
    },

    // Phone number
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [
        /^[\d\s\-\+\(\)]+$/,
        'Please provide a valid phone number'
      ]
    },

    // User role for access control
    role: {
      type: String,
      enum: {
        values: ['admin', 'doctor', 'patient'],
        message: 'Role must be either admin, doctor, or patient'
      },
      default: 'patient',
      required: true
    },

    // Profile image URL or path
    profileImage: {
      type: String,
      default: null
    },

    // Account active status
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
    
    // Customize JSON output
    toJSON: {
      transform: function(doc, ret) {
        // Remove sensitive fields from JSON output
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// ======================
// Indexes
// ======================

/**
 * Compound index for role-based queries with active status
 * Useful for queries like "find all active doctors"
 * 
 * Note: Email index is automatically created by the 'unique: true' property
 * in the schema definition above, so we don't need to explicitly define it here.
 */
userSchema.index({ role: 1, isActive: 1 });

// ======================
// Pre-save Middleware
// ======================

/**
 * Hash password before saving to database
 * 
 * This middleware runs automatically before saving a user document.
 * It only hashes the password if it has been modified (new user or password change).
 * 
 * Security note: Uses bcrypt with 12 salt rounds for strong password hashing.
 * 
 * Mongoose 8 Note: Async middleware functions should NOT call next().
 * Simply return (success) or throw an error (failure).
 */
userSchema.pre('save', async function() {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return; // Exit early if password hasn't changed
  }

  // Generate salt with 12 rounds (good balance of security and performance)
  const salt = await bcrypt.genSalt(12);
  
  // Hash the password with the salt
  this.password = await bcrypt.hash(this.password, salt);
  
  // No need to call next() in async middleware
  // Mongoose 8 handles this automatically
});

// ======================
// Instance Methods
// ======================

/**
 * Compare password with hashed password
 * 
 * This method is used during login to verify if the provided password
 * matches the hashed password stored in the database.
 * 
 * @param {string} candidatePassword - Plain text password to compare
 * @returns {Promise<boolean>} - True if passwords match, false otherwise
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Get user data without sensitive information
 * 
 * Returns a clean user object suitable for API responses
 * 
 * @returns {Object} User object without password and internal fields
 */
userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// ======================
// Static Methods
// ======================

/**
 * Find user by email (including password field)
 * 
 * Helper method to find a user by email and include the password field.
 * Useful for authentication where we need to compare passwords.
 * 
 * @param {string} email - User's email address
 * @returns {Promise<User|null>} User document with password field, or null
 */
userSchema.statics.findByCredentials = async function(email) {
  return await this.findOne({ email }).select('+password');
};

/**
 * Check if email already exists
 * 
 * Helper method to check if an email is already registered.
 * Useful for registration validation.
 * 
 * @param {string} email - Email address to check
 * @returns {Promise<boolean>} True if email exists, false otherwise
 */
userSchema.statics.emailExists = async function(email) {
  const user = await this.findOne({ email });
  return !!user;
};

// ======================
// Model Export
// ======================

/**
 * Create and export the User model
 * 
 * The model name 'User' will create a 'users' collection in MongoDB
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
