import express from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement
} from '../controllers/announcementController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/', authenticate, getAnnouncements);
router.post('/', authenticate, requireAdmin, createAnnouncement);
router.put('/:id', authenticate, requireAdmin, updateAnnouncement);
router.delete('/:id', authenticate, requireAdmin, deleteAnnouncement);

export default router;
