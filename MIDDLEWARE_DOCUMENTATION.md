# Authentication Middleware Documentation

## ✅ Implementation Complete

Production-ready JWT authentication middleware has been successfully implemented for the Digital Clinic Management System.

---

## 📁 Files Created/Modified

### 1. **`src/middleware/authMiddleware.js`** (NEW ✨)

**Purpose**: JWT-based authentication and authorization middleware for protecting routes.

**Exports 4 Middleware Functions**:

#### A. `authMiddleware` (Primary Authentication)

**Purpose**: Protects routes by verifying JWT tokens and attaching authenticated user to request.

**Workflow**:
```
1. Extract token from Authorization header (Bearer format)
2. Verify token signature and expiration using JWT_SECRET
3. Fetch user from MongoDB using token payload (user ID)
4. Validate user exists and account is active
5. Attach user to req.user
6. Continue to next middleware/handler
```

**Usage**:
```javascript
// Protect a single route
router.get('/profile', authMiddleware, getProfile);

// Protect all routes in a router
router.use(authMiddleware);
router.get('/appointments', getAppointments);
```

**Token Format Required**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success**:
- `req.user` is populated with user object (without password)
- `req.token` contains decoded JWT payload
- Calls `next()` to continue

**Error Responses**:

| Status | Condition | Message |
|--------|-----------|---------|
| 401 | No Authorization header | "Access denied. No token provided." |
| 401 | Invalid format (not Bearer) | "Access denied. Invalid token format. Use: Bearer <token>" |
| 401 | Empty token | "Access denied. Token is empty." |
| 401 | Token expired | "Access denied. Token has expired. Please login again." |
| 401 | Invalid token signature | "Access denied. Invalid token." |
| 401 | Token not yet valid | "Access denied. Token not yet valid." |
| 404 | User not found | "User not found. The account may have been deleted." |
| 403 | Account inactive | "Access denied. Your account has been deactivated. Please contact support." |
| 500 | JWT_SECRET missing | "Server configuration error. Please contact support." |

**What Gets Attached to req.user**:
```javascript
{
  _id: "65a1b2c3d4e5f6789012345",
  fullName: "Dr. Sarah Johnson",
  email: "sarah.johnson@example.com",
  phone: "+1987654321",
  role: "doctor",
  profileImage: "https://...",
  isActive: true,
  createdAt: "2026-01-31T10:30:00.000Z",
  updatedAt: "2026-01-31T10:30:00.000Z"
}
```

**Security Features**:
- ✅ Verifies token signature
- ✅ Checks token expiration
- ✅ Validates user still exists
- ✅ Checks account active status
- ✅ Password never included in req.user
- ✅ Detailed error messages for debugging
- ✅ Prevents information leakage in production

---

#### B. `optionalAuth` (Soft Authentication)

**Purpose**: Attempts authentication but doesn't fail if no token provided. Useful for routes with different behavior for authenticated vs unauthenticated users.

**Behavior**:
- If valid token: `req.user` is set
- If no token or invalid: `req.user` is undefined, request continues
- Never returns error responses - always calls `next()`

**Usage**:
```javascript
// Public route that shows different data if authenticated
router.get('/doctors', optionalAuth, getDoctorsList);
```

**Use Cases**:
- Public endpoints that show extra info for authenticated users
- Listings that filter based on authentication status
- Content that has both public and private portions

---

#### C. `requireRole(...allowedRoles)` (Role-Based Access Control)

**Purpose**: Restricts route access based on user role. Must be used AFTER `authMiddleware`.

**Parameters**:
- `...allowedRoles` - One or more roles that can access the route

**Usage**:
```javascript
// Only admin can access
router.delete('/users/:id', authMiddleware, requireRole('admin'), deleteUser);

// Admin OR doctor can access
router.get('/patients', authMiddleware, requireRole('admin', 'doctor'), getPatients);

// All authenticated users (any role)
router.get('/profile', authMiddleware, getProfile);
```

**Error Responses**:

| Status | Condition | Message |
|--------|-----------|---------|
| 401 | No req.user (authMiddleware not used) | "Access denied. Authentication required." |
| 403 | User role not in allowed roles | "Access denied. This resource requires admin or doctor role." |

**Common Role Combinations**:
```javascript
// Admin only
requireRole('admin')

// Admin or Doctor
requireRole('admin', 'doctor')

// Admin or Patient
requireRole('admin', 'patient')

// All roles (not really needed, just use authMiddleware)
requireRole('admin', 'doctor', 'patient')
```

---

#### D. `requireOwnership(userIdParam)` (Resource Ownership)

**Purpose**: Ensures users can only access their own resources. Admins bypass this check.

**Parameters**:
- `userIdParam` - Name of route parameter containing user ID (default: 'userId')

**Usage**:
```javascript
// User can only update their own profile (admin can update any)
router.put('/users/:userId', authMiddleware, requireOwnership('userId'), updateProfile);

// User can only view their own appointments (admin can view any)
router.get('/appointments/:userId', authMiddleware, requireOwnership('userId'), getAppointments);
```

**Behavior**:
- If user is admin → always allows access
- If user ID matches route parameter → allows access
- Otherwise → denies access

**Error Responses**:

| Status | Condition | Message |
|--------|-----------|---------|
| 401 | No req.user | "Access denied. Authentication required." |
| 403 | User ID doesn't match | "Access denied. You can only access your own resources." |

---

### 2. **`src/routes/authRoutes.js`** (MODIFIED 🔧)

**Changes Made**:
- Imported `authMiddleware` from middleware
- Activated GET /api/auth/me route (was commented out)
- Added authMiddleware to protect the /me endpoint

**Before**:
```javascript
// router.get('/me', authMiddleware, authController.getCurrentUser.bind(authController));
```

**After**:
```javascript
router.get('/me', authMiddleware, authController.getCurrentUser.bind(authController));
```

**New Route Available**:
- `GET /api/auth/me` - Get current user profile (protected)

---

### 3. **`src/controllers/authController.js`** (MODIFIED 🔧)

**Changes Made**:
- Simplified `getCurrentUser()` method
- Removed redundant user fetching (middleware already does this)
- Removed error handling for missing user (middleware handles this)

**Before** (Complex):
```javascript
async getCurrentUser(req, res, next) {
  const userId = req.user?.id;
  if (!userId) { /* error */ }
  const user = await authService.getUserById(userId);
  // Return user...
}
```

**After** (Simple):
```javascript
async getCurrentUser(req, res, next) {
  // User already validated and attached by authMiddleware
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: { user: req.user }
  });
}
```

**Why This Works**:
- `authMiddleware` already fetches user from database
- `authMiddleware` already validates user exists and is active
- `req.user` is guaranteed to be valid when handler runs
- No need to duplicate validation logic

---

## 🎯 Available Endpoints

### 1. Get Current User Profile (NEW)

**Endpoint**: `GET /api/auth/me`

**Access**: Private (requires authentication)

**Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6789012345",
      "fullName": "Dr. Sarah Johnson",
      "email": "sarah.johnson@example.com",
      "phone": "+1987654321",
      "role": "doctor",
      "profileImage": "https://...",
      "isActive": true,
      "createdAt": "2026-01-31T10:30:00.000Z",
      "updatedAt": "2026-01-31T10:30:00.000Z"
    }
  }
}
```

**Error Responses**:

401 Unauthorized (No Token):
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

401 Unauthorized (Invalid Token):
```json
{
  "success": false,
  "message": "Access denied. Invalid token."
}
```

401 Unauthorized (Expired Token):
```json
{
  "success": false,
  "message": "Access denied. Token has expired. Please login again."
}
```

404 Not Found (User Deleted):
```json
{
  "success": false,
  "message": "User not found. The account may have been deleted."
}
```

403 Forbidden (Account Inactive):
```json
{
  "success": false,
  "message": "Access denied. Your account has been deactivated. Please contact support."
}
```

---

## 🧪 Testing the Middleware

### Step 1: Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"Password123\",\"phone\":\"+1234567890\",\"role\":\"patient\"}"
```

**Save the token** from the response!

### Step 2: Test Protected Endpoint

```bash
# Replace YOUR_TOKEN_HERE with actual token
curl -X GET http://localhost:5000/api/auth/me ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 3: Test Without Token (Should Fail)

```bash
curl -X GET http://localhost:5000/api/auth/me
```

**Expected**: 401 Unauthorized

### Step 4: Test With Invalid Token (Should Fail)

```bash
curl -X GET http://localhost:5000/api/auth/me ^
  -H "Authorization: Bearer invalid.token.here"
```

**Expected**: 401 Unauthorized

---

## 💻 Usage Examples

### Example 1: Protect a Single Route

```javascript
const { authMiddleware } = require('../middleware/authMiddleware');

// Only authenticated users can access
router.get('/appointments', authMiddleware, async (req, res) => {
  // req.user is available here
  const userId = req.user._id;
  const appointments = await Appointment.find({ userId });
  res.json({ success: true, data: appointments });
});
```

### Example 2: Protect Multiple Routes

```javascript
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply to all routes in this router
router.use(authMiddleware);

router.get('/appointments', getAppointments);
router.post('/appointments', createAppointment);
router.put('/appointments/:id', updateAppointment);
// All routes above require authentication
```

### Example 3: Role-Based Access

```javascript
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Only admin can delete users
router.delete('/users/:id',
  authMiddleware,
  requireRole('admin'),
  deleteUser
);

// Admin or doctor can view patient records
router.get('/patients/:id',
  authMiddleware,
  requireRole('admin', 'doctor'),
  getPatientRecord
);
```

### Example 4: Resource Ownership

```javascript
const { authMiddleware, requireOwnership } = require('../middleware/authMiddleware');

// User can only update their own profile (unless admin)
router.put('/users/:userId/profile',
  authMiddleware,
  requireOwnership('userId'),
  updateProfile
);
```

### Example 5: Combining Multiple Middleware

```javascript
const { authMiddleware, requireRole, requireOwnership } = require('../middleware/authMiddleware');

// Complex authorization: Must be authenticated, be admin OR owner
router.put('/users/:userId',
  authMiddleware,
  (req, res, next) => {
    // Custom logic: allow if admin OR owner
    if (req.user.role === 'admin' || req.user._id.toString() === req.params.userId) {
      return next();
    }
    res.status(403).json({ success: false, message: 'Access denied' });
  },
  updateUser
);
```

### Example 6: Optional Authentication

```javascript
const { optionalAuth } = require('../middleware/authMiddleware');

// Public route with optional authentication
router.get('/doctors', optionalAuth, async (req, res) => {
  // Show all doctors, but add extra info if authenticated
  const doctors = await Doctor.find();
  
  if (req.user) {
    // User is authenticated - add extra fields
    return res.json({ success: true, data: doctors, authenticated: true });
  }
  
  // Public view - limited info
  res.json({ success: true, data: doctors, authenticated: false });
});
```

---

## 🔐 Security Features

### Token Security
- ✅ Verifies JWT signature with JWT_SECRET
- ✅ Checks token expiration automatically
- ✅ Validates token structure and payload
- ✅ Extracts token from Authorization header (industry standard)
- ✅ Supports Bearer token format only

### User Validation
- ✅ Fetches user from database on every request
- ✅ Ensures user still exists (prevents deleted user access)
- ✅ Checks account active status (prevents suspended user access)
- ✅ Password always excluded from req.user

### Error Handling
- ✅ Specific error messages for debugging
- ✅ Appropriate HTTP status codes
- ✅ No sensitive information leakage
- ✅ Handles all JWT error types (expired, invalid, not before)
- ✅ Catches and logs unexpected errors

### Best Practices
- ✅ Async/await throughout
- ✅ Express 5 compatible
- ✅ Mongoose 8 compatible
- ✅ Reusable middleware functions
- ✅ Comprehensive JSDoc comments
- ✅ Consistent JSON response format

---

## 📊 Middleware Flow Diagram

```
Request with Token
       ↓
┌─────────────────────┐
│  authMiddleware     │
├─────────────────────┤
│ 1. Extract token    │
│    from header      │
│                     │
│ 2. Verify token     │
│    signature        │
│                     │
│ 3. Fetch user       │
│    from MongoDB     │
│                     │
│ 4. Validate user    │
│    exists & active  │
│                     │
│ 5. Attach to        │
│    req.user         │
└─────────┬───────────┘
          ↓
   ┌─────────────┐
   │ requireRole │ (optional)
   │ Check role  │
   └──────┬──────┘
          ↓
┌────────────────────┐
│ requireOwnership   │ (optional)
│ Check ownership    │
└─────────┬──────────┘
          ↓
   Route Handler
   (has access to req.user)
```

---

## 🎓 Understanding req.user

After `authMiddleware` runs successfully, `req.user` contains:

```javascript
{
  _id: ObjectId("..."),        // MongoDB ID
  fullName: "Dr. Sarah Johnson",
  email: "sarah.johnson@example.com",
  phone: "+1987654321",
  role: "doctor",              // admin, doctor, or patient
  profileImage: "https://...",
  isActive: true,
  createdAt: Date,
  updatedAt: Date
  // Note: password is NEVER included
}
```

You can access it in any route handler:

```javascript
router.get('/example', authMiddleware, (req, res) => {
  const userName = req.user.fullName;
  const userRole = req.user.role;
  const userId = req.user._id;
  
  console.log(`${userName} (${userRole}) is accessing this route`);
});
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T: Use authMiddleware after route handler
```javascript
// WRONG - middleware must come before handler
router.get('/profile', getProfile, authMiddleware);
```

### ✅ DO: Use authMiddleware before route handler
```javascript
// CORRECT
router.get('/profile', authMiddleware, getProfile);
```

---

### ❌ DON'T: Use requireRole without authMiddleware
```javascript
// WRONG - requireRole needs req.user from authMiddleware
router.get('/admin', requireRole('admin'), handler);
```

### ✅ DO: Use authMiddleware first, then requireRole
```javascript
// CORRECT
router.get('/admin', authMiddleware, requireRole('admin'), handler);
```

---

### ❌ DON'T: Send token in URL or body
```javascript
// WRONG - tokens should not be in URL
GET /api/auth/me?token=xyz

// WRONG - tokens should not be in body
POST /api/auth/me
{ "token": "xyz" }
```

### ✅ DO: Send token in Authorization header
```javascript
// CORRECT
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### ❌ DON'T: Forget to handle missing req.user
```javascript
// WRONG - might crash if authMiddleware not used
router.get('/profile', (req, res) => {
  const name = req.user.fullName; // Error if req.user is undefined
});
```

### ✅ DO: Either use authMiddleware or check req.user
```javascript
// CORRECT - authMiddleware ensures req.user exists
router.get('/profile', authMiddleware, (req, res) => {
  const name = req.user.fullName; // Safe
});

// OR check manually
router.get('/profile', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const name = req.user.fullName;
});
```

---

## 🔜 Next Steps

Now that you have authentication middleware, you can:

1. **Protect Existing Routes**
   - Add authMiddleware to routes that need authentication
   - Use requireRole for role-based access

2. **Build Resource-Specific Routes**
   - Patient management (admin, doctor access)
   - Doctor management (admin access)
   - Appointment management (role-based)

3. **Implement Profile Management**
   - Update profile endpoint (with requireOwnership)
   - Change password endpoint
   - Upload profile image

4. **Add Advanced Features**
   - Refresh tokens
   - Token blacklisting
   - Rate limiting per user
   - Activity logging

---

## 📚 Quick Reference

### Import Middleware
```javascript
const { authMiddleware, requireRole, requireOwnership, optionalAuth } = require('../middleware/authMiddleware');
```

### Protect Route
```javascript
router.get('/protected', authMiddleware, handler);
```

### Role-Based Access
```javascript
router.delete('/resource', authMiddleware, requireRole('admin'), handler);
```

### Owner or Admin Only
```javascript
router.put('/users/:userId', authMiddleware, requireOwnership('userId'), handler);
```

### Optional Auth
```javascript
router.get('/public', optionalAuth, handler);
```

---

**Implementation Date**: January 31, 2026  
**Status**: ✅ Complete and Production-Ready  
**Next**: Protect your routes and build role-based features! 🚀
