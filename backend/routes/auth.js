import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { login, logout, profile, register } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validators/authValidators.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/profile', authMiddleware, profile);

export default router;
