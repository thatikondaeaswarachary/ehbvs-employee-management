import express from 'express';
import {
  getDashboardMetrics,
  getAttendanceReport,
  getWorkHoursReport,
  getTaskReport,
  getLeaveReport,
  getEmployeeSummaryReport,
  exportCsv
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/dashboard', authenticate, requireAdmin, getDashboardMetrics);
router.get('/attendance', authenticate, requireAdmin, getAttendanceReport);
router.get('/work-hours', authenticate, requireAdmin, getWorkHoursReport);
router.get('/tasks', authenticate, requireAdmin, getTaskReport);
router.get('/leave', authenticate, requireAdmin, getLeaveReport);
router.get('/employees', authenticate, requireAdmin, getEmployeeSummaryReport);
router.get('/export/:type', authenticate, requireAdmin, exportCsv);

export default router;
