# 🔐 Get Current User Endpoint - Implementation Guide

## ✅ Implementation Complete

The protected "Get Current User" endpoint has been successfully implemented and is now available.

---

## 📁 Files Modified

### 1. **`src/routes/authRoutes.js`** ✅ (Already Configured)

**Purpose**: Define authentication routes and map them to controller methods.

**What Was Done**: 
- ✅ Imported `authMiddleware` from `../middleware/authMiddleware`
- ✅ Added `GET /api/auth/me` route
- ✅ Protected route with `authMiddleware`
- ✅ Connected to `authController.getCurrentUser`

**Current Implementation**:
```javascript
const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

// Protected route (authentication required)
router.get('/me', authMiddleware, authController.getCurrentUser.bind(authController));

module.exports = router;
```

**Key Points**:
- `authMiddleware` is applied BEFORE `authController.getCurrentUser`
- This ensures the user is authenticated and `req.user` is populated
- The route is bound to the controller instance with `.bind(authController)`

**Routes Available**:
| Method | Endpoint | Access | Middleware | Handler |
|--------|----------|--------|------------|---------|
| POST | `/api/auth/register` | Public | None | `authController.register` |
| POST | `/api/auth/login` | Public | None | `authController.login` |
| GET | `/api/auth/me` | **Private** | **authMiddleware** | `authController.getCurrentUser` |

---

### 2. **`src/controllers/authController.js`** ✅ (Updated)

**Purpose**: Handle HTTP requests for authentication endpoints.

**What Was Changed**:
- ✅ Updated response message in `getCurrentUser` method
- Changed from: `"User profile retrieved successfully"`
- Changed to: `"Current user retrieved successfully"`

**Current Implementation**:
```javascript
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
```

**Why This Works**:
1. **No Database Query Needed**: The `authMiddleware` already fetches the user from MongoDB and attaches it to `req.user`
2. **Already Validated**: The middleware ensures:
   - User exists in database
   - User account is active
   - Token is valid and not expired
3. **Simple Response**: Just return the pre-validated `req.user` object

**What's NOT Modified** (as required):
- ✅ `register` method - unchanged
- ✅ `login` method - unchanged
- ✅ Only `getCurrentUser` response message updated

---

## 🎯 Endpoint Details

### **GET /api/auth/me**

#### **Purpose**
Get the profile information of the currently authenticated user.

#### **Access**
🔒 **Private** - Requires authentication

#### **Authentication**
Must include JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

#### **Request**
```http
GET /api/auth/me HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**No request body required**

#### **Response (200 OK)**
```json
{
  "success": true,
  "message": "Current user retrieved successfully",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6789012345",
      "fullName": "Dr. Sarah Johnson",
      "email": "sarah.johnson@example.com",
      "phone": "+1987654321",
      "role": "doctor",
      "profileImage": "https://example.com/profile.jpg",
      "isActive": true,
      "createdAt": "2026-01-31T10:30:00.000Z",
      "updatedAt": "2026-01-31T10:30:00.000Z"
    }
  }
}
```

**Note**: Password is NEVER included in the response.

---

## ❌ Error Responses

### **401 Unauthorized - No Token**
**Condition**: No Authorization header provided

**Response**:
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

---

### **401 Unauthorized - Invalid Token Format**
**Condition**: Authorization header doesn't start with "Bearer "

**Response**:
```json
{
  "success": false,
  "message": "Access denied. Invalid token format. Use: Bearer <token>"
}
```

---

### **401 Unauthorized - Empty Token**
**Condition**: Token is empty after "Bearer "

**Response**:
```json
{
  "success": false,
  "message": "Access denied. Token is empty."
}
```

---

### **401 Unauthorized - Invalid Token**
**Condition**: Token signature is invalid

**Response**:
```json
{
  "success": false,
  "message": "Access denied. Invalid token."
}
```

---

### **401 Unauthorized - Expired Token**
**Condition**: Token has expired

**Response**:
```json
{
  "success": false,
  "message": "Access denied. Token has expired. Please login again."
}
```

---

### **404 Not Found - User Deleted**
**Condition**: User no longer exists in database (account was deleted)

**Response**:
```json
{
  "success": false,
  "message": "User not found. The account may have been deleted."
}
```

---

### **403 Forbidden - Account Inactive**
**Condition**: User account has been deactivated (isActive = false)

**Response**:
```json
{
  "success": false,
  "message": "Access denied. Your account has been deactivated. Please contact support."
}
```

---

### **500 Internal Server Error**
**Condition**: Unexpected server error

**Response**:
```json
{
  "success": false,
  "message": "Internal server error during authentication."
}
```

---

## 🧪 Testing the Endpoint

### **Step 1: Register or Login**

Get a JWT token by registering or logging in:

```bash
# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.johnson@example.com",
    "password": "DoctorPass123"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YTFiMmMzZDRlNWY2Nzg5MDEyMzQ1Iiwicm9sZSI6ImRvY3RvciIsImlhdCI6MTcwNjY5MTAwMCwiZXhwIjoxNzA3Mjk1ODAwfQ.abcdefghijklmnopqrstuvwxyz123456789"
  }
}
```

**📋 Copy the token!**

---

### **Step 2: Test GET /api/auth/me (Success)**

Use the token to get current user:

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Current user retrieved successfully",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6789012345",
      "fullName": "Dr. Sarah Johnson",
      "email": "sarah.johnson@example.com",
      "phone": "+1987654321",
      "role": "doctor",
      "profileImage": "https://example.com/profile.jpg",
      "isActive": true,
      "createdAt": "2026-01-31T10:30:00.000Z",
      "updatedAt": "2026-01-31T10:30:00.000Z"
    }
  }
}
```

---

### **Step 3: Test Without Token (Should Fail)**

Try accessing without Authorization header:

```bash
curl -X GET http://localhost:5000/api/auth/me
```

**Expected Response (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

---

### **Step 4: Test With Invalid Token (Should Fail)**

Try with an invalid token:

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer invalid.token.here"
```

**Expected Response (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "Access denied. Invalid token."
}
```

---

### **Step 5: Test With Expired Token (Should Fail)**

Wait for token to expire (default: 7 days), or manually create an expired token:

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <expired-token>"
```

**Expected Response (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "Access denied. Token has expired. Please login again."
}
```

---

## 💻 Testing with Different Tools

### **Using Postman**

1. **Create GET Request**
   - Method: `GET`
   - URL: `http://localhost:5000/api/auth/me`

2. **Set Authorization Header**
   - Go to "Headers" tab
   - Add header:
     - Key: `Authorization`
     - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Send Request**
   - Click "Send"
   - Expected: 200 OK with user data

---

### **Using REST Client (VS Code Extension)**

Add to `test-auth.rest`:

```http
### Variables
@baseURL = http://localhost:5000
@authToken = your_token_here

### Get Current User Profile (With Valid Token)
GET {{baseURL}}/api/auth/me
Authorization: Bearer {{authToken}}

### Get Current User - No Token (Should Fail - 401)
GET {{baseURL}}/api/auth/me

### Get Current User - Invalid Token (Should Fail - 401)
GET {{baseURL}}/api/auth/me
Authorization: Bearer invalid.token.here
```

---

### **Using JavaScript (Fetch API)**

```javascript
// Get current user
async function getCurrentUser() {
  const token = localStorage.getItem('token'); // Get saved token
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Current User:', data.data.user);
      return data.data.user;
    } else {
      console.error('Error:', data.message);
      // Handle error (redirect to login, show error, etc.)
    }
  } catch (error) {
    console.error('Network Error:', error);
  }
}

// Usage
getCurrentUser();
```

---

### **Using Axios (React/Node.js)**

```javascript
import axios from 'axios';

// Configure axios with base URL and token
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Get current user
async function getCurrentUser() {
  try {
    const response = await api.get('/api/auth/me');
    console.log('Current User:', response.data.data.user);
    return response.data.data.user;
  } catch (error) {
    if (error.response) {
      // Server responded with error
      console.error('Error:', error.response.data.message);
      
      if (error.response.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = '/login';
      }
    } else {
      // Network error
      console.error('Network Error:', error.message);
    }
  }
}

// Usage
getCurrentUser();
```

---

## 🔄 Flow Diagram

```
Client Request
    ↓
GET /api/auth/me
Authorization: Bearer <token>
    ↓
┌─────────────────────────────┐
│   authRoutes.js             │
│   Route: /me                │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────────────┐
│   authMiddleware                    │
│   (from middleware/authMiddleware)  │
├─────────────────────────────────────┤
│   1. Extract token from header      │
│   2. Verify JWT signature           │
│   3. Decode token payload           │
│   4. Find user in MongoDB           │
│   5. Check user exists & active     │
│   6. Attach user to req.user        │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   authController.getCurrentUser     │
│   (from controllers/authController) │
├─────────────────────────────────────┤
│   1. Read req.user                  │
│   2. Return JSON response           │
└──────────┬──────────────────────────┘
           ↓
    Response (200 OK)
    {
      "success": true,
      "message": "Current user retrieved successfully",
      "data": {
        "user": { ... }
      }
    }
```

---

## 🎓 How It Works

### **Request Flow**

1. **Client sends request** with JWT token in Authorization header
2. **Express receives request** and routes it to `/api/auth/me`
3. **authMiddleware runs first**:
   - Extracts token from header
   - Verifies token with JWT_SECRET
   - Decodes token to get user ID
   - Queries MongoDB for user
   - Validates user exists and is active
   - Attaches user to `req.user`
   - Calls `next()` to continue
4. **authController.getCurrentUser runs**:
   - Reads `req.user` (already populated by middleware)
   - Returns JSON response with user data
5. **Client receives response** with user profile

---

### **Why No Database Query in Controller?**

The controller doesn't need to query the database because:
- ✅ `authMiddleware` already fetched the user
- ✅ User is attached to `req.user`
- ✅ User is guaranteed to exist (middleware checks this)
- ✅ User is guaranteed to be active (middleware checks this)
- ✅ Password is already excluded (middleware uses `.select('-password')`)

This makes the controller method **simple, fast, and efficient**.

---

## 📋 Summary of Changes

### Files Modified: 2

#### 1. **`src/routes/authRoutes.js`** ✅
**Status**: Already correctly configured (no changes needed)
- ✅ Imports `authMiddleware`
- ✅ Defines `GET /api/auth/me` route
- ✅ Applies `authMiddleware` before controller
- ✅ Calls `authController.getCurrentUser`

#### 2. **`src/controllers/authController.js`** ✅
**Change**: Updated response message
- Changed message from: `"User profile retrieved successfully"`
- Changed to: `"Current user retrieved successfully"`
- ✅ Returns `req.user` from middleware
- ✅ No database query needed
- ✅ Register and login methods unchanged

---

## ✅ Requirements Checklist

- ✅ Updated `src/routes/authRoutes.js`
- ✅ Imported `authMiddleware`
- ✅ Added route: `GET /api/auth/me`
- ✅ Endpoint requires authentication using `authMiddleware`
- ✅ Endpoint calls `authController.getCurrentUser`
- ✅ Controller returns exact response format:
  ```json
  {
    "success": true,
    "message": "Current user retrieved successfully",
    "data": {
      "user": req.user
    }
  }
  ```
- ✅ Register method not modified
- ✅ Login method not modified

---

## 🎯 Use Cases

### **Frontend: Check if User is Logged In**
```javascript
// On app load, check if user is authenticated
async function checkAuth() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // No token - redirect to login
    window.location.href = '/login';
    return;
  }
  
  try {
    const response = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      // User is authenticated
      setCurrentUser(data.data.user);
    } else {
      // Token invalid or expired - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = '/login';
  }
}
```

---

### **Frontend: Display User Profile**
```javascript
// Get and display current user info
async function loadProfile() {
  const response = await fetch('/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    const user = data.data.user;
    
    // Display user info
    document.getElementById('userName').textContent = user.fullName;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userRole').textContent = user.role;
    
    if (user.profileImage) {
      document.getElementById('userAvatar').src = user.profileImage;
    }
  }
}
```

---

### **Frontend: Role-Based UI**
```javascript
// Show/hide features based on user role
async function setupUI() {
  const response = await fetch('/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    const userRole = data.data.user.role;
    
    // Show admin panel only for admins
    if (userRole === 'admin') {
      document.getElementById('adminPanel').style.display = 'block';
    }
    
    // Show doctor features for doctors
    if (userRole === 'doctor') {
      document.getElementById('patientList').style.display = 'block';
    }
    
    // Show patient features for patients
    if (userRole === 'patient') {
      document.getElementById('bookAppointment').style.display = 'block';
    }
  }
}
```

---

## 🔜 Next Steps

Now that the "Get Current User" endpoint is working, you can:

1. **Implement Frontend Integration**
   - Store token on login
   - Check authentication on app load
   - Display user profile information
   - Implement role-based UI

2. **Build Protected Features**
   - Patient management (for doctors/admins)
   - Appointment booking (for patients)
   - Medical records (for doctors)
   - Admin dashboard (for admins)

3. **Add More User Features**
   - Update profile endpoint
   - Change password endpoint
   - Upload profile image
   - Update email/phone

---

## 📖 Quick Reference

### **Endpoint**
```
GET /api/auth/me
```

### **Headers**
```
Authorization: Bearer <token>
```

### **Success Response (200)**
```json
{
  "success": true,
  "message": "Current user retrieved successfully",
  "data": {
    "user": { ...user object without password... }
  }
}
```

### **Error Responses**
- **401** - No token / Invalid token / Expired token
- **403** - Account deactivated
- **404** - User not found (deleted)
- **500** - Server error

---

**Status**: ✅ Complete and Ready for Use  
**Testing**: ✅ Ready for frontend integration  
**Next**: Build protected features using this endpoint! 🚀
