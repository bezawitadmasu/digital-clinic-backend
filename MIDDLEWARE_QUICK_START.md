# 🚀 Quick Start - JWT Authentication Middleware

## ✅ What Was Built

Production-ready JWT authentication middleware with:
- Token verification from Authorization header
- User validation (exists, active)
- Role-based access control
- Resource ownership protection
- Optional authentication support

---

## 📁 Files Created/Modified

### Created:
1. ✨ `src/middleware/authMiddleware.js` - Complete authentication middleware
2. 📚 `MIDDLEWARE_DOCUMENTATION.md` - Comprehensive documentation

### Modified:
1. 🔧 `src/routes/authRoutes.js` - Activated GET /api/auth/me
2. 🔧 `src/controllers/authController.js` - Simplified getCurrentUser method
3. 🔧 `test-auth.rest` - Added protected endpoint tests

---

## 🎯 New Endpoint Available

### GET /api/auth/me (Protected)

**Purpose**: Get current authenticated user's profile

**Headers Required**:
```
Authorization: Bearer <your-jwt-token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "_id": "...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "patient",
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

---

## 🧪 Testing Steps

### Step 1: Start Server
```bash
npm run dev
```

### Step 2: Register or Login
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"john@example.com\",\"password\":\"SecurePass123\"}"
```

**Save the token from response!**

### Step 3: Test Protected Endpoint
```bash
# Replace YOUR_TOKEN with the actual token
curl -X GET http://localhost:5000/api/auth/me ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: User profile returned with 200 status

### Step 4: Test Without Token (Should Fail)
```bash
curl -X GET http://localhost:5000/api/auth/me
```

**Expected**: 401 Unauthorized

---

## 💻 How to Use in Your Routes

### Basic Protection

```javascript
const { authMiddleware } = require('../middleware/authMiddleware');

// Protect a route - only authenticated users can access
router.get('/appointments', authMiddleware, async (req, res) => {
  // req.user is available and contains user data
  const userId = req.user._id;
  const userRole = req.user.role;
  const userName = req.user.fullName;
  
  res.json({ message: `Hello ${userName}` });
});
```

### Role-Based Access

```javascript
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Only admin can access
router.delete('/users/:id',
  authMiddleware,
  requireRole('admin'),
  deleteUser
);

// Admin OR doctor can access
router.get('/patients',
  authMiddleware,
  requireRole('admin', 'doctor'),
  getPatients
);
```

### Resource Ownership

```javascript
const { authMiddleware, requireOwnership } = require('../middleware/authMiddleware');

// User can only access their own profile (unless admin)
router.put('/users/:userId/profile',
  authMiddleware,
  requireOwnership('userId'),
  updateProfile
);
```

### Optional Authentication

```javascript
const { optionalAuth } = require('../middleware/authMiddleware');

// Public route with optional auth
router.get('/doctors', optionalAuth, async (req, res) => {
  if (req.user) {
    // User is authenticated - show extra info
    return res.json({ authenticated: true, user: req.user });
  }
  
  // Public view
  res.json({ authenticated: false });
});
```

---

## 🔐 Security Features

### ✅ What's Protected
- Token signature verification
- Token expiration checking
- User existence validation
- Account active status check
- Password never exposed in req.user

### ✅ Error Handling
- 401 - No token, invalid token, expired token
- 403 - Account inactive
- 404 - User not found
- 500 - Server configuration error

---

## 📦 Available Middleware Functions

| Function | Purpose | Usage |
|----------|---------|-------|
| `authMiddleware` | Require authentication | All protected routes |
| `requireRole(...roles)` | Require specific role(s) | Admin, doctor-only routes |
| `requireOwnership(param)` | Require resource ownership | User profile, appointments |
| `optionalAuth` | Optional authentication | Public routes with extra features |

---

## 🎓 What's in req.user

After `authMiddleware` runs:

```javascript
req.user = {
  _id: ObjectId("..."),           // MongoDB ID
  fullName: "Dr. Sarah Johnson",  // Full name
  email: "sarah@example.com",     // Email
  phone: "+1987654321",           // Phone
  role: "doctor",                 // admin, doctor, or patient
  profileImage: "https://...",    // Profile image URL
  isActive: true,                 // Account status
  createdAt: Date,                // Registration date
  updatedAt: Date                 // Last update
  // password is NEVER included
}
```

---

## 📝 Common Patterns

### Pattern 1: Authentication Only
```javascript
// Anyone authenticated can access
router.get('/profile', authMiddleware, handler);
```

### Pattern 2: Role-Based
```javascript
// Only specific roles
router.delete('/resource', authMiddleware, requireRole('admin'), handler);
```

### Pattern 3: Owner or Admin
```javascript
// User owns resource OR is admin
router.put('/users/:userId', authMiddleware, requireOwnership('userId'), handler);
```

### Pattern 4: Multiple Roles
```javascript
// Admin OR doctor
router.get('/patients', authMiddleware, requireRole('admin', 'doctor'), handler);
```

### Pattern 5: Custom Logic
```javascript
router.post('/appointments', authMiddleware, (req, res, next) => {
  // Custom authorization logic
  if (req.user.role === 'patient' && !req.user.isVerified) {
    return res.status(403).json({ message: 'Please verify email first' });
  }
  next();
}, createAppointment);
```

---

## ⚠️ Important Notes

### DO ✅
- Always use `authMiddleware` before `requireRole` or `requireOwnership`
- Send token in `Authorization: Bearer <token>` header
- Store JWT_SECRET securely in environment variables
- Check `req.user` exists in custom middleware

### DON'T ❌
- Don't send tokens in URL or request body
- Don't use `requireRole` without `authMiddleware` first
- Don't modify `req.user` in route handlers
- Don't expose JWT_SECRET in code

---

## 🔜 Next Steps

Now you can:

1. **Protect Routes**: Add `authMiddleware` to existing endpoints
2. **Build Admin Routes**: Use `requireRole('admin')`
3. **Implement RBAC**: Different access for admin/doctor/patient
4. **Add Appointments**: Protected by user ownership
5. **Profile Management**: User can update own profile

---

## 🐛 Troubleshooting

### "Access denied. No token provided"
**Solution**: Add `Authorization: Bearer <token>` header

### "Access denied. Invalid token"
**Solution**: 
- Check token hasn't expired
- Verify JWT_SECRET is same as when token was created
- Make sure token is from login/register response

### "User not found"
**Solution**: User may have been deleted from database

### "Access denied. Your account has been deactivated"
**Solution**: Account isActive is false - contact admin

### req.user is undefined in handler
**Solution**: Make sure `authMiddleware` is used before the handler

---

## 📚 Example Use Case: Appointments

```javascript
const { authMiddleware, requireRole, requireOwnership } = require('../middleware/authMiddleware');

// Get all appointments (admin and doctor only)
router.get('/appointments',
  authMiddleware,
  requireRole('admin', 'doctor'),
  getAllAppointments
);

// Get user's own appointments
router.get('/appointments/my',
  authMiddleware,
  getMyAppointments
);

// Create appointment (patients only)
router.post('/appointments',
  authMiddleware,
  requireRole('patient'),
  createAppointment
);

// Update appointment (owner or admin)
router.put('/appointments/:id',
  authMiddleware,
  checkAppointmentOwnership, // Custom middleware
  updateAppointment
);

// Cancel appointment (owner only)
router.delete('/appointments/:id',
  authMiddleware,
  checkAppointmentOwnership,
  cancelAppointment
);
```

---

## ✅ Implementation Checklist

- [x] JWT authentication middleware created
- [x] Token extraction from Authorization header
- [x] Token verification with JWT_SECRET
- [x] User fetching from MongoDB
- [x] Active status validation
- [x] req.user attachment
- [x] Error handling (401, 403, 404)
- [x] Role-based access control
- [x] Resource ownership protection
- [x] Optional authentication support
- [x] GET /api/auth/me endpoint activated
- [x] Comprehensive documentation
- [x] Test file updated

---

**Status**: ✅ Complete and Production-Ready  
**Authentication**: Fully functional  
**Next**: Start building protected routes! 🚀

---

## 📖 Quick Reference

```javascript
// Import
const { authMiddleware, requireRole, requireOwnership, optionalAuth } = require('../middleware/authMiddleware');

// Protect route
router.get('/route', authMiddleware, handler);

// Role-based
router.delete('/route', authMiddleware, requireRole('admin'), handler);

// Ownership
router.put('/users/:userId', authMiddleware, requireOwnership('userId'), handler);

// Optional
router.get('/route', optionalAuth, handler);

// Access user in handler
function handler(req, res) {
  const user = req.user; // Available after authMiddleware
  const userId = req.user._id;
  const userRole = req.user.role;
}
```

**Ready to protect your routes!** 🔒
