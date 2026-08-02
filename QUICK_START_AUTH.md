# 🚀 Quick Start - Authentication System

## Step 1: Configure Environment Variables

1. Ensure your `.env` file has these settings:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/digital-clinic?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Frontend (CORS)
CLIENT_URL=http://localhost:5173

# API
API_VERSION=v1
```

**⚠️ IMPORTANT**: Generate a secure JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Step 2: Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

**Expected Output**:
```
═══════════════════════════════════════════════════════
✅ MongoDB Connected
📦 Database Host: cluster0.mongodb.net
🗄️  Database Name: digital-clinic
⚡ Connection State: Connected
═══════════════════════════════════════════════════════

═══════════════════════════════════════════════════════
🏥 Digital Clinic Management System - API Server
═══════════════════════════════════════════════════════
📡 Server Status: RUNNING
🌍 Environment: development
🚀 Server URL: http://localhost:5000
...
✅ Server is ready to accept requests
```

---

## Step 3: Test the API

### Option A: Using cURL

**Register a User**:
```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"SecurePass123\",\"phone\":\"+1234567890\",\"role\":\"patient\"}"
```

**Login**:
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"john@example.com\",\"password\":\"SecurePass123\"}"
```

### Option B: Using Postman

1. **Create POST request** to `http://localhost:5000/api/auth/register`
2. **Set Header**: `Content-Type: application/json`
3. **Set Body** (raw JSON):
```json
{
  "fullName": "Dr. Sarah Johnson",
  "email": "sarah@example.com",
  "password": "DoctorPass123",
  "phone": "+1987654321",
  "role": "doctor"
}
```
4. **Send** → You should receive a 201 response with user data and token

### Option C: Using REST Client (VS Code)

1. Install "REST Client" extension in VS Code
2. Open `test-auth.rest` file
3. Click "Send Request" above any request

---

## Step 4: Verify Success

### Successful Registration Response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6789012345",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "patient",
      "isActive": true,
      "createdAt": "2026-01-31T...",
      "updatedAt": "2026-01-31T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Successful Login Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* same structure as registration */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 📋 Available Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Health check | Public |
| GET | `/api` | API information | Public |
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |

---

## 🎯 Test Scenarios

### 1. Register Patient
```json
POST /api/auth/register
{
  "fullName": "Jane Patient",
  "email": "patient@example.com",
  "password": "PatientPass123",
  "phone": "+1111111111",
  "role": "patient"
}
```

### 2. Register Doctor
```json
POST /api/auth/register
{
  "fullName": "Dr. John Smith",
  "email": "doctor@example.com",
  "password": "DoctorPass123",
  "phone": "+2222222222",
  "role": "doctor"
}
```

### 3. Register Admin
```json
POST /api/auth/register
{
  "fullName": "Admin User",
  "email": "admin@example.com",
  "password": "AdminPass123",
  "phone": "+3333333333",
  "role": "admin"
}
```

### 4. Login
```json
POST /api/auth/login
{
  "email": "patient@example.com",
  "password": "PatientPass123"
}
```

### 5. Test Duplicate Email (Should Fail)
```json
POST /api/auth/register
{
  "fullName": "Duplicate User",
  "email": "patient@example.com",
  "password": "AnotherPass123",
  "phone": "+4444444444",
  "role": "patient"
}
```

**Expected Response**: 409 Conflict
```json
{
  "success": false,
  "message": "Email address is already registered"
}
```

---

## 🔍 Common Issues

### Issue: "JWT_SECRET is not defined"
**Solution**: Add JWT_SECRET to your .env file

### Issue: "MONGODB_URI is not defined"
**Solution**: Add MONGODB_URI to your .env file

### Issue: "Email address is already registered"
**Solution**: This is expected. Use a different email or login instead

### Issue: "Invalid email or password"
**Solution**: Check credentials. Passwords are case-sensitive

### Issue: Server not starting
**Solution**: 
1. Check if port 5000 is available
2. Verify MongoDB connection string
3. Check console for error messages

---

## 📦 Project Structure

```
digital-clinic-backend/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   └── authController.js     # Auth HTTP handlers
│   ├── models/
│   │   └── User.js               # User schema & methods
│   ├── routes/
│   │   └── authRoutes.js         # Auth route definitions
│   ├── services/
│   │   └── authService.js        # Auth business logic
│   ├── app.js                    # Express app config
│   └── server.js                 # Server entry point
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── package.json                  # Dependencies
└── test-auth.rest                # API test file
```

---

## 🎓 Understanding the Flow

### Registration Flow:
```
1. Client sends POST to /api/auth/register
2. authRoutes receives request
3. authController.register validates input
4. authService.register checks email uniqueness
5. User.create saves user (password auto-hashed)
6. authService.generateToken creates JWT
7. Response sent with user data + token
```

### Login Flow:
```
1. Client sends POST to /api/auth/login
2. authRoutes receives request
3. authController.login validates input
4. authService.login finds user by email
5. User.comparePassword verifies password
6. authService.generateToken creates JWT
7. Response sent with user data + token
```

---

## 💡 Pro Tips

1. **Save the Token**: Store the JWT token from register/login response for future authenticated requests

2. **Test with Different Roles**: Create users with admin, doctor, and patient roles to prepare for role-based access control

3. **Use Environment Variables**: Never commit JWT_SECRET or MONGODB_URI to version control

4. **Check MongoDB**: You can view registered users in MongoDB Atlas → Collections → users

5. **REST Client**: The `test-auth.rest` file has pre-built test requests for all scenarios

---

## ✅ Checklist

Before moving to the next phase, ensure:

- [ ] Server starts without errors
- [ ] MongoDB connection successful
- [ ] Can register a new user
- [ ] Can login with registered credentials
- [ ] Duplicate email validation works
- [ ] Invalid credentials return appropriate errors
- [ ] JWT token is generated on register/login
- [ ] Password is never returned in responses

---

## 🔜 What's Next?

After successful authentication implementation:

1. **Authentication Middleware** - Protect routes with JWT verification
2. **Role-Based Access Control** - Restrict endpoints by user role
3. **User Profile Management** - Update profile, change password
4. **Patient/Doctor Models** - Extend with medical-specific fields
5. **Appointments System** - Create, update, cancel appointments

---

**Need Help?**
- Check `AUTH_DOCUMENTATION.md` for detailed documentation
- Review `test-auth.rest` for example requests
- Check server console for error messages
- Verify environment variables in `.env`

**Ready to build something amazing! 🚀**
