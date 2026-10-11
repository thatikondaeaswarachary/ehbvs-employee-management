import express from 'express';
import {
  getSettings,
  updateSettings,
  getAuditLogs
} from '../controllers/settingsController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/', authenticate, requireAdmin, getSettings);
router.put('/', authenticate, requireAdmin, updateSettings);
router.get('/audit-logs', authenticate, requireAdmin, getAuditLogs);

export default router;
