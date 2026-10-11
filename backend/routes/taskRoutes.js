import express from 'express';
import {
  getTasks,
  getMyTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/my', authenticate, getMyTasks);
router.get('/', authenticate, requireAdmin, getTasks);
router.get('/:id', authenticate, getTaskById);
router.post('/', authenticate, requireAdmin, createTask);
router.put('/:id', authenticate, requireAdmin, updateTask);
router.patch('/:id/status', authenticate, updateTaskStatus);
router.delete('/:id', authenticate, requireAdmin, deleteTask);

export default router;
