import { Router } from 'express';
import {
    registerStudent,
    registerCompany,
    registerAdmin,
    login,
    getCurrentUser
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register/student', registerStudent);
router.post('/register/company', registerCompany);
router.post('/register/admin', registerAdmin);
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);

export default router;
