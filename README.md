# Full Stack Web Application

A complete full-stack web application built with React.js, Node.js, Express, and MongoDB featuring user authentication and a dynamic dashboard.

## 🚀 Features

### Core Features
- ✅ User Registration (Signup)
- ✅ User Login with Email & Password
- ✅ Form Validation (Email format, Required fields)
- ✅ JWT Authentication (httpOnly cookies)
- ✅ Protected Routes
- ✅ User Dashboard with Dummy Data
- ✅ Logout Functionality

### Dashboard Data
The dashboard displays three types of data:
- **Leads**: Customer leads with status and value
- **Tasks**: Task management with priority and due dates
- **Users**: Team members with roles and status

### Bonus Features Implemented
- ✅ Logout functionality
- ✅ Clean and user-friendly UI with gradient design
- ✅ Toast notifications for user feedback
- ✅ Loading indicators during API calls
- ✅ Protected routes (authenticated users only)
- ✅ JWT authentication with httpOnly cookies
- ✅ Responsive design
- ✅ Error handling throughout the app
- ✅ Route guards (logged-in users can't access login/signup)

## 🛠️ Tech Stack

### Frontend
- React.js 18
- React Router DOM (routing)
- Axios (HTTP client)
- React Hot Toast (notifications)
- Vite (build tool)

### Backend
- Node.js
- Express.js
- MongoDB (database)
- Mongoose (ODM)
- JWT (authentication)
- bcryptjs (password hashing)
- Cookie Parser
- CORS

## 📋 Prerequisites

Before running this project, make sure you have:
- Node.js (v14 or higher)
- MongoDB installed and running
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd fullstack-app
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/fullstack-app
JWT_SECRET=your-secret-key-change-this-in-production
PORT=5000
```

Start the backend server:
```bash
npm run dev
```
Backend will run on `http://localhost:5000`

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```
Frontend will run on `http://localhost:5173`

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On macOS/Linux
mongod

# On Windows
net start MongoDB
```

## 📁 Project Structure

```
fullstack-app/
├── backend/
│   ├── controllers/
│   │   └── authController.js    # Business logic
│   ├── middleware/
│   │   └── auth.js               # JWT verification
│   ├── models/
│   │   └── User.js               # User schema
│   ├── routes/
│   │   └── auth.js               # API routes
│   ├── server.js                 # Entry point
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js          # Axios configuration
│   │   ├── components/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── PublicRoute.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /signup` - Register new user
  - Body: `{ name, email, password }`
  - Response: `{ success, message }`

- `POST /login` - Login user
  - Body: `{ email, password }`
  - Response: `{ success, name }`
  - Sets httpOnly cookie with JWT

- `POST /logout` - Logout user
  - Clears authentication cookie
  - Response: `{ success, message }`

### Protected Routes
- `GET /dashboard` - Get dashboard data
  - Requires: Valid JWT cookie
  - Response: `{ message, data: { leads, tasks, users } }`

## 🎯 Usage

1. **Start the Application**
   - Ensure MongoDB is running
   - Start backend server: `cd backend && npm run dev`
   - Start frontend server: `cd frontend && npm run dev`

2. **Create an Account**
   - Navigate to `http://localhost:5173`
   - Click "Signup" and create an account
   - You'll see a success message

3. **Login**
   - Enter your email and password
   - Upon successful login, you'll be redirected to the dashboard

4. **Dashboard**
   - View your personalized welcome message
   - See dummy data for Leads, Tasks, and Users
   - Click "Logout" to end your session

## ✨ Key Features Explained

### Form Validation
- Email format validation (HTML5 + backend)
- Required field validation
- Real-time error messages via toast notifications

### Authentication Flow
1. User submits credentials
2. Backend validates and creates JWT
3. JWT stored in httpOnly cookie (secure)
4. Protected routes verify JWT on each request

### Route Protection
- **ProtectedRoute**: Redirects unauthenticated users to login
- **PublicRoute**: Redirects authenticated users to dashboard
- Prevents unauthorized access to dashboard
- Prevents logged-in users from accessing login/signup

### Dashboard Data
The dashboard displays three categories of dummy data:
- **Leads**: Sales leads with contact info and status
- **Tasks**: To-do items with priority levels
- **Users**: Team members with roles

## 🎨 UI/UX Features

- Modern gradient design
- Responsive layout (mobile-friendly)
- Loading states during API calls
- Toast notifications for all actions
- Smooth transitions and hover effects
- Clean, minimal interface
- Color-coded status badges

## 🔒 Security Features

- Passwords hashed with bcryptjs
- JWT tokens stored in httpOnly cookies
- CORS configured for frontend origin
- Protected API endpoints
- Input validation on frontend and backend

## 📝 Assignment Requirements Checklist

### Required Features
- ✅ Login page with email and password
- ✅ Form validation (email format, required fields)
- ✅ Error messages for invalid inputs
- ✅ Dashboard showing logged-in user's name
- ✅ Dashboard displaying dummy data (Leads, Tasks, Users)
- ✅ Backend API for login
- ✅ MongoDB for data storage
- ✅ Credential validation from database

### Bonus Features
- ✅ Logout functionality
- ✅ Clean and user-friendly UI
- ✅ Protected routes
- ✅ JWT authentication
- ✅ Responsive design
- ✅ Loading indicators
- ✅ Error handling

## 🚀 Future Enhancements

Potential improvements for the application:
- CRUD operations for dashboard data
- User profile management
- Real-time data updates
- Advanced filtering and search
- Data visualization with charts
- Email verification
- Password reset functionality
- Role-based access control

## 📄 License

This project is created for educational purposes.

## 👨‍💻 Author

Created as part of a full-stack development assignment.

---

**Note**: This application is for demonstration purposes. For production use, additional security measures and optimizations should be implemented.



## 🚀 Deployment Guide

### Backend Deployment (Render)

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Select the `backend` folder as root directory
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Add Environment Variables on Render**
   ```
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-secret-key
   PORT=5000
   ```

3. **Get your Render backend URL**
   - Example: `https://your-app.onrender.com`

### Frontend Deployment (Vercel)

1. **Deploy to Vercel**
   - Connect your GitHub repository
   - Select the `frontend` folder as root directory
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **Add Environment Variable on Vercel**
   - Go to Project Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend.onrender.com`

3. **Redeploy**
   - After adding the environment variable, trigger a new deployment

### Important Notes

- The `vercel.json` file ensures React Router works correctly on Vercel
- Make sure your backend URL is added to CORS origins in `backend/server.js`
- Environment variables must be set on both platforms
- Render free tier may have cold starts (first request might be slow)

### Troubleshooting

**404 Error on Vercel:**
- Ensure `vercel.json` is in the frontend root
- Redeploy after adding the file

**CORS Error:**
- Check that your Vercel URL is in the CORS origins array in `backend/server.js`
- Redeploy backend after updating CORS

**API Connection Error:**
- Verify `VITE_API_URL` environment variable is set on Vercel
- Check that backend is running on Render
- Ensure MongoDB connection string is correct

### Current Deployment URLs

- Frontend: https://full-stack-assignment-weld.vercel.app
- Backend: https://full-stack-assignment-xfkz.onrender.com


## 🔐 Environment Variables Setup

### Backend Environment Variables

For **local development** (backend/.env):
```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=development
```

For **production deployment on Render**, add these environment variables:
```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=production
```

**Important**: Setting `NODE_ENV=production` on Render enables:
- Secure cookies (HTTPS only)
- Cross-origin cookie support (sameSite: 'none')
- Production-optimized settings

### Frontend Environment Variables

For **production deployment on Vercel**, add:
```env
VITE_API_URL=https://your-backend-url.onrender.com
```

This ensures your frontend connects to the correct backend API in production.
