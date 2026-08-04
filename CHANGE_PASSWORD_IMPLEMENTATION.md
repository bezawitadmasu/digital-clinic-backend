# 🔐 Change Password Feature - Implementation Guide

## ✅ Implementation Complete

The Change Password feature has been successfully implemented following clean architecture and existing patterns.

---

## 📁 Files Modified (3 Files)

### 1. **`src/services/authService.js`** ✨ (Service Layer - Business Logic)

**New Method Added**: `changePassword(userId, currentPassword, newPassword)`

**What It Does**:
```javascript
/**
 * Change User Password
 * 
 * Allows authenticated users to change their password.
 * Requires current password verification before updating.
 * 
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password to set
 * @returns {Promise<Object>} Success message
 * @throws {Error} If user is not found, current password is incorrect, or validation fails
 */
async changePassword(userId, currentPassword, newPassword) {
  // 1. Find user by ID and include password field
  const user = await User.findById(userId).select('+password');

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Check if user account is active
  if (!user.isActive) {
    const error = new Error('Cannot change password. Account is deactivated.');
    error.statusCode = 403;
    throw error;
  }

  // 3. Verify current password using existing comparePassword method
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);

  if (!isCurrentPasswordValid) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 401;
    throw error;
  }

  // 4. Validate new password length
  if (newPassword.length < 8) {
    const error = new Error('New password must be at least 8 characters long');
    error.statusCode = 400;
    throw error;
  }

  // 5. Check if new password is same as current password
  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    const error = new Error('New password must be different from current password');
    error.statusCode = 400;
    throw error;
  }

  // 6. Update password field
  // The pre-save hook will automatically hash it
  user.password = newPassword;

  // 7. Save user (triggers password hashing and validation)
  await user.save();

  // 8. Return success message (no user data or password)
  return {
    message: 'Password changed successfully'
  };
}
```

**Key Features**:
- ✅ Finds user with password field (`.select('+password')`)
- ✅ Validates user exists and is active
- ✅ **Uses existing `comparePassword()` method** to verify current password
- ✅ Validates new password length (min 8 characters)
- ✅ Prevents setting same password
- ✅ **Relies on User model pre-save hook** for automatic password hashing
- ✅ Triggers Mongoose validation on save
- ✅ Returns simple success message (no sensitive data)

**Security Notes**:
- Current password verification prevents unauthorized changes
- Password is automatically hashed by existing User model pre-save hook
- No password is ever returned in response
- Account must be active to change password

---

### 2. **`src/controllers/authController.js`** ✨ (Controller Layer - HTTP Handler)

**New Method Added**: `changePassword(req, res, next)`

**What It Does**:
```javascript
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
 */
async changePassword(req, res, next) {
  try {
    // Step 1: Extract and validate input
    const { currentPassword, newPassword } = req.body;

    // Validate both passwords provided
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current password and new password'
      });
    }

    // Validate new password length (basic)
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Step 2: Get user ID from authenticated user
    const userId = req.user._id;

    // Step 3: Call service to change password
    const result = await authService.changePassword(userId, currentPassword, newPassword);

    // Step 4: Send success response (no user data)
    res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    // Handle various error types with appropriate status codes
    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.statusCode === 403) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    next(error);
  }
}
```

**Key Features**:
- ✅ Validates both passwords provided
- ✅ Basic password length validation
- ✅ Uses authenticated user ID from `req.user` (set by authMiddleware)
- ✅ Comprehensive error handling (400, 401, 403, 404)
- ✅ Returns only success message (no user data or password)

---

### 3. **`src/routes/authRoutes.js`** ✨ (Route Layer - Routing)

**New Route Added**: `PUT /api/auth/change-password`

**Implementation**:
```javascript
/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private (requires authentication)
 * @header  Authorization: Bearer <token>
 * @body    { currentPassword, newPassword }
 */
router.put('/change-password', authMiddleware, authController.changePassword.bind(authController));
```

**Route Structure**:
```
POST /api/auth/register          → Public  → authController.register
POST /api/auth/login             → Public  → authController.login
GET  /api/auth/me                → Private → authController.getCurrentUser
PUT  /api/auth/profile           → Private → authController.updateProfile
PUT  /api/auth/change-password   → Private → authController.changePassword  ← NEW
```

**Key Features**:
- ✅ Protected with `authMiddleware` (requires valid JWT)
- ✅ Uses PUT method (updating resource)
- ✅ Follows existing route patterns
- ✅ Method binding to controller instance

---

## 🎯 API Endpoint Documentation

### **PUT /api/auth/change-password**

#### **Purpose**
Allow authenticated users to change their password by verifying current password.

#### **Access**
🔒 **Private** - Requires authentication

#### **Authentication**
```
Authorization: Bearer <your-jwt-token>
```

#### **Request Body**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

**Field Requirements**:
- `currentPassword` - Required, must match current password
- `newPassword` - Required, minimum 8 characters, must be different from current

#### **Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Note**: No user data or password is returned for security.

---

## ❌ Error Responses

### **400 Bad Request - Missing Fields**
**Condition**: currentPassword or newPassword not provided

**Response**:
```json
{
  "success": false,
  "message": "Please provide both current password and new password"
}
```

---

### **400 Bad Request - Password Too Short**
**Condition**: newPassword less than 8 characters

**Response**:
```json
{
  "success": false,
  "message": "New password must be at least 8 characters long"
}
```

---

### **400 Bad Request - Same Password**
**Condition**: newPassword is same as currentPassword

**Response**:
```json
{
  "success": false,
  "message": "New password must be different from current password"
}
```

---

### **401 Unauthorized - Wrong Current Password**
**Condition**: currentPassword is incorrect

**Response**:
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

### **401 Unauthorized - No Token**
**Condition**: No Authorization header

**Response**:
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

---

### **401 Unauthorized - Invalid Token**
**Condition**: Invalid or expired JWT token

**Response**:
```json
{
  "success": false,
  "message": "Access denied. Invalid token."
}
```

---

### **403 Forbidden - Account Inactive**
**Condition**: User account is deactivated

**Response**:
```json
{
  "success": false,
  "message": "Cannot change password. Account is deactivated."
}
```

---

### **404 Not Found - User Deleted**
**Condition**: User no longer exists in database

**Response**:
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## 🧪 Testing with Postman

### **Test 1: Successful Password Change**

**Setup**:
1. Login first to get a token
2. Note your current password

**Request**:
- Method: `PUT`
- URL: `http://localhost:5000/api/auth/change-password`
- Headers:
  - `Authorization`: `Bearer YOUR_TOKEN`
  - `Content-Type`: `application/json`
- Body (raw JSON):
```json
{
  "currentPassword": "YourCurrentPassword123",
  "newPassword": "YourNewPassword123"
}
```

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Verification**:
Try logging in with the new password to confirm it works.

---

### **Test 2: Wrong Current Password**

**Request**:
- Method: `PUT`
- URL: `http://localhost:5000/api/auth/change-password`
- Headers:
  - `Authorization`: `Bearer YOUR_TOKEN`
  - `Content-Type`: `application/json`
- Body (raw JSON):
```json
{
  "currentPassword": "WrongPassword123",
  "newPassword": "NewPassword123"
}
```

**Expected Response (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

### **Test 3: New Password Too Short**

**Request**:
- Method: `PUT`
- URL: `http://localhost:5000/api/auth/change-password`
- Headers:
  - `Authorization`: `Bearer YOUR_TOKEN`
  - `Content-Type`: `application/json`
- Body (raw JSON):
```json
{
  "currentPassword": "YourCurrentPassword123",
  "newPassword": "Pass1"
}
```

**Expected Response (400 Bad Request)**:
```json
{
  "success": false,
  "message": "New password must be at least 8 characters long"
}
```

---

### **Test 4: Same Password**

**Request**:
- Method: `PUT`
- URL: `http://localhost:5000/api/auth/change-password`
- Headers:
  - `Authorization`: `Bearer YOUR_TOKEN`
  - `Content-Type`: `application/json`
- Body (raw JSON):
```json
{
  "currentPassword": "YourCurrentPassword123",
  "newPassword": "YourCurrentPassword123"
}
```

**Expected Response (400 Bad Request)**:
```json
{
  "success": false,
  "message": "New password must be different from current password"
}
```

---

### **Test 5: Missing Fields**

**Request**:
- Method: `PUT`
- URL: `http://localhost:5000/api/auth/change-password`
- Headers:
  - `Authorization`: `Bearer YOUR_TOKEN`
  - `Content-Type`: `application/json`
- Body (raw JSON):
```json
{
  "currentPassword": "YourCurrentPassword123"
}
```

**Expected Response (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Please provide both current password and new password"
}
```

---

### **Test 6: No Token**

**Request**:
- Method: `PUT`
- URL: `http://localhost:5000/api/auth/change-password`
- Headers:
  - `Content-Type`: `application/json`
- Body (raw JSON):
```json
{
  "currentPassword": "Password123",
  "newPassword": "NewPassword123"
}
```

**Expected Response (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

---

## 🔄 Complete Request Flow

```
Client Request
    ↓
PUT /api/auth/change-password
Authorization: Bearer <token>
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
    ↓
┌────────────────────────────────────┐
│   authRoutes.js                    │
│   Route: PUT /change-password      │
└──────────┬─────────────────────────┘
           ↓
┌────────────────────────────────────┐
│   authMiddleware                   │
│   (Verify JWT & Attach User)      │
├────────────────────────────────────┤
│   1. Extract & verify token        │
│   2. Find user in MongoDB          │
│   3. Check active status           │
│   4. Attach to req.user            │
└──────────┬─────────────────────────┘
           ↓
┌────────────────────────────────────┐
│   authController.changePassword    │
├────────────────────────────────────┤
│   1. Extract passwords             │
│   2. Validate both provided        │
│   3. Validate new password length  │
│   4. Get userId from req.user      │
│   5. Call authService              │
└──────────┬─────────────────────────┘
           ↓
┌────────────────────────────────────┐
│   authService.changePassword       │
├────────────────────────────────────┤
│   1. Find user with password       │
│   2. Check account active          │
│   3. Verify current password       │
│      (using comparePassword)       │
│   4. Validate new password         │
│   5. Check not same password       │
│   6. Set user.password = new       │
│   7. Save user                     │
└──────────┬─────────────────────────┘
           ↓
┌────────────────────────────────────┐
│   User Model (Pre-save Hook)      │
├────────────────────────────────────┤
│   1. Detect password modified      │
│   2. Generate bcrypt salt (12)     │
│   3. Hash new password             │
│   4. Save hashed to MongoDB        │
└──────────┬─────────────────────────┘
           ↓
    Response (200 OK)
    {
      "success": true,
      "message": "Password changed successfully"
    }
```

---

## 🔐 Security Features

### ✅ Current Password Verification
- **Requires current password** to change password
- Uses existing `comparePassword()` method
- Prevents unauthorized password changes
- Returns 401 if current password incorrect

### ✅ Automatic Password Hashing
- **Uses existing User model pre-save hook**
- Automatically hashes with bcrypt (12 rounds)
- No changes to hashing logic needed
- Consistent with registration/login flow

### ✅ Password Validation
- Minimum 8 characters enforced
- Mongoose schema validation on save
- Cannot use same password as current
- Clear error messages for validation failures

### ✅ Authentication Required
- Protected with authMiddleware
- JWT token must be valid
- User must exist and be active
- Users can only change their own password

### ✅ No Password Leakage
- Password never returned in response
- Only success message returned
- User model excludes password by default
- Service explicitly selects password only when needed

---

## 📊 Architecture Compliance

### ✅ Clean Architecture Maintained
```
Route → Controller → Service → Model → MongoDB
```

**Separation of Concerns**:
- **Route**: HTTP routing, middleware application
- **Controller**: Request/response, input validation
- **Service**: Business logic, password verification
- **Model**: Password hashing (pre-save hook)

### ✅ Existing Patterns Followed
- Same response format as other endpoints
- Same error handling approach
- Same middleware usage
- Same controller structure (class with methods)
- Same service structure (singleton)
- Uses existing User model methods

### ✅ Existing Functionality Preserved
- ✅ Register logic unchanged
- ✅ Login logic unchanged
- ✅ JWT generation unchanged
- ✅ authMiddleware unchanged
- ✅ User model pre-save hook unchanged
- ✅ comparePassword() method unchanged

---

## 🎓 How It Works

### **Password Hashing Flow**

1. **User submits new password** (plain text)
2. **Service sets** `user.password = newPassword`
3. **Calls** `user.save()`
4. **Mongoose triggers** pre-save hook
5. **Pre-save hook detects** password modified
6. **Pre-save hook hashes** password with bcrypt
7. **Hashed password saved** to MongoDB

**Key Point**: We reuse the existing password hashing mechanism!

### **Current Password Verification**

```javascript
// Uses existing comparePassword instance method
const isCurrentPasswordValid = await user.comparePassword(currentPassword);

if (!isCurrentPasswordValid) {
  // Reject request
}
```

**Key Point**: We reuse the existing password comparison method!

### **Why This Approach?**

1. **DRY Principle**: Don't Repeat Yourself
   - Reuses existing password hashing
   - Reuses existing password comparison
   - No duplicate code

2. **Consistency**: 
   - Same hashing method as registration
   - Same salt rounds (12)
   - Same bcrypt usage

3. **Maintainability**:
   - Single source of truth for password hashing
   - Changes to hashing logic affect all password operations
   - Easy to test and debug

---

## ✅ Requirements Checklist

- ✅ Created `PUT /api/auth/change-password` route
- ✅ Route protected with existing `authMiddleware`
- ✅ Only authenticated users can change their own password
- ✅ Request body: `{ currentPassword, newPassword }`
- ✅ Validates both passwords provided
- ✅ Verifies current password using existing `comparePassword()`
- ✅ Rejects if current password incorrect (401)
- ✅ Validates new password strength (min 8 chars)
- ✅ Hashes new password using existing pre-save hook
- ✅ Saves updated password to MongoDB
- ✅ Never returns password in response
- ✅ Follows architecture: Route → Controller → Service → Model
- ✅ Register functionality not modified
- ✅ Login functionality not modified
- ✅ JWT generation not modified
- ✅ authMiddleware not modified
- ✅ Comprehensive comments added

---

## 📝 Summary

### **Files Modified**: 3

1. **`src/services/authService.js`**
   - Added `changePassword()` method
   - Verifies current password
   - Validates new password
   - Uses existing password hashing

2. **`src/controllers/authController.js`**
   - Added `changePassword()` method
   - Validates input
   - Handles errors
   - Returns success message only

3. **`src/routes/authRoutes.js`**
   - Added `PUT /api/auth/change-password` route
   - Protected with `authMiddleware`
   - Connected to controller

### **What Was NOT Modified**:
- ✅ User model (reused pre-save hook and comparePassword)
- ✅ Register logic
- ✅ Login logic
- ✅ JWT generation
- ✅ authMiddleware

### **Ready for Testing**:
- ✅ Implementation complete
- ✅ Following existing patterns
- ✅ Express 5 + Mongoose 8 compatible
- ✅ Production-ready code
- ✅ Comprehensive error handling

---

**Status**: ✅ Ready for Postman Testing  
**Next Step**: Test with Postman before committing! 🧪
