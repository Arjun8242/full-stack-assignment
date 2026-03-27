import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { signup, login, logout, getDashboard } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/dashboard', authMiddleware, getDashboard);

export default router;
