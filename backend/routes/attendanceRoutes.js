import express from 'express';
import {
  checkIn,
  checkOut,
  updateWorkStatus,
  getMyAttendance,
  getAllAttendance,
  getEmployeeAttendance,
  updateAttendanceRecord,
  adminMarkAttendance
} from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Employee self actions
router.post('/check-in', authenticate, checkIn);
router.post('/check-out', authenticate, checkOut);
router.patch('/status', authenticate, updateWorkStatus);
router.get('/my', authenticate, getMyAttendance);

// Admin actions
router.get('/', authenticate, requireAdmin, getAllAttendance);
router.post('/admin-mark', authenticate, requireAdmin, adminMarkAttendance);
router.post('/', authenticate, requireAdmin, adminMarkAttendance);
router.get('/:employeeId', authenticate, requireAdmin, getEmployeeAttendance);
router.put('/:id', authenticate, requireAdmin, updateAttendanceRecord);

export default router;
