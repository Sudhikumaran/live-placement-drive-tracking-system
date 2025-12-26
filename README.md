# 🎓 Live Placement Drive Tracker

A production-grade, real-time placement management system for colleges with Socket.IO-powered live updates, role-based dashboards, and comprehensive analytics.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

## ✨ Features

### For Students
- 📚 Browse and apply to placement drives
- 🔔 Real-time shortlist notifications
- 📊 Track application status across multiple rounds
- 📧 Offer management (accept/decline)
- 🎯 Eligibility-based drive filtering

### For Companies
- 📝 Create and manage placement drives
- 👥 View applicants with detailed profiles
- ✅ Shortlist/reject candidates across multiple rounds
- 📨 Send offers to selected candidates
- 📈 Drive-specific analytics

### For Admins (Placement Cell)
- 🖥️ Live monitoring of all placement drives
- 📊 Real-time placement analytics
- 📁 Department-wise performance tracking
- 📥 Export reports (CSV)
- 🎛️ Drive status management

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Real-Time**: Socket.IO
- **Authentication**: JWT

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **WebSocket**: Socket.IO Client
- **Charts**: Recharts

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Client Layer                           │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Student   │  │   Company    │  │     Admin     │  │
│  │  Dashboard  │  │   Dashboard  │  │   Dashboard   │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
                       │
                       ↓ (REST + WebSocket)
┌─────────────────────────────────────────────────────────┐
│              Express.js + Socket.IO Server              │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────────┐ │
│  │ Auth Routes  │  │  Business   │  │  Notification  │ │
│  │              │  │  Logic      │  │  Service       │ │
│  └──────────────┘  └─────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────┘
                       │
                       ↓ (SQL Queries)
┌─────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                     │
│  Students | Companies | Drives | Applications | Offers  │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/placement-tracker.git
   cd placement-tracker
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/placement_tracker

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## 💾 Database Setup

1. **Create PostgreSQL database**
   ```bash
   createdb placement_tracker
   ```

2. **Run the schema**
   ```bash
   cd backend
   psql placement_tracker < src/config/schema.sql
   ```

   Or using the DATABASE_URL:
   ```bash
   psql $DATABASE_URL < src/config/schema.sql
   ```

3. **Verify tables created**
   ```bash
   psql placement_tracker
   \dt
   ```

   You should see:
   - students
   - companies
   - admins
   - placement_drives
   - applications
   - shortlist_rounds
   - notifications
   - offers

## ▶️ Running the Application

### Development Mode

1. **Start the backend**
   ```bash
   cd backend
   npm run dev
   ```
   Server runs on `http://localhost:5000`

2. **Start the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   App runs on `http://localhost:5173`

3. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`
   - Health Check: `http://localhost:5000/health`

### Production Mode

1. **Build backend**
   ```bash
   cd backend
   npm run build
   npm start
   ```

2. **Build frontend**
   ```bash
   cd frontend
   npm run build
   npm run preview
   ```

## 📚 API Documentation

### Authentication

```http
POST /api/auth/register/student
POST /api/auth/register/company
POST /api/auth/register/admin
POST /api/auth/login
GET  /api/auth/me
```

### Student Endpoints

```http
GET  /api/student/profile
PUT  /api/student/profile
GET  /api/student/drives
GET  /api/student/drives/eligible
POST /api/student/apply/:driveId
GET  /api/student/applications
GET  /api/student/applications/:id
GET  /api/student/notifications
PUT  /api/student/notifications/:id/read
GET  /api/student/offers
PUT  /api/student/offers/:id/accept
PUT  /api/student/offers/:id/decline
```

### Company Endpoints

```http
GET  /api/company/profile
PUT  /api/company/profile
GET  /api/company/drives
POST /api/company/drives
PUT  /api/company/drives/:id
GET  /api/company/drives/:id/applicants
POST /api/company/shortlist
POST /api/company/offers
GET  /api/company/analytics/:driveId
```

### Admin Endpoints

```http
GET  /api/admin/drives
GET  /api/admin/drives/:id
PUT  /api/admin/drives/:id/status
GET  /api/admin/students
GET  /api/admin/companies
GET  /api/admin/analytics/overview
GET  /api/admin/analytics/department/:dept
GET  /api/admin/analytics/company/:id
GET  /api/admin/export/placements
GET  /api/admin/export/students
```

## 🌐 Socket.IO Events

### Server → Client

```typescript
'drive:created'           // New drive notification
'application:submitted'   // New application for company
'shortlist:update'        // Shortlist status change
'notification:new'        // New notification
'analytics:update'        // Analytics update for admin
'offer:created'           // Offer sent to student
'offer:updated'           // Offer status changed
```

### Client → Server

```typescript
'join:room'               // Join specific room
'notification:read'       // Mark notification as read
```

## 🚢 Deployment

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL=your_postgres_url`
   - `JWT_SECRET=your_secret`
   - `CORS_ORIGIN=https://yourfrontend.vercel.app`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`

### Frontend (Vercel)

1. Import project from GitHub
2. Framework Preset: Vite
3. Set environment variables:
   - `VITE_API_URL=https://yourbackend.render.com`
   - `VITE_SOCKET_URL=wss://yourbackend.render.com`
4. Deploy!

### Database (Render PostgreSQL)

1. Create a new PostgreSQL instance
2. Copy the External Database URL
3. Run schema:
   ```bash
   psql <EXTERNAL_DATABASE_URL> < backend/src/config/schema.sql
   ```

## 📁 Project Structure

```
placement-tracker/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── socket.ts
│   │   │   └── schema.sql
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── student.controller.ts
│   │   │   ├── company.controller.ts
│   │   │   └── admin.controller.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── student.routes.ts
│   │   │   ├── company.routes.ts
│   │   │   └── admin.routes.ts
│   │   ├── services/
│   │   │   ├── notification.service.ts
│   │   │   └── analytics.service.ts
│   │   ├── sockets/
│   │   │   └── types.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Your Name - [GitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Built for solving real placement drive chaos in colleges
- Inspired by the need for real-time visibility in recruitment

---

**⭐ Star this repo if you find it helpful!**
