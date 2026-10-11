import express from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  resetEmployeePassword,
  deleteEmployee
} from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/', authenticate, requireAdmin, getEmployees);
router.get('/:id', authenticate, getEmployeeById);
router.post('/', authenticate, requireAdmin, createEmployee);
router.put('/:id', authenticate, requireAdmin, updateEmployee);
router.patch('/:id/status', authenticate, requireAdmin, updateEmployeeStatus);
router.post('/:id/reset-password', authenticate, requireAdmin, resetEmployeePassword);
router.delete('/:id', authenticate, requireAdmin, deleteEmployee);

export default router;
