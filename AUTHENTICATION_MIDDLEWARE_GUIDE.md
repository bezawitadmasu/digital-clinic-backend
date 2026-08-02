# 🔐 JWT Authentication Middleware - Complete Guide

## ✅ Implementation Complete

Production-ready JWT authentication middleware has been successfully implemented for the Digital Clinic Management System.

---

## 📁 File Created

### **`src/middleware/authMiddleware.js`**

**Purpose**: Complete JWT authentication and role-based authorization middleware suite.

**Location**: `f:\projects\digital-clinic-backend\src\middleware\authMiddleware.js`

**Size**: ~350 lines of production-ready code

**Exports**: 5 middleware functions
- `authMiddleware` - Primary JWT authentication
- `authorizeRoles(...roles)` - Role-based access control
- `requireRole(...roles)` - Alias for authorizeRoles
- `optionalAuth` - Soft authentication (optional)
- `requireOwnership(param)` - Resource ownership validation

---

## 🎯 Middleware Functions Explained

### 1. **`authMiddleware`** - Primary Authentication Middleware

#### **Purpose**
Protects routes by verifying JWT tokens and attaching authenticated user to the request object.

#### **How It Works**

**Step 1: Extract Token from Authorization Header**
```javascript
// Reads from: Authorization: Bearer <token>
const authHeader = req.headers.authorization;
const token = authHeader.substring(7); // Remove "Bearer "
```

**Validates**:
- Authorization header exists
- Header starts with "Bearer "
- Token is not empty

**Returns 401** if:
- No Authorization header
- Invalid format (not "Bearer ")
- Empty token

---

**Step 2: Verify JWT Token**
```javascript
// Verify using JWT_SECRET from environment
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

**Validates**:
- Token signature is valid
- Token has not expired
- Token contains valid payload

**Returns 401** if:
- Invalid token signature
- Expired token (TokenExpiredError)
- Token not yet valid (NotBeforeError)
- Invalid token structure

**Returns 500** if:
- JWT_SECRET not configured

---

**Step 3: Find User in Database**
```javascript
// Fetch user from MongoDB, excluding password
const user = await User.findById(decoded.id).select('-password');
```

**Validates**:
- Decoded token contains user ID
- User exists in database

**Returns 401** if:
- Token payload missing user ID

**Returns 404** if:
- User not found in database (deleted account)

---

**Step 4: Validate User Account Status**
```javascript
// Check if account is active
if (!user.isActive) {
  // Return 403 Forbidden
}
```

**Validates**:
- User account is active (isActive = true)

**Returns 403** if:
- Account has been deactivated

---

**Step 5: Attach User to Request**
```javascript
// Attach user object to request
req.user = user;
req.token = decoded;
next(); // Continue to next middleware/handler
```

**Attaches**:
- `req.user` - Full user object (without password)
- `req.token` - Decoded JWT payload

**Calls `next()`** to continue to next middleware/handler

---

#### **Usage Examples**

**Protect a Single Route**:
```javascript
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/profile', authMiddleware, (req, res) => {
  // req.user is available here
  res.json({ user: req.user });
});
```

**Protect All Routes in a Router**:
```javascript
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply to all routes below
router.use(authMiddleware);

router.get('/appointments', getAppointments);
router.post('/appointments', createAppointment);
// All routes above require authentication
```

---

#### **What's in req.user**

After `authMiddleware` runs successfully:

```javascript
req.user = {
  _id: ObjectId("65a1b2c3d4e5f6789012345"),  // MongoDB ID
  fullName: "Dr. Sarah Johnson",             // Full name
  email: "sarah.johnson@example.com",        // Email (lowercase)
  phone: "+1987654321",                      // Phone number
  role: "doctor",                            // Role: admin, doctor, or patient
  profileImage: "https://example.com/...",   // Profile image URL (or null)
  isActive: true,                            // Account status
  createdAt: Date("2026-01-31T10:30:00Z"),   // Registration date
  updatedAt: Date("2026-01-31T10:35:00Z")    // Last update date
  // Note: password is NEVER included (excluded by .select('-password'))
}
```

---

#### **Error Responses**

| Status Code | Condition | Response Message |
|-------------|-----------|------------------|
| **401** | No Authorization header | "Access denied. No token provided." |
| **401** | Invalid format (not Bearer) | "Access denied. Invalid token format. Use: Bearer <token>" |
| **401** | Empty token | "Access denied. Token is empty." |
| **401** | Token expired | "Access denied. Token has expired. Please login again." |
| **401** | Invalid token signature | "Access denied. Invalid token." |
| **401** | Token not yet valid | "Access denied. Token not yet valid." |
| **401** | Invalid token payload | "Access denied. Invalid token payload." |
| **404** | User not found | "User not found. The account may have been deleted." |
| **403** | Account inactive | "Access denied. Your account has been deactivated. Please contact support." |
| **500** | JWT_SECRET missing | "Server configuration error. Please contact support." |
| **500** | Unexpected error | "Internal server error during authentication." |

---

### 2. **`authorizeRoles(...roles)`** - Role-Based Access Control

#### **Purpose**
Restricts route access to specific user roles. Must be used AFTER `authMiddleware`.

#### **How It Works**

**Step 1: Check Authentication**
```javascript
// Verify user is authenticated
if (!req.user) {
  return res.status(401).json({ message: 'Authentication required.' });
}
```

**Step 2: Check Role**
```javascript
// Check if user's role is in allowed roles
if (!allowedRoles.includes(req.user.role)) {
  return res.status(403).json({ 
    message: 'Access denied. This resource requires admin or doctor role.' 
  });
}
```

**Step 3: Allow Access**
```javascript
// User has required role
next();
```

---

#### **Parameters**

**`...allowedRoles`** (rest parameter)
- Type: `string[]`
- Description: One or more roles that can access the route
- Valid roles: `'admin'`, `'doctor'`, `'patient'`

---

#### **Usage Examples**

**Only Admin Can Access**:
```javascript
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

router.delete('/users/:id',
  authMiddleware,              // Step 1: Verify authentication
  authorizeRoles('admin'),     // Step 2: Verify admin role
  deleteUser                   // Step 3: Execute handler
);
```

**Admin OR Doctor Can Access**:
```javascript
router.get('/patients',
  authMiddleware,
  authorizeRoles('admin', 'doctor'),  // Multiple roles allowed
  getPatients
);
```

**All Authenticated Users** (any role):
```javascript
// Just use authMiddleware without authorizeRoles
router.get('/profile',
  authMiddleware,  // Any authenticated user
  getProfile
);
```

---

#### **Error Responses**

| Status Code | Condition | Response Message |
|-------------|-----------|------------------|
| **401** | No req.user (authMiddleware not used) | "Access denied. Authentication required." |
| **403** | User role not in allowed roles | "Access denied. This resource requires admin or doctor role." |

---

#### **Common Patterns**

```javascript
// Pattern 1: Admin only
authorizeRoles('admin')

// Pattern 2: Admin or Doctor
authorizeRoles('admin', 'doctor')

// Pattern 3: Admin or Patient
authorizeRoles('admin', 'patient')

// Pattern 4: Doctor or Patient (non-admin)
authorizeRoles('doctor', 'patient')

// Pattern 5: All roles (not really needed, just use authMiddleware)
authorizeRoles('admin', 'doctor', 'patient')
```

---

#### **Complete Example: Patient Management**

```javascript
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

// Get all patients - Admin and Doctor only
router.get('/patients',
  authMiddleware,
  authorizeRoles('admin', 'doctor'),
  async (req, res) => {
    const patients = await User.find({ role: 'patient' });
    res.json({ success: true, data: patients });
  }
);

// Get single patient - Admin, Doctor, or the patient themselves
router.get('/patients/:id',
  authMiddleware,
  async (req, res) => {
    // Custom authorization logic
    if (
      req.user.role === 'admin' ||
      req.user.role === 'doctor' ||
      req.user._id.toString() === req.params.id
    ) {
      const patient = await User.findById(req.params.id);
      return res.json({ success: true, data: patient });
    }
    
    res.status(403).json({ success: false, message: 'Access denied' });
  }
);

// Delete patient - Admin only
router.delete('/patients/:id',
  authMiddleware,
  authorizeRoles('admin'),
  async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Patient deleted' });
  }
);
```

---

### 3. **`requireRole(...roles)`** - Alias for authorizeRoles

#### **Purpose**
Alternative name for `authorizeRoles`. Both functions work exactly the same way.

#### **Usage**
```javascript
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// These two are identical:
router.delete('/users/:id', authMiddleware, authorizeRoles('admin'), deleteUser);
router.delete('/users/:id', authMiddleware, requireRole('admin'), deleteUser);
```

**Note**: Use either `authorizeRoles` or `requireRole` - they're interchangeable.

---

### 4. **`optionalAuth`** - Soft Authentication (Optional)

#### **Purpose**
Attempts authentication but doesn't fail if no token is provided. Useful for routes that show different content for authenticated vs unauthenticated users.

#### **How It Works**

**Behavior**:
- If valid token exists: Sets `req.user`
- If no token: Continues without `req.user` (no error)
- If invalid token: Continues without `req.user` (no error)
- Never returns error responses - always calls `next()`

---

#### **Usage Examples**

**Public Route with Optional Extra Features**:
```javascript
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/doctors', optionalAuth, async (req, res) => {
  const doctors = await Doctor.find();
  
  if (req.user) {
    // User is authenticated - show extra info
    return res.json({
      success: true,
      authenticated: true,
      data: doctors,
      userRole: req.user.role
    });
  }
  
  // Public view - basic info only
  res.json({
    success: true,
    authenticated: false,
    data: doctors
  });
});
```

**Use Cases**:
- Public listings with enhanced data for authenticated users
- Content with both public and private sections
- Features that are optional but enhanced with authentication

---

### 5. **`requireOwnership(userIdParam)`** - Resource Ownership Validation

#### **Purpose**
Ensures users can only access their own resources. Admins bypass this check.

#### **Parameters**

**`userIdParam`** (optional)
- Type: `string`
- Default: `'userId'`
- Description: Name of the route parameter containing the user ID

---

#### **Usage Examples**

**User Can Only Update Own Profile**:
```javascript
const { authMiddleware, requireOwnership } = require('../middleware/authMiddleware');

router.put('/users/:userId/profile',
  authMiddleware,
  requireOwnership('userId'),  // Parameter name is 'userId'
  async (req, res) => {
    // User can only update their own profile (unless admin)
    await User.findByIdAndUpdate(req.params.userId, req.body);
    res.json({ success: true });
  }
);
```

**Custom Parameter Name**:
```javascript
router.get('/appointments/:patientId',
  authMiddleware,
  requireOwnership('patientId'),  // Custom parameter name
  getPatientAppointments
);
```

---

#### **Behavior**

**If User is Admin**:
- ✅ Always allows access (admins can access any resource)

**If User ID Matches Parameter**:
- ✅ Allows access (user is the owner)

**Otherwise**:
- ❌ Returns 403 Forbidden

---

#### **Error Responses**

| Status Code | Condition | Response Message |
|-------------|-----------|------------------|
| **401** | No req.user (not authenticated) | "Access denied. Authentication required." |
| **403** | User ID doesn't match parameter | "Access denied. You can only access your own resources." |

---

## 🔐 Security Features

### ✅ Token Security
- **Signature Verification**: JWT signature verified with `JWT_SECRET`
- **Expiration Checking**: Expired tokens automatically rejected
- **Bearer Format**: Industry-standard Authorization header format
- **Secure Extraction**: Token only accepted from Authorization header (not URL/body)

### ✅ User Validation
- **Real-time Lookup**: User fetched from database on every request
- **Existence Check**: Ensures user still exists (catches deleted accounts)
- **Active Status**: Validates account is active (catches suspended accounts)
- **Password Exclusion**: Password NEVER included in `req.user`

### ✅ Error Handling
- **Specific Errors**: Different messages for each failure type
- **Appropriate Status Codes**: 401 (auth), 403 (forbidden), 404 (not found), 500 (server)
- **No Information Leakage**: Generic errors in production
- **JWT Error Types**: Handles expired, invalid, and not-before errors

### ✅ Best Practices
- **Async/await**: Modern async patterns throughout
- **Express 5 Compatible**: Works with latest Express version
- **Mongoose 8 Compatible**: Uses current Mongoose patterns
- **Clean Architecture**: Separation of concerns
- **Comprehensive Comments**: Detailed JSDoc and inline comments
- **Reusable Functions**: Modular middleware design

---

## 🧪 Testing the Middleware

### Step 1: Setup Environment
```env
# .env file
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Step 2: Register/Login to Get Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123"}'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Copy the token!**

### Step 3: Test Protected Endpoint
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected**: 200 OK with user data

### Step 4: Test Without Token
```bash
curl -X GET http://localhost:5000/api/auth/me
```

**Expected**: 401 Unauthorized

### Step 5: Test Role Authorization
```bash
# Create admin-only endpoint
curl -X DELETE http://localhost:5000/api/users/123 \
  -H "Authorization: Bearer PATIENT_TOKEN"
```

**Expected**: 403 Forbidden (if patient token)

---

## 💻 Implementation Examples

### Example 1: Basic Protected Route
```javascript
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/appointments', authMiddleware, async (req, res) => {
  // req.user is available
  const userId = req.user._id;
  const appointments = await Appointment.find({ userId });
  
  res.json({
    success: true,
    data: appointments
  });
});
```

---

### Example 2: Admin-Only Route
```javascript
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

router.delete('/users/:id',
  authMiddleware,
  authorizeRoles('admin'),
  async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  }
);
```

---

### Example 3: Admin or Doctor Route
```javascript
router.get('/patients',
  authMiddleware,
  authorizeRoles('admin', 'doctor'),
  async (req, res) => {
    const patients = await User.find({ role: 'patient' });
    res.json({ success: true, data: patients });
  }
);
```

---

### Example 4: Owner or Admin Route
```javascript
const { authMiddleware, requireOwnership } = require('../middleware/authMiddleware');

router.put('/users/:userId/profile',
  authMiddleware,
  requireOwnership('userId'),
  async (req, res) => {
    // User can only update their own profile (unless admin)
    const updated = await User.findByIdAndUpdate(
      req.params.userId,
      req.body,
      { new: true }
    );
    res.json({ success: true, data: updated });
  }
);
```

---

### Example 5: Complex Authorization
```javascript
router.post('/appointments',
  authMiddleware,
  async (req, res) => {
    // Custom logic: Patients create for themselves, doctors/admins can create for anyone
    if (req.user.role === 'patient') {
      // Patients can only create appointments for themselves
      req.body.patientId = req.user._id;
    }
    
    const appointment = await Appointment.create(req.body);
    res.json({ success: true, data: appointment });
  }
);
```

---

### Example 6: Optional Authentication
```javascript
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/doctors', optionalAuth, async (req, res) => {
  const doctors = await Doctor.find();
  
  // If authenticated, include contact information
  if (req.user) {
    return res.json({
      success: true,
      data: doctors, // Full doctor info including contact
      authenticated: true
    });
  }
  
  // Public view - limited info
  const publicDoctors = doctors.map(d => ({
    id: d._id,
    name: d.fullName,
    specialization: d.specialization
  }));
  
  res.json({
    success: true,
    data: publicDoctors,
    authenticated: false
  });
});
```

---

## 📊 Middleware Flow Diagram

```
HTTP Request
    ↓
┌─────────────────────────────┐
│   Authorization Header      │
│   Bearer <token>            │
└──────────┬──────────────────┘
           ↓
┌──────────────────────────────────────┐
│      authMiddleware                  │
├──────────────────────────────────────┤
│ 1. Extract token from header         │
│    ✓ Check header exists             │
│    ✓ Check Bearer format             │
│    ✓ Extract token string            │
│                                       │
│ 2. Verify JWT token                  │
│    ✓ Verify signature (JWT_SECRET)   │
│    ✓ Check expiration                │
│    ✓ Validate payload structure      │
│                                       │
│ 3. Find user in MongoDB              │
│    ✓ Query by decoded user ID        │
│    ✓ Exclude password field          │
│    ✓ Check user exists               │
│                                       │
│ 4. Validate account status           │
│    ✓ Check isActive = true           │
│                                       │
│ 5. Attach to request                 │
│    ✓ Set req.user                    │
│    ✓ Set req.token                   │
└──────────┬───────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│   authorizeRoles(...roles)           │
│   (optional)                         │
├──────────────────────────────────────┤
│ 1. Check req.user exists             │
│                                       │
│ 2. Check role in allowed list        │
│    ✓ Compare req.user.role           │
│    ✓ Match against allowedRoles      │
└──────────┬───────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│   requireOwnership(param)            │
│   (optional)                         │
├──────────────────────────────────────┤
│ 1. Check if admin (bypass)           │
│                                       │
│ 2. Compare user ID with param        │
│    ✓ Get ID from route params        │
│    ✓ Compare with req.user._id       │
└──────────┬───────────────────────────┘
           ↓
    Route Handler
    (req.user available)
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T: Use authorizeRoles without authMiddleware
```javascript
// WRONG - authorizeRoles needs req.user from authMiddleware
router.get('/admin', authorizeRoles('admin'), handler);
```

### ✅ DO: Use authMiddleware first
```javascript
// CORRECT
router.get('/admin', authMiddleware, authorizeRoles('admin'), handler);
```

---

### ❌ DON'T: Place middleware after handler
```javascript
// WRONG - middleware must come before handler
router.get('/profile', handler, authMiddleware);
```

### ✅ DO: Place middleware before handler
```javascript
// CORRECT
router.get('/profile', authMiddleware, handler);
```

---

### ❌ DON'T: Send token in URL or body
```javascript
// WRONG - tokens should not be in URL
GET /api/me?token=xyz

// WRONG - tokens should not be in body
POST /api/me
{ "token": "xyz" }
```

### ✅ DO: Send token in Authorization header
```javascript
// CORRECT
GET /api/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### ❌ DON'T: Forget to check req.user
```javascript
// WRONG - might crash if middleware not used
router.get('/profile', (req, res) => {
  const name = req.user.fullName; // Error if req.user undefined
});
```

### ✅ DO: Use authMiddleware or check req.user
```javascript
// CORRECT - middleware ensures req.user exists
router.get('/profile', authMiddleware, (req, res) => {
  const name = req.user.fullName; // Safe
});
```

---

## 🎓 Understanding the Architecture

### Clean Architecture Principles

**1. Separation of Concerns**
- Authentication logic separated from business logic
- Middleware handles auth, controllers handle business logic
- Models handle data, services handle operations

**2. Single Responsibility**
- `authMiddleware` - Only handles JWT verification and user lookup
- `authorizeRoles` - Only handles role checking
- `requireOwnership` - Only handles ownership validation

**3. Reusability**
- Middleware functions are reusable across all routes
- Can be combined in different ways
- Easy to test in isolation

**4. Dependency Injection**
- Uses environment variables for configuration
- No hard-coded secrets or configuration
- Easy to change behavior without code changes

---

## 📝 Summary

### Files Created
✅ `src/middleware/authMiddleware.js` (350 lines)

### No Files Modified
✅ Authentication logic unchanged  
✅ User model unchanged  
✅ authService unchanged  

### Middleware Functions Implemented
✅ `authMiddleware` - JWT verification and user attachment  
✅ `authorizeRoles(...roles)` - Role-based access control  
✅ `requireRole(...roles)` - Alias for authorizeRoles  
✅ `optionalAuth` - Optional authentication  
✅ `requireOwnership(param)` - Resource ownership validation  

### Security Features
✅ JWT signature verification  
✅ Token expiration checking  
✅ User existence validation  
✅ Active status checking  
✅ Password exclusion from req.user  
✅ Comprehensive error handling  
✅ Appropriate HTTP status codes  

### Requirements Met
✅ Reads JWT from Authorization: Bearer <token>  
✅ Verifies token using JWT_SECRET  
✅ Decodes token payload  
✅ Finds user from MongoDB by decoded ID  
✅ Excludes password from user object  
✅ Attaches user to req.user  
✅ Returns 401 for auth errors  
✅ Returns 404 if user not found  
✅ Returns 403 for forbidden access  
✅ Clean architecture with separation of concerns  
✅ Detailed comments throughout  

---

**Status**: ✅ Complete and Production-Ready  
**Next Step**: Use these middleware functions to protect your routes!  
**Documentation**: This guide + inline code comments  

🚀 **Ready to secure your API!**
