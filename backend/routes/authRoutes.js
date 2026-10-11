import express from 'express';
import {
  login,
  register,
  getMe,
  logout,
  forgotPassword,
  heartbeat,
  updateProfile
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/heartbeat', authenticate, heartbeat);
router.put('/profile', authenticate, updateProfile);

export default router;
