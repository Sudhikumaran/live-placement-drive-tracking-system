# 🎓 Live Placement Drive Tracker

A comprehensive, real-time college placement tracking system built with the MERN stack. Track placement drives, manage applications, upload shortlists, and view analytics - all in real-time!

## ✨ Features

### 👨‍🎓 Student Features
- ✅ Register & Login with JWT authentication
- 📋 View eligible placement drives based on CGPA and department
- 📝 Apply to drives with one click
- 🔔 Receive real-time notifications for shortlist updates
- 📊 Track application status with round-wise progress
- 🎯 Dashboard with personalized stats (applications, shortlisted, offers)

### 👨‍💼 Admin Features
- 🔐 Secure admin authentication
- ➕ Create and manage placement drives (CRUD operations)
- 📤 Upload shortlist results via Excel (.xlsx)
- 🔄 Update round statuses for students
- 📈 Comprehensive analytics dashboard with charts
- 📊 View department-wise placement stats, company-wise offers
- ⚡ Real-time notification triggers

### 🚀 Technical Features
- 🔄 Real-time updates with Socket.IO
- 🔑 JWT authentication (access + refresh tokens)
- 🎨 Modern UI with Tailwind CSS
- 📱 Fully responsive design
- 🔒 Role-based access control
- 📊 Interactive charts with Recharts
- 📄 Excel parsing with xlsx library
- ⚠️ Error handling and loading states
- 🔔 Toast notifications

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for HTTP requests
- **Socket.IO Client** for real-time features
- **Recharts** for data visualization
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **bcryptjs** for password hashing
- **xlsx** for Excel parsing
- **Multer** for file uploads

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd placement-tracker
```

### 2. Backend Setup

```bash
cd server
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Update .env with your MongoDB URI and secrets
# MONGODB_URI=mongodb://localhost:27017/placement-tracker
# JWT_SECRET=your-secret-key
# JWT_REFRESH_SECRET=your-refresh-secret
# PORT=5000
```

### 3. Frontend Setup

```bash
cd ../client
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Update .env with API URLs
# VITE_API_URL=http://localhost:5000
# VITE_SOCKET_URL=http://localhost:5000
```

### 4. Initialize Admin User

```bash
cd ../server
node seedAdmin.js
```

This creates a default admin account:
- **Email:** admin@college.edu
- **Password:** admin123

⚠️ **Important:** Change the password after first login!

## 🎯 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

### Production Build

**Frontend:**
```bash
cd client
npm run build
```

**Backend:**
```bash
cd server
npm start
```

## 📁 Project Structure

```
placement-tracker/
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Loader.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/          # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── student/    # Student pages
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Drives.jsx
│   │   │   │   └── MyApplications.jsx
│   │   │   └── admin/      # Admin pages
│   │   │       ├── Dashboard.jsx
│   │   │       ├── Drives.jsx
│   │   │       ├── Shortlist.jsx
│   │   │       └── Analytics.jsx
│   │   ├── context/        # React context
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/          # Custom hooks
│   │   │   └── useSocket.jsx
│   │   ├── services/       # API & Socket services
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── tailwind.config.js
│
└── server/                  # Backend Node.js application
    ├── models/             # Mongoose models
    │   ├── User.js
    │   ├── PlacementDrive.js
    │   └── Application.js
    ├── controllers/        # Route controllers
    │   ├── authController.js
    │   ├── driveController.js
    │   ├── applicationController.js
    │   └── analyticsController.js
    ├── routes/             # Express routes
    │   ├── auth.js
    │   ├── drives.js
    │   ├── applications.js
    │   └── analytics.js
    ├── middleware/         # Custom middleware
    │   ├── auth.js
    │   └── errorHandler.js
    ├── config/             # Configuration files
    │   ├── db.js
    │   └── socket.js
    ├── server.js           # Entry point
    ├── seedAdmin.js        # Admin seed script
    └── package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new student
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Placement Drives
- `GET /api/drives` - Get all drives (filtered by eligibility for students)
- `GET /api/drives/:id` - Get single drive
- `POST /api/drives` - Create drive (Admin only)
- `PUT /api/drives/:id` - Update drive (Admin only)
- `DELETE /api/drives/:id` - Delete drive (Admin only)
- `POST /api/drives/:id/shortlist` - Upload shortlist (Admin only)

### Applications
- `POST /api/applications/apply` - Apply to drive (Student only)
- `GET /api/applications/my-applications` - Get my applications (Student)
- `GET /api/applications/student/:id` - Get student applications
- `GET /api/applications/drive/:id` - Get drive applications (Admin only)
- `PUT /api/applications/:id/round` - Update round status (Admin only)

### Analytics
- `GET /api/analytics/placement` - Department-wise placement stats (Admin)
- `GET /api/analytics/companies` - Company-wise offer stats (Admin)
- `GET /api/analytics/rounds` - Round-wise elimination stats (Admin)
- `GET /api/analytics/students` - Overall student stats (Admin)
- `GET /api/analytics/dashboard` - Dashboard overview (Admin)

## 📊 Excel Upload Format

For uploading shortlists, use the following Excel format:

| Email | Status |
|-------|--------|
| student1@college.edu | shortlisted |
| student2@college.edu | rejected |
| student3@college.edu | selected |

**Status values:**
- `shortlisted` - Student passed the round
- `rejected` - Student didn't make it
- `selected` - Student got the final offer
- `pending` - Awaiting results

## 🔐 Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT access tokens (15 min expiry)
- ✅ JWT refresh tokens (7 day expiry)
- ✅ Protected routes with authentication middleware
- ✅ Role-based authorization
- ✅ Input validation
- ✅ CORS configuration

## 🎨 UI/UX Features

- Modern gradient design with custom Tailwind components
- Smooth animations and transitions
- Loading states for all API calls
- Error handling with toast notifications
- Responsive design for all screen sizes
- Custom scrollbar styling
- Card-based layouts with shadows

## 🔔 Real-Time Features

- Instant notifications when shortlist is updated
- Live application status changes
- Socket.IO room-based communication
- Automatic UI updates without refresh

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Student registration
- [ ] Admin login
- [ ] Token refresh
- [ ] Logout

**Student Flow:**
- [ ] View eligible drives
- [ ] Apply to drive
- [ ] View application status
- [ ] Receive real-time notification

**Admin Flow:**
- [ ] Create placement drive
- [ ] Edit/delete drive
- [ ] Upload Excel shortlist
- [ ] View analytics

## 🚨 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in `.env`

### Port Already in Use
- Kill process: `npx kill-port 5000` or `npx kill-port 5173`
- Change PORT in `.env`

### Socket.IO Connection Failed
- Verify VITE_SOCKET_URL matches server URL
- Check CORS configuration

### Excel Upload Fails
- Ensure file is `.xlsx` format
- Check column names match exactly (Email, Status)
- Verify student emails exist in database

## 📝 Future Enhancements

- [ ] Email notifications
- [ ] Resume upload for students
- [ ] Company portal
- [ ] Offer letter generation
- [ ] Interview scheduling
- [ ] Student profile management
- [ ] Export analytics as PDF
- [ ] Multi-college support

## 👥 User Roles

### Student
- Can register themselves
- View and apply to eligible drives
- Track application status
- Receive notifications

### Admin
- Created via seed script
- Full CRUD on drives
- Upload shortlists
- View analytics
- Manage all applications

## 🤝 Contributing

This is a college placement management system. Contributions are welcome!

## 📄 License

ISC

## 👨‍💻 Author

Created for college placement management

## 🙏 Acknowledgments

- React & Vite team
- Tailwind CSS
- MongoDB team
- Socket.IO
- Recharts

---

**🎯 Ready to track placements in real-time!**

For issues or questions, please create an issue in the repository.
