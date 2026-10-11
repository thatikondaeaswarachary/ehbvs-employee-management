import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDb, DB_MODE } from './config/db.js';
import { bootstrapAdmin } from './utils/seedAdmin.js';
import { company } from './config/company.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import workReportRoutes from './routes/workReportRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

const app = express();
const port = process.env.PORT || 5000;

// Trust reverse proxies (ngrok, cloudflare, nginx)
app.set('trust proxy', 1);

// Security & Parsing
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://employee-management-e9961.web.app',
  'https://employee-management-e9961.firebaseapp.com',
  'https://ehbvs-solutions-64772.web.app',
  'https://ehbvs-solutions-64772.firebaseapp.com',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, true); // Dev permissive
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiter for authentication attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EHBVS SOLUTIONS — Employee Monitoring & Management System API',
    databaseMode: DB_MODE,
    timestamp: new Date().toISOString()
  });
});

// Central company configuration info endpoint
app.get('/api/company', (req, res) => {
  res.json({ success: true, company });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/employees', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/work-reports', workReportRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// Catch-all 404 & Centralized Error Middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database & bootstrap default admin
await connectDb();
await bootstrapAdmin();

if (process.argv[1]?.endsWith('server.js') || (!process.env.FUNCTION_TARGET && !process.env.K_SERVICE)) {
  app.listen(port, () => {
    console.log(`====================================================`);
    console.log(`🚀 EHBVS SOLUTIONS — EMPLOYEE MONITORING SYSTEM API`);
    console.log(`   Listening at: http://localhost:${port}`);
    console.log(`   Database Mode: ${DB_MODE}`);
    console.log(`====================================================`);
  });
}

export default app;
