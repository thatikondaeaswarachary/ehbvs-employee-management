import express from 'express';
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave
} from '../controllers/leaveController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.post('/', authenticate, applyLeave);
router.get('/my', authenticate, getMyLeaves);
router.get('/', authenticate, requireAdmin, getAllLeaves);
router.patch('/:id/approve', authenticate, requireAdmin, approveLeave);
router.patch('/:id/reject', authenticate, requireAdmin, rejectLeave);

export default router;
