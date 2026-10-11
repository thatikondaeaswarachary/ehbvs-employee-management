# EHBVS Solutions — Employee Monitoring & Management System

A complete full-stack web application for internal HR operations, attendance tracking, task management, leave management, and employee monitoring.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm

### 1. Install dependencies

```bash
# From the workspace root
npm run install-all
```

> Or manually:
> ```bash
> cd backend && npm install
> cd ../frontend && npm install
> ```

### 2. Configure environment

The backend `.env` is pre-configured for local development. Edit `backend/.env` to add a MongoDB URI for production.

```env
PORT=5000
MONGO_URI=          # Leave empty for JSON file storage (development)
JWT_SECRET=ehbvs_super_secret_jwt_key_2024_production
CLIENT_URL=http://localhost:5173
ADMIN_NAME=Eswara Chary Thatikonda
ADMIN_EMAIL=thatikondaeaswarachary@gmail.com
ADMIN_PASSWORD=Teaswara@001001
ADMIN_EMPLOYEE_ID=EHB-ADM-01
```

### 3. Start development servers

```bash
# From workspace root — starts both backend and frontend
npm run dev
```

Or separately:

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

### 4. Open the app

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Frontend app |
| http://localhost:5000/api | Backend API |
| http://localhost:5000/api/health | Health check |

---

## 🔐 Default Admin Credentials

| Field | Value |
|---|---|
| Email | `thatikondaeaswarachary@gmail.com` |
| Password | `Teaswara@001001` |
| Employee ID | `EHB-ADM-01` |

> Change the admin password immediately in production.

---

## 🏗️ Architecture

```
ehbvs-solutions/
├── backend/                  # Node.js + Express API
│   ├── config/               # DB config, company config
│   ├── controllers/          # Route handlers
│   ├── middleware/           # Auth, admin, validation, error handling
│   ├── models/               # Mongoose schemas
│   ├── repositories/         # Universal CRUD store (MongoDB + JSON fallback)
│   ├── routes/               # Express routers
│   ├── utils/                # JWT, calculations, audit logger, seed
│   ├── data/                 # JSON file storage (dev/no-mongo mode)
│   └── server.js
└── frontend/                 # React + Vite SPA
    └── src/
        ├── components/       # Reusable UI components
        ├── config/           # Company config
        ├── context/          # React AuthContext with heartbeat
        ├── hooks/            # useAuth hook
        ├── layouts/          # Admin / Employee / Auth layouts
        ├── pages/
        │   ├── admin/        # Admin pages
        │   ├── employee/     # Employee pages
        │   └── auth/         # Login, Signup, ForgotPassword
        └── services/         # Axios API service layer
```

---

## 👥 Roles & Access

| Role | Access |
|------|--------|
| `ADMIN` | Full system access |
| `EMPLOYEE` | Own data only |
| `MANAGER` | (Architecture ready, not fully implemented) |

---

## 📋 Features

### Admin
- Dashboard with live metrics and Recharts visualizations
- Employee CRUD (create, edit, activate/disable, password reset)
- Attendance management with admin corrections
- Task creation and assignment
- Work report review
- Leave approval/rejection (auto-syncs attendance)
- Announcements broadcast
- System settings and audit logs
- Reports with CSV export

### Employee
- Personal dashboard with today's status
- Check In / Check Out
- Live work status (Working / Break / Completed)
- View and update assigned tasks
- Submit daily work reports
- Apply for leave
- View attendance history
- Notifications inbox
- Profile management

---

## 🗄️ Database

The system runs in **dual-mode**:

- **Development (no MONGO_URI):** Persists data to `backend/data/*.json` files
- **Production (with MONGO_URI):** Uses MongoDB with Mongoose

Collections: `users`, `attendance`, `tasks`, `workReports`, `leaves`, `announcements`, `notifications`, `auditLogs`, `settings`

---

## 🔒 Security

- bcrypt password hashing (salt rounds: 12)
- JWT access tokens (configurable expiry)
- Protected routes (frontend + backend)
- Role-based authorization middleware
- Input validation on all endpoints
- CORS configured for CLIENT_URL
- No plain-text passwords stored
- No covert surveillance — all monitoring is transparent

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Axios, Lucide React |
| Backend | Node.js, Express.js, JWT, bcrypt |
| Database | MongoDB (Mongoose) / JSON fallback |
| Auth | JWT + httpOnly cookie |

---

## 🧪 Backend Test

```bash
node backend/test-backend.js
```

Expected output: `ALL BACKEND MODULES LOADED SUCCESSFULLY!`
