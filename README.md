# Digital Clinic Management System - Backend API

## 🏥 Overview

This is the backend API for the Digital Clinic Management System, built with Express.js and designed to work with the React frontend.

## ✅ Current Implementation Status

### Completed Features
- ✅ Express.js server setup
- ✅ Environment configuration (dotenv)
- ✅ Security middleware (Helmet)
- ✅ CORS configuration
- ✅ Request logging (Morgan)
- ✅ JSON body parsing
- ✅ Error handling
- ✅ Health check endpoints
- ✅ Clean architecture foundation

### Pending Features
- 🚧 MongoDB database integration
- 🚧 Authentication & JWT
- 🚧 User management routes
- 🚧 Patient management routes
- 🚧 Doctor management routes
- 🚧 Appointment management routes
- 🚧 Admin routes

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```

The server will start at http://localhost:5000

### 4. Test the API
```bash
curl http://localhost:5000
```

Expected response:
```json
{
  "success": true,
  "message": "Digital Clinic API is running",
  "version": "v1",
  "environment": "development"
}
```

## 📚 Documentation

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🔧 Available Scripts

- `npm start` - Run server in production mode
- `npm run dev` - Run server in development mode with auto-restart

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js v5.2.1** - Web framework
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger
- **dotenv** - Environment variables
- **Nodemon** - Development auto-restart

## 🌐 API Endpoints

### Currently Available

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/api` | API information |

### Coming Soon

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | User registration |
| POST | `/api/v1/auth/login` | User login |
| GET | `/api/v1/patients` | Get all patients |
| POST | `/api/v1/patients` | Create patient |
| GET | `/api/v1/doctors` | Get all doctors |
| POST | `/api/v1/appointments` | Book appointment |

## 🔐 Environment Variables

Required variables in `.env`:

```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
API_VERSION=v1
```

## 📁 Project Structure

```
digital-clinic-backend/
├── src/
│   ├── app.js              # Express app configuration
│   ├── server.js           # Server entry point
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   └── validations/        # Input validation
├── .env                    # Environment variables
├── .env.example            # Environment template
├── package.json            # Dependencies
└── README.md               # This file
```

## 🔄 Development Workflow

1. Make changes to code
2. Nodemon automatically restarts server
3. Test endpoints using curl/Postman/Browser
4. Check console logs for requests

## 🛡️ Security Features

- **Helmet**: Sets secure HTTP headers
- **CORS**: Restricts API access to frontend domain
- **Environment Variables**: Sensitive data not in code
- **Error Handling**: Prevents information leakage

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

### CORS Issues
- Verify `CLIENT_URL` in `.env` matches your frontend URL
- Check browser console for specific CORS errors

### Server Won't Start
- Ensure all dependencies are installed: `npm install`
- Check `.env` file exists and is configured
- Verify Node.js version: `node --version`

## 📝 Notes

- The server uses Express v5.2.1 which has some differences from v4
- All routes return JSON responses
- Error responses include stack traces in development mode only
- Server implements graceful shutdown handling

## 🚀 Next Steps

1. **Set up MongoDB**
   - Install MongoDB
   - Create database
   - Configure connection string

2. **Implement Authentication**
   - JWT token generation
   - Password hashing with bcrypt
   - Auth middleware

3. **Create API Routes**
   - Patient management
   - Doctor management
   - Appointment booking
   - Admin operations

4. **Add Validation**
   - Input validation
   - Error messages
   - Data sanitization

## 👥 Team

Digital Clinic Development Team

## 📄 License

ISC

---

**Server Status:** ✅ Running on http://localhost:5000

**Last Updated:** 2026-07-31
