import express from 'express';
import {
  submitWorkReport,
  getMyWorkReports,
  getAllWorkReports,
  getWorkReportById
} from '../controllers/workReportController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.post('/', authenticate, submitWorkReport);
router.get('/my', authenticate, getMyWorkReports);
router.get('/', authenticate, requireAdmin, getAllWorkReports);
router.get('/:id', authenticate, getWorkReportById);

export default router;
