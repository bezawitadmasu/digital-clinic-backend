# Digital Clinic Management System - API Documentation

## 🚀 Server Setup Complete

The Express.js server foundation has been successfully implemented with clean architecture and all necessary middleware configured.

---

## 📁 Project Structure

```
digital-clinic-backend/
├── src/
│   ├── app.js              # Express application configuration
│   ├── server.js           # Server entry point
│   ├── config/             # Configuration files (future)
│   ├── controllers/        # Route controllers (future)
│   ├── middleware/         # Custom middleware (future)
│   ├── models/             # MongoDB models (future)
│   ├── routes/             # API routes (future)
│   ├── services/           # Business logic (future)
│   ├── utils/              # Utility functions (future)
│   └── validations/        # Input validation (future)
├── .env                    # Environment variables (NOT in git)
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── package.json            # Project dependencies
└── README.md               # Project documentation
```

---

## 🔧 Technologies & Middleware Implemented

### Core Technologies
- **Node.js** - JavaScript runtime
- **Express.js v5.2.1** - Web framework
- **dotenv v17.4.2** - Environment variable management

### Security & Performance
- **Helmet v8.3.0** - Security headers
- **CORS v2.8.6** - Cross-Origin Resource Sharing
- **express.json()** - JSON body parsing

### Development Tools
- **Morgan v1.11.0** - HTTP request logging
- **Nodemon v3.1.14** - Auto-restart on file changes

---

## 🔐 Middleware Configuration

### 1. **Helmet** (Security)
```javascript
app.use(helmet());
```
- Sets secure HTTP headers
- Prevents XSS attacks
- Prevents clickjacking
- Disables X-Powered-By header

### 2. **CORS** (Cross-Origin)
```javascript
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```
- Allows React frontend to communicate with backend
- Configured for http://localhost:5173
- Supports credentials (cookies)

### 3. **Morgan** (Logging)
```javascript
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}
```
- Logs HTTP requests to console
- Development: colored, concise format
- Production: detailed Apache-style format

### 4. **Body Parsers**
```javascript
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```
- Parses JSON request bodies
- Parses URL-encoded form data

---

## 🌐 API Endpoints

### Health Check
**GET /**
```json
{
  "success": true,
  "message": "Digital Clinic API is running",
  "version": "v1",
  "environment": "development"
}
```

### API Information
**GET /api**
```json
{
  "success": true,
  "message": "Welcome to Digital Clinic Management System API",
  "version": "v1",
  "endpoints": {
    "health": "/",
    "api": "/api"
  }
}
```

### 404 Not Found (Any undefined route)
```json
{
  "success": false,
  "message": "Route /undefined not found",
  "error": "Not Found"
}
```

---

## ⚙️ Environment Variables

### Required Configuration (.env)
```bash
# Server Configuration
NODE_ENV=development
PORT=5000

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# API Configuration
API_VERSION=v1
```

### Future Configuration (Commented in .env.example)
- MongoDB connection string
- JWT secret and expiration
- Email service configuration
- File upload settings

---

## 🚀 Running the Server

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Server Output
```
═══════════════════════════════════════════════════════
🏥 Digital Clinic Management System - API Server
═══════════════════════════════════════════════════════
📡 Server Status: RUNNING
🌍 Environment: development
🚀 Server URL: http://localhost:5000
📋 API Version: v1
⏰ Started at: [timestamp]
═══════════════════════════════════════════════════════
✅ Server is ready to accept requests
═══════════════════════════════════════════════════════
```

---

## 🔄 Architecture Decisions

### 1. **Separation of Concerns**
- **app.js** - Express application configuration
- **server.js** - HTTP server initialization
- **Benefits:** Easier testing, better modularity

### 2. **Middleware Order**
```javascript
1. Helmet (Security headers)
2. CORS (Cross-origin)
3. Morgan (Logging)
4. express.json() (Body parsing)
5. express.urlencoded() (Form parsing)
6. Routes
7. 404 Handler
8. Error Handler
```

### 3. **Error Handling**
- Global error handler catches all errors
- 404 handler for undefined routes
- Graceful shutdown on SIGTERM/SIGINT
- Unhandled rejection/exception handlers

### 4. **Clean Architecture Ready**
```
Future Structure:
Routes → Controllers → Services → Models
```

---

## 🧪 Testing the API

### Using curl
```bash
# Health check
curl http://localhost:5000

# API info
curl http://localhost:5000/api

# 404 test
curl http://localhost:5000/undefined
```

### Using Postman
1. Import the endpoints
2. Test GET requests to `/` and `/api`

### Using Browser
Simply visit:
- http://localhost:5000
- http://localhost:5000/api

---

## 📝 Implementation Notes

### What's Implemented ✅
- Express application setup
- Environment variable configuration
- Security middleware (Helmet)
- CORS configuration
- Request logging (Morgan)
- Body parsing
- Health check endpoint
- Error handling
- Graceful shutdown
- Development scripts

### What's NOT Implemented Yet 🚧
- MongoDB database connection
- Authentication & JWT
- User models
- API routes (patients, doctors, appointments)
- Controllers
- Services
- Validation middleware
- File uploads
- Email service

---

## 🔜 Next Steps

1. **Database Integration**
   - Connect to MongoDB
   - Create database configuration
   - Set up connection pooling

2. **Authentication System**
   - Implement JWT authentication
   - Create auth middleware
   - Set up password hashing

3. **API Routes**
   - Patient management
   - Doctor management
   - Appointment booking
   - Admin operations

4. **Models & Schemas**
   - User model
   - Patient model
   - Doctor model
   - Appointment model

5. **Validation**
   - Input validation middleware
   - Request sanitization
   - Error messages

---

## 📚 Key Files Explained

### app.js
**Purpose:** Configures the Express application with all middleware

**Key Features:**
- Imports and configures all middleware
- Defines API routes
- Implements 404 and error handlers
- Exports configured app for testing

### server.js
**Purpose:** Starts the HTTP server and handles process events

**Key Features:**
- Loads environment variables
- Starts Express server on specified port
- Implements graceful shutdown
- Handles unhandled errors
- Provides detailed startup logs

### .env
**Purpose:** Stores environment-specific configuration

**Why Separate:**
- Different values for dev/staging/production
- Keeps secrets out of source control
- Easy to change without code modifications

### .env.example
**Purpose:** Documents all available environment variables

**Benefits:**
- Onboarding new developers
- Shows required configuration
- Safe to commit to git

---

## 🛡️ Security Features

1. **Helmet Middleware**
   - Content Security Policy
   - DNS Prefetch Control
   - Frameguard (clickjacking)
   - Hide Powered By
   - HSTS (HTTP Strict Transport Security)
   - IE No Open
   - No Sniff
   - XSS Filter

2. **CORS Configuration**
   - Restricts origin to frontend URL
   - Supports credentials
   - Configurable for production

3. **Environment Variables**
   - Secrets not in code
   - Easy rotation
   - Different per environment

4. **Error Handling**
   - Stack traces only in development
   - Graceful error responses
   - Process crash prevention

---

## 🔍 Troubleshooting

### Server Won't Start
- Check if PORT is already in use
- Verify .env file exists
- Check for syntax errors in app.js/server.js

### CORS Errors
- Verify CLIENT_URL in .env matches frontend URL
- Check browser console for specific error

### Environment Variables Not Loading
- Ensure .env file is in project root
- Check dotenv is imported: `require('dotenv').config()`
- Verify variable names match

---

## 📞 API Status

**Server URL:** http://localhost:5000
**Status:** ✅ Running
**Version:** v1
**Environment:** Development

**Available Endpoints:**
- GET / (Health check)
- GET /api (API information)

---

**Implementation Complete!** 🎉

The Express.js server foundation is ready for database integration and feature development.
